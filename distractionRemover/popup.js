/**
 * Distraction Remover - Popup Script
 * 
 * Handles the popup UI interactions and communicates with
 * Chrome Storage API to persist the Study Mode state.
 */

// ============================================
// DOM ELEMENTS
// ============================================

const toggleSwitch = document.getElementById('study-mode-toggle');
const statusText = document.getElementById('status-text');
const featureItems = document.querySelectorAll('.feature-item');

// ============================================
// UI UPDATE FUNCTIONS
// ============================================

/**
 * Updates the UI to reflect the current Study Mode state
 * @param {boolean} isEnabled - Whether Study Mode is enabled
 */
function updateUI(isEnabled) {
  // Update toggle switch
  toggleSwitch.checked = isEnabled;
  
  // Update status text
  statusText.textContent = isEnabled ? 'Enabled' : 'Disabled';
  statusText.className = `toggle-status ${isEnabled ? 'active' : 'inactive'}`;
  
  // Update feature items
  featureItems.forEach(item => {
    const icon = item.querySelector('.feature-icon');
    
    if (isEnabled) {
      item.classList.add('active');
      icon.textContent = '✓';
    } else {
      item.classList.remove('active');
      icon.textContent = '○';
    }
  });
}

// ============================================
// STORAGE FUNCTIONS
// ============================================

/**
 * Loads the saved Study Mode state from Chrome Storage
 */
function loadState() {
  chrome.storage.sync.get(['studyModeEnabled'], (result) => {
    if (chrome.runtime.lastError) {
      console.error('Error loading state:', chrome.runtime.lastError);
      updateUI(false);
      return;
    }
    
    const isEnabled = result.studyModeEnabled === true;
    updateUI(isEnabled);
  });
}

/**
 * Saves the Study Mode state to Chrome Storage
 * @param {boolean} isEnabled - Whether Study Mode should be enabled
 */
function saveState(isEnabled) {
  chrome.storage.sync.set({ studyModeEnabled: isEnabled }, () => {
    if (chrome.runtime.lastError) {
      console.error('Error saving state:', chrome.runtime.lastError);
      return;
    }
    
    console.log(`Study Mode ${isEnabled ? 'enabled' : 'disabled'}`);
  });
}

// ============================================
// EVENT LISTENERS
// ============================================

/**
 * Handle toggle switch changes
 */
toggleSwitch.addEventListener('change', (event) => {
  const isEnabled = event.target.checked;
  
  // Update UI immediately for responsiveness
  updateUI(isEnabled);
  
  // Save state to storage (this will trigger the content script)
  saveState(isEnabled);
});

/**
 * Listen for storage changes (in case state changes from another tab)
 */
chrome.storage.onChanged.addListener((changes, namespace) => {
  if (namespace === 'sync' && changes.studyModeEnabled) {
    updateUI(changes.studyModeEnabled.newValue);
  }
});

// ============================================
// INITIALIZATION
// ============================================

/**
 * Initialize the popup
 */
function init() {
  loadState();
}

// Start when DOM is ready
document.addEventListener('DOMContentLoaded', init);

