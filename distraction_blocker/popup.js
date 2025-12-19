/**
 * Popup Script
 * Handles all UI interactions and communicates with background service worker
 */

// ============== DOM ELEMENTS ==============
const elements = {
  // Views
  timerView: document.getElementById('timerView'),
  settingsView: document.getElementById('settingsView'),
  
  // Timer elements
  sessionBadge: document.getElementById('sessionBadge'),
  sessionType: document.getElementById('sessionType'),
  timeDisplay: document.getElementById('timeDisplay'),
  timerProgress: document.getElementById('timerProgress'),
  sessionCount: document.getElementById('sessionCount'),
  
  // Control buttons
  mainBtn: document.getElementById('mainBtn'),
  mainBtnText: document.getElementById('mainBtnText'),
  resetBtn: document.getElementById('resetBtn'),
  skipBtn: document.getElementById('skipBtn'),
  settingsBtn: document.getElementById('settingsBtn'),
  backBtn: document.getElementById('backBtn'),
  
  // Motivation
  motivationCard: document.getElementById('motivationCard'),
  motivationText: document.getElementById('motivationText'),
  
  // Settings
  studyTime: document.getElementById('studyTime'),
  breakTime: document.getElementById('breakTime'),
  soundToggle: document.getElementById('soundToggle'),
  blockedSites: document.getElementById('blockedSites'),
  newSiteInput: document.getElementById('newSiteInput'),
  addSiteBtn: document.getElementById('addSiteBtn'),
  totalSessions: document.getElementById('totalSessions'),
  saveSettingsBtn: document.getElementById('saveSettingsBtn'),
  
  // Audio
  bellSound: document.getElementById('bellSound')
};

// ============== STATE ==============
let currentState = null;
let currentSettings = null;

// Timer ring circumference for progress calculation
const CIRCUMFERENCE = 2 * Math.PI * 90; // 90 is the radius

// ============== INITIALIZATION ==============
document.addEventListener('DOMContentLoaded', init);

async function init() {
  await loadState();
  setupEventListeners();
  setupMessageListener();
}

async function loadState() {
  try {
    const response = await chrome.runtime.sendMessage({ action: 'getState' });
    currentState = response.timerState;
    currentSettings = response.settings;
    updateUI();
    loadSettingsUI();
  } catch (error) {
    console.error('Error loading state:', error);
    showMotivation('Could not connect to timer. Try reloading the extension.', false);
  }
}

// ============== EVENT LISTENERS ==============
function setupEventListeners() {
  // Navigation
  elements.settingsBtn.addEventListener('click', showSettings);
  elements.backBtn.addEventListener('click', showTimer);
  
  // Timer controls
  elements.mainBtn.addEventListener('click', handleMainButton);
  elements.resetBtn.addEventListener('click', handleReset);
  elements.skipBtn.addEventListener('click', handleSkip);
  
  // Settings
  elements.addSiteBtn.addEventListener('click', handleAddSite);
  elements.newSiteInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') handleAddSite();
  });
  elements.saveSettingsBtn.addEventListener('click', handleSaveSettings);
}

function setupMessageListener() {
  chrome.runtime.onMessage.addListener((message) => {
    switch (message.action) {
      case 'timerTick':
        currentState = message.timerState;
        updateTimerDisplay();
        break;
        
      case 'sessionEnded':
        handleSessionEnded(message);
        break;
        
      case 'playSound':
        playBellSound();
        break;
    }
  });
}

// ============== TIMER CONTROLS ==============
async function handleMainButton() {
  if (!currentState.isRunning) {
    // Start timer
    await chrome.runtime.sendMessage({ action: 'startTimer' });
  } else if (currentState.isPaused) {
    // Resume timer
    await chrome.runtime.sendMessage({ action: 'resumeTimer' });
  } else {
    // Pause timer
    await chrome.runtime.sendMessage({ action: 'pauseTimer' });
  }
  await loadState();
}

async function handleReset() {
  if (confirm('Reset the timer? This will end your current session.')) {
    await chrome.runtime.sendMessage({ action: 'resetTimer' });
    showMotivation('Ready to focus? Start your session!', false);
    await loadState();
  }
}

async function handleSkip() {
  await chrome.runtime.sendMessage({ action: 'skipSession' });
  await loadState();
}

// ============== UI UPDATES ==============
function updateUI() {
  updateTimerDisplay();
  updateButtonState();
  updateSessionInfo();
}

function updateTimerDisplay() {
  if (!currentState) return;
  
  // Update time text
  const minutes = Math.floor(currentState.timeRemaining / 60);
  const seconds = currentState.timeRemaining % 60;
  elements.timeDisplay.textContent = 
    `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  
  // Update progress ring
  const progress = currentState.timeRemaining / currentState.totalTime;
  const offset = CIRCUMFERENCE * (1 - progress);
  elements.timerProgress.style.strokeDasharray = CIRCUMFERENCE;
  elements.timerProgress.style.strokeDashoffset = offset;
  
  // Update colors based on session type
  if (currentState.isStudySession) {
    elements.sessionBadge.classList.remove('break');
    elements.sessionType.textContent = 'Study Time';
    elements.timerProgress.classList.remove('break');
    elements.mainBtn.classList.remove('break');
  } else {
    elements.sessionBadge.classList.add('break');
    elements.sessionType.textContent = 'Break Time';
    elements.timerProgress.classList.add('break');
    elements.mainBtn.classList.add('break');
  }
}

function updateButtonState() {
  if (!currentState) return;
  
  elements.mainBtn.classList.remove('running', 'paused');
  
  if (!currentState.isRunning) {
    elements.mainBtnText.textContent = 'Start';
    elements.mainBtn.classList.remove('running', 'paused');
  } else if (currentState.isPaused) {
    elements.mainBtn.classList.add('paused');
  } else {
    elements.mainBtn.classList.add('running');
  }
}

function updateSessionInfo() {
  if (!currentSettings) return;
  
  const sessionNum = (currentSettings.sessionsCompleted || 0) + 1;
  elements.sessionCount.textContent = `Session #${sessionNum}`;
}

function showMotivation(message, isSuccess = true) {
  elements.motivationText.textContent = message;
  elements.motivationCard.classList.toggle('success', isSuccess);
}

function handleSessionEnded(message) {
  if (message.type === 'study') {
    // Show motivational message
    const motivationalMessages = [
      "Amazing work! Your dedication is building something incredible. 🌟",
      "You're making real progress! Each focused session brings you closer to your goals. 💪",
      "Brilliant effort! Your future self will thank you for this focus time. 🚀",
      "You crushed it! Taking breaks helps your brain consolidate what you've learned. 🧠",
      "Fantastic session! Remember: small consistent efforts lead to massive results. ✨",
      "Well done! You're developing discipline that will serve you for life. 🎯",
      "Great focus! Your commitment to growth is truly inspiring. 🌱",
      "Excellent work! Every minute of focus is an investment in yourself. 💎",
      "You did it! Rest well, then come back stronger. 🏆",
      "Superb effort! You're building momentum that will carry you far. 🔥"
    ];
    const randomMessage = motivationalMessages[Math.floor(Math.random() * motivationalMessages.length)];
    showMotivation(randomMessage, true);
    
    // Update session count
    elements.sessionCount.textContent = `Session #${message.sessionsCompleted + 1}`;
  } else {
    // Break ended
    showMotivation('Break time is over! Ready to focus again? 🚀', true);
  }
  
  // Play sound
  playBellSound();
  
  // Reload state to update UI
  loadState();
}

function playBellSound() {
  if (currentSettings?.soundEnabled) {
    elements.bellSound.currentTime = 0;
    elements.bellSound.play().catch(() => {
      // Audio play might be blocked by browser
      console.log('Could not play sound - browser may have blocked autoplay');
    });
  }
}

// ============== NAVIGATION ==============
function showSettings() {
  elements.timerView.classList.remove('active');
  elements.settingsView.classList.add('active');
  loadSettingsUI();
}

function showTimer() {
  elements.settingsView.classList.remove('active');
  elements.timerView.classList.add('active');
  loadState();
}

// ============== SETTINGS ==============
function loadSettingsUI() {
  if (!currentSettings) return;
  
  elements.studyTime.value = currentSettings.studyTime;
  elements.breakTime.value = currentSettings.breakTime;
  elements.soundToggle.checked = currentSettings.soundEnabled;
  elements.totalSessions.textContent = currentSettings.sessionsCompleted || 0;
  
  renderBlockedSites();
}

function renderBlockedSites() {
  elements.blockedSites.innerHTML = '';
  if (!currentSettings) return;
  
  (currentSettings.blockedSites || []).forEach((site) => {
    const tag = document.createElement('span');
    tag.className = 'site-tag';
    tag.innerHTML = `
      ${site}
      <button class="remove-site" data-site="${site}">×</button>
    `;
    elements.blockedSites.appendChild(tag);
  });
  
  // Add remove event listeners
  elements.blockedSites.querySelectorAll('.remove-site').forEach((btn) => {
    btn.addEventListener('click', () => {
      const site = btn.dataset.site;
      currentSettings.blockedSites = currentSettings.blockedSites.filter(s => s !== site);
      renderBlockedSites();
    });
  });
}

function handleAddSite() {
  let site = elements.newSiteInput.value.trim().toLowerCase();
  
  if (!site || !currentSettings) return;
  
  // Clean up the URL
  site = site.replace(/^(https?:\/\/)?(www\.)?/, '').replace(/\/$/, '');
  
  // Initialize blockedSites array if it doesn't exist
  if (!currentSettings.blockedSites) {
    currentSettings.blockedSites = [];
  }
  
  if (!currentSettings.blockedSites.includes(site)) {
    currentSettings.blockedSites.push(site);
    renderBlockedSites();
  }
  
  elements.newSiteInput.value = '';
}

async function handleSaveSettings() {
  const newSettings = {
    studyTime: parseInt(elements.studyTime.value) || 25,
    breakTime: parseInt(elements.breakTime.value) || 5,
    soundEnabled: elements.soundToggle.checked,
    blockedSites: currentSettings?.blockedSites || []
  };
  
  // Validate
  if (newSettings.studyTime < 1 || newSettings.studyTime > 120) {
    alert('Study time must be between 1 and 120 minutes');
    return;
  }
  
  if (newSettings.breakTime < 1 || newSettings.breakTime > 30) {
    alert('Break time must be between 1 and 30 minutes');
    return;
  }
  
  elements.saveSettingsBtn.textContent = 'Saving...';
  elements.saveSettingsBtn.disabled = true;
  
  try {
    await chrome.runtime.sendMessage({
      action: 'updateSettings',
      settings: newSettings
    });
    
    currentSettings = { ...currentSettings, ...newSettings };
    
    elements.saveSettingsBtn.textContent = 'Saved! ✓';
    setTimeout(() => {
      elements.saveSettingsBtn.textContent = 'Save Settings';
      elements.saveSettingsBtn.disabled = false;
    }, 1500);
  } catch (error) {
    elements.saveSettingsBtn.textContent = 'Error saving';
    elements.saveSettingsBtn.disabled = false;
  }
}

