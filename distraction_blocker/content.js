/**
 * Content Script
 * Injected into web pages to provide additional blocking functionality
 * This is a backup in case declarativeNetRequest doesn't catch something
 */

// Check if this page should be blocked
async function checkIfBlocked() {
  try {
    const response = await chrome.runtime.sendMessage({ action: 'getState' });
    
    if (!response) return;
    
    const { timerState, settings } = response;
    
    // Only block during active study sessions
    if (!timerState.isRunning || timerState.isPaused || !timerState.isStudySession) {
      return;
    }
    
    // Check if current site is in blocked list
    const currentHost = window.location.hostname.toLowerCase();
    const isBlocked = settings.blockedSites.some(site => {
      const siteClean = site.toLowerCase().replace(/^www\./, '');
      const hostClean = currentHost.replace(/^www\./, '');
      return hostClean === siteClean || hostClean.endsWith('.' + siteClean);
    });
    
    if (isBlocked) {
      // Redirect to blocked page
      window.location.href = chrome.runtime.getURL('blocked.html');
    }
  } catch (error) {
    // Extension context may be invalidated, ignore
    console.log('Focus Timer: Could not check blocking status');
  }
}

// Run check on page load
checkIfBlocked();

// Listen for messages from background
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.action === 'checkBlocking') {
    checkIfBlocked();
  }
});

// Periodic check in case the timer starts while on a blocked page
setInterval(checkIfBlocked, 5000);

