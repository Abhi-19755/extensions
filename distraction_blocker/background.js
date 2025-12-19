/**
 * Background Service Worker (FIXED)
 * Single source of truth for timer
 * Drift-free using timestamps
 */


/* ================= DEFAULT SETTINGS ================= */
const DEFAULT_SETTINGS = {
  studyTime: 25,
  breakTime: 5,
  blockedSites: [
    'youtube.com',
    'instagram.com',
    'reddit.com',
    'twitter.com',
    'x.com',
    'tiktok.com',
    'facebook.com',
    'netflix.com',
    'twitch.tv'
  ],
  soundEnabled: true,
  sessionsCompleted: 0
};

/* ================= TIMER STATE ================= */
let timerState = {
  isRunning: false,
  isPaused: false,
  isStudySession: true,
  endTime: null,       // 🔥 IMPORTANT
  timeRemaining: 0,
  totalTime: 0,
  intervalId: null
};

/* ================= INSTALL ================= */
chrome.runtime.onInstalled.addListener(async () => {
  const settings = await chrome.storage.sync.get('settings');
  if (!settings.settings) {
    await chrome.storage.sync.set({ settings: DEFAULT_SETTINGS });
  }
  await chrome.storage.local.set({ timerState });
});

/* ================= STARTUP RESTORE ================= */
chrome.runtime.onStartup.addListener(async () => {
  const stored = await chrome.storage.local.get('timerState');
  if (stored.timerState?.isRunning) {
    timerState = stored.timerState;
    startTimerInterval();
  }
});

/* ================= MESSAGE HANDLER ================= */
chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
  handleMessage(msg, sendResponse);
  return true;
});

async function handleMessage(msg, sendResponse) {
  switch (msg.action) {
    case 'getState':
      const settings = await getSettings();
      sendResponse({ timerState, settings });
      break;

    case 'startTimer':
      await startStudySession();
      sendResponse({ success: true });
      break;

    case 'pauseTimer':
      timerState.isPaused = true;
      await saveTimerState();
      sendResponse({ success: true });
      break;

    case 'resumeTimer':
      timerState.isPaused = false;
      startTimerInterval();
      await saveTimerState();
      sendResponse({ success: true });
      break;

    case 'resetTimer':
      await resetTimer();
      sendResponse({ success: true });
      break;

    case 'skipSession':
      await skipSession();
      sendResponse({ success: true });
      break;

    case 'updateSettings':
      await chrome.storage.sync.set({ settings: msg.settings });
      sendResponse({ success: true });
      break;

  }
}

/* ================= TIMER CORE ================= */
async function startStudySession() {
  const settings = await getSettings();

  timerState.isRunning = true;
  timerState.isPaused = false;
  timerState.isStudySession = true;
  timerState.totalTime = settings.studyTime * 60;
  timerState.endTime = Date.now() + timerState.totalTime * 1000;

  await updateBlockingRules(true);
  await saveTimerState();
  startTimerInterval();
}

function startTimerInterval() {
  if (timerState.intervalId) return;

  timerState.intervalId = setInterval(async () => {
    if (!timerState.isRunning || timerState.isPaused) return;

    const diff = Math.floor((timerState.endTime - Date.now()) / 1000);
    timerState.timeRemaining = Math.max(diff, 0);

    chrome.runtime.sendMessage({
      action: 'timerTick',
      timerState
    }).catch(() => {});

    if (timerState.timeRemaining <= 0) {
      clearInterval(timerState.intervalId);
      timerState.intervalId = null;
      await handleSessionEnd();
    }

    await saveTimerState();
  }, 1000);
}

/* ================= SESSION SWITCH ================= */
async function handleSessionEnd() {
  const settings = await getSettings();

  if (timerState.isStudySession) {
    settings.sessionsCompleted++;
    await chrome.storage.sync.set({ settings });

    timerState.isStudySession = false;
    timerState.totalTime = settings.breakTime * 60;
    timerState.endTime = Date.now() + timerState.totalTime * 1000;

    await updateBlockingRules(false);

    chrome.runtime.sendMessage({
      action: 'sessionEnded',
      type: 'study'
    }).catch(() => {});
  } else {
    timerState.isStudySession = true;
    timerState.totalTime = settings.studyTime * 60;
    timerState.endTime = Date.now() + timerState.totalTime * 1000;

    await updateBlockingRules(true);

    chrome.runtime.sendMessage({
      action: 'sessionEnded',
      type: 'break'
    }).catch(() => {});
  }

  startTimerInterval();
}

/* ================= SKIP SESSION ================= */
async function skipSession() {
  if (!timerState.isRunning) return;
  
  clearInterval(timerState.intervalId);
  timerState.intervalId = null;
  await handleSessionEnd();
}

/* ================= RESET ================= */
async function resetTimer() {
  clearInterval(timerState.intervalId);
  timerState = {
    isRunning: false,
    isPaused: false,
    isStudySession: true,
    endTime: null,
    timeRemaining: 0,
    totalTime: 0,
    intervalId: null
  };
  await updateBlockingRules(false);
  await saveTimerState();
}

/* ================= BLOCKING ================= */
async function updateBlockingRules(enable) {
  const settings = await getSettings();
  const rules = await chrome.declarativeNetRequest.getDynamicRules();
  if (rules.length) {
    await chrome.declarativeNetRequest.updateDynamicRules({
      removeRuleIds: rules.map(r => r.id)
    });
  }
  if (!enable) return;

  const newRules = settings.blockedSites.flatMap((site, i) => ([
    {
      id: i * 2 + 1,
      priority: 1,
      action: { type: 'redirect', redirect: { extensionPath: '/blocked.html' } },
      condition: { urlFilter: `*://${site}/*`, resourceTypes: ['main_frame'] }
    },
    {
      id: i * 2 + 2,
      priority: 1,
      action: { type: 'redirect', redirect: { extensionPath: '/blocked.html' } },
      condition: { urlFilter: `*://*.${site}/*`, resourceTypes: ['main_frame'] }
    }
  ]));

  await chrome.declarativeNetRequest.updateDynamicRules({ addRules: newRules });
}

/* ================= HELPERS ================= */
async function getSettings() {
  const res = await chrome.storage.sync.get('settings');
  return res.settings || DEFAULT_SETTINGS;
}

async function saveTimerState() {
  const safe = { ...timerState, intervalId: null };
  await chrome.storage.local.set({ timerState: safe });
}

/* ================= ALARM SAFETY ================= */
chrome.alarms.create('timerKeepAlive', { periodInMinutes: 0.5 });
chrome.alarms.onAlarm.addListener(async () => {
  if (timerState.isRunning && !timerState.intervalId) {
    startTimerInterval();
  }
});
