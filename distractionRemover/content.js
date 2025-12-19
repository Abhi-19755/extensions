/**
 * Distraction Remover - Content Script
 * 
 * This script runs on YouTube pages and removes distracting elements
 * when Study Mode is enabled. It uses MutationObserver to handle
 * YouTube's dynamic SPA content loading.
 */

// ============================================
// CONFIGURATION - Selectors for distracting elements
// ============================================

const DISTRACTION_SELECTORS = {
  // Home page recommendations
  homeRecommendations: [
    'ytd-rich-grid-renderer',                    // Main grid of recommended videos
    'ytd-rich-item-renderer',                    // Individual recommended video cards
    '#contents.ytd-rich-grid-renderer',          // Contents container
  ],
  
  // Right sidebar suggestions (while watching)
  sidebarSuggestions: [
    'ytd-watch-next-secondary-results-renderer', // Entire sidebar
    '#secondary.ytd-watch-flexy',                // Secondary column container
    '#related',                                   // Related videos section
  ],
  
  // Shorts section
  shorts: [
    'ytd-reel-shelf-renderer',                   // Shorts shelf on home
    'ytd-rich-shelf-renderer[is-shorts]',        // Shorts in rich shelf
    '[is-shorts]',                               // Any shorts element
    'ytd-shorts',                                // Shorts player page
    'a[title="Shorts"]',                         // Shorts navigation link
    'ytd-mini-guide-entry-renderer[aria-label="Shorts"]', // Shorts in mini guide
    'ytd-guide-entry-renderer:has(a[title="Shorts"])',    // Shorts in full guide
  ],
  
  // Comments section
  comments: [
    'ytd-comments',                              // Main comments container
    '#comments',                                  // Comments section ID
    'ytd-comment-thread-renderer',               // Individual comment threads
  ],
  
  // Additional distractions
  extras: [
    'ytd-merch-shelf-renderer',                  // Merchandise shelf
    'ytd-ticket-shelf-renderer',                 // Ticket promotions
    'ytd-brand-video-shelf-renderer',            // Branded content
    '#chat-container',                           // Live chat
    'ytd-live-chat-frame',                       // Live chat frame
    '#donation-shelf',                           // Donation prompts
    'ytd-engagement-panel-section-list-renderer[target-id="engagement-panel-macro-markers-description-chapters"]', // Chapters (optional)
  ]
};

// Elements to always keep visible
const PRESERVE_SELECTORS = [
  '#search',                                     // Search bar
  '#search-form',                                // Search form
  'ytd-searchbox',                               // Search box component
  '#player',                                     // Video player
  '#movie_player',                               // Main player
  'ytd-player',                                  // Player container
  '#masthead-container',                         // Top navigation bar
  'ytd-masthead',                                // Masthead component
];

// ============================================
// STATE MANAGEMENT
// ============================================

let studyModeEnabled = false;
let observer = null;
let cleanupInterval = null;

// ============================================
// HELPER FUNCTIONS
// ============================================

/**
 * Hides an element by setting display to none
 * @param {Element} element - DOM element to hide
 */
function hideElement(element) {
  if (element && element.style) {
    element.style.setProperty('display', 'none', 'important');
    element.setAttribute('data-distraction-removed', 'true');
  }
}

/**
 * Shows a previously hidden element
 * @param {Element} element - DOM element to show
 */
function showElement(element) {
  if (element && element.style) {
    element.style.removeProperty('display');
    element.removeAttribute('data-distraction-removed');
  }
}

/**
 * Queries and hides all elements matching a selector
 * @param {string} selector - CSS selector
 */
function hideBySelector(selector) {
  try {
    const elements = document.querySelectorAll(selector);
    elements.forEach(hideElement);
  } catch (error) {
    // Invalid selector, skip silently
    console.debug(`[Distraction Remover] Invalid selector: ${selector}`);
  }
}

/**
 * Shows all elements that were hidden by this extension
 */
function restoreAllElements() {
  const hiddenElements = document.querySelectorAll('[data-distraction-removed="true"]');
  hiddenElements.forEach(showElement);
}

/**
 * Checks if an element should be preserved (not hidden)
 * @param {Element} element - DOM element to check
 * @returns {boolean} - True if element should be preserved
 */
function shouldPreserve(element) {
  return PRESERVE_SELECTORS.some(selector => {
    try {
      return element.matches(selector) || element.closest(selector);
    } catch {
      return false;
    }
  });
}

// ============================================
// MAIN DISTRACTION REMOVAL LOGIC
// ============================================

/**
 * Removes all distracting elements from the page
 */
function removeDistractions() {
  if (!studyModeEnabled) return;
  
  // Flatten all selectors into a single array
  const allSelectors = [
    ...DISTRACTION_SELECTORS.homeRecommendations,
    ...DISTRACTION_SELECTORS.sidebarSuggestions,
    ...DISTRACTION_SELECTORS.shorts,
    ...DISTRACTION_SELECTORS.comments,
    ...DISTRACTION_SELECTORS.extras,
  ];
  
  // Hide each distraction
  allSelectors.forEach(hideBySelector);
  
  // Special handling for home page - add custom message
  addStudyModeIndicator();
}

/**
 * Adds a visual indicator when Study Mode is active on home page
 */
function addStudyModeIndicator() {
  const isHomePage = window.location.pathname === '/' || window.location.pathname === '/feed/subscriptions';
  const existingIndicator = document.getElementById('study-mode-indicator');
  
  if (isHomePage && studyModeEnabled && !existingIndicator) {
    const primaryContent = document.querySelector('#primary') || document.querySelector('ytd-browse');
    
    if (primaryContent) {
      const indicator = document.createElement('div');
      indicator.id = 'study-mode-indicator';
      indicator.innerHTML = `
        <div style="
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          padding: 60px 20px;
          text-align: center;
          color: var(--yt-spec-text-primary, #0f0f0f);
          font-family: 'YouTube Sans', 'Roboto', sans-serif;
        ">
          <div style="
            font-size: 64px;
            margin-bottom: 20px;
          ">📚</div>
          <h2 style="
            font-size: 24px;
            font-weight: 500;
            margin: 0 0 12px 0;
            color: var(--yt-spec-text-primary, #0f0f0f);
          ">Study Mode Active</h2>
          <p style="
            font-size: 16px;
            color: var(--yt-spec-text-secondary, #606060);
            margin: 0;
            max-width: 400px;
            line-height: 1.5;
          ">Distractions have been removed. Use the search bar to find specific videos for your studies.</p>
        </div>
      `;
      
      // Insert at the beginning of primary content
      primaryContent.insertBefore(indicator, primaryContent.firstChild);
    }
  } else if (!studyModeEnabled && existingIndicator) {
    existingIndicator.remove();
  }
}

/**
 * Removes the study mode indicator
 */
function removeStudyModeIndicator() {
  const indicator = document.getElementById('study-mode-indicator');
  if (indicator) {
    indicator.remove();
  }
}

// ============================================
// MUTATION OBSERVER SETUP
// ============================================

/**
 * Creates and starts the MutationObserver to handle dynamic content
 */
function startObserver() {
  if (observer) {
    observer.disconnect();
  }
  
  observer = new MutationObserver((mutations) => {
    if (!studyModeEnabled) return;
    
    // Debounce the removal to avoid excessive calls
    let shouldClean = false;
    
    for (const mutation of mutations) {
      if (mutation.addedNodes.length > 0) {
        shouldClean = true;
        break;
      }
    }
    
    if (shouldClean) {
      // Use requestAnimationFrame for smooth performance
      requestAnimationFrame(removeDistractions);
    }
  });
  
  // Observe the entire document for changes
  observer.observe(document.body, {
    childList: true,
    subtree: true,
  });
}

/**
 * Stops the MutationObserver
 */
function stopObserver() {
  if (observer) {
    observer.disconnect();
    observer = null;
  }
}

// ============================================
// INTERVAL-BASED CLEANUP (Backup for SPA navigation)
// ============================================

/**
 * Starts periodic cleanup to catch any missed elements
 */
function startCleanupInterval() {
  if (cleanupInterval) {
    clearInterval(cleanupInterval);
  }
  
  // Run cleanup every 2 seconds as a safety net
  cleanupInterval = setInterval(() => {
    if (studyModeEnabled) {
      removeDistractions();
    }
  }, 2000);
}

/**
 * Stops the cleanup interval
 */
function stopCleanupInterval() {
  if (cleanupInterval) {
    clearInterval(cleanupInterval);
    cleanupInterval = null;
  }
}

// ============================================
// URL CHANGE DETECTION (YouTube SPA handling)
// ============================================

let lastUrl = location.href;

/**
 * Handles URL changes for YouTube's SPA navigation
 */
function handleUrlChange() {
  const currentUrl = location.href;
  
  if (currentUrl !== lastUrl) {
    lastUrl = currentUrl;
    
    // Re-apply removal after a short delay to let content load
    if (studyModeEnabled) {
      setTimeout(removeDistractions, 500);
      setTimeout(removeDistractions, 1500);
    }
  }
}

// Listen for popstate events (back/forward navigation)
window.addEventListener('popstate', handleUrlChange);

// Poll for URL changes (handles programmatic navigation)
setInterval(handleUrlChange, 1000);

// ============================================
// STUDY MODE TOGGLE
// ============================================

/**
 * Enables Study Mode
 */
function enableStudyMode() {
  studyModeEnabled = true;
  removeDistractions();
  startObserver();
  startCleanupInterval();
  console.log('[Distraction Remover] Study Mode ENABLED');
}

/**
 * Disables Study Mode
 */
function disableStudyMode() {
  studyModeEnabled = false;
  stopObserver();
  stopCleanupInterval();
  restoreAllElements();
  removeStudyModeIndicator();
  console.log('[Distraction Remover] Study Mode DISABLED');
}

// ============================================
// CHROME STORAGE INTEGRATION
// ============================================

/**
 * Loads the saved Study Mode state from Chrome Storage
 */
function loadSavedState() {
  chrome.storage.sync.get(['studyModeEnabled'], (result) => {
    if (chrome.runtime.lastError) {
      console.error('[Distraction Remover] Error loading state:', chrome.runtime.lastError);
      return;
    }
    
    // Default to false if not set
    const savedState = result.studyModeEnabled === true;
    
    if (savedState) {
      enableStudyMode();
    } else {
      disableStudyMode();
    }
  });
}

/**
 * Listens for changes to Study Mode state from the popup
 */
chrome.storage.onChanged.addListener((changes, namespace) => {
  if (namespace === 'sync' && changes.studyModeEnabled) {
    const newValue = changes.studyModeEnabled.newValue;
    
    if (newValue) {
      enableStudyMode();
    } else {
      disableStudyMode();
    }
  }
});

// ============================================
// INITIALIZATION
// ============================================

/**
 * Initializes the content script
 */
function init() {
  // Wait for DOM to be ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', loadSavedState);
  } else {
    loadSavedState();
  }
}

// Start the extension
init();

console.log('[Distraction Remover] Content script loaded');

