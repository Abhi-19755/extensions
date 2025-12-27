/**
 * Background Service Worker for Resume Scanner Extension
 * Handles message passing and data storage
 */

// Listen for messages from content script
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === 'JOB_DATA_EXTRACTED') {
    handleJobDataExtracted(message.jobData);
    sendResponse({ success: true });
  }
  return true; // Keep message channel open for async response
});

/**
 * Handle job data extracted from content script
 */
async function handleJobDataExtracted(jobData) {
  try {
    // Store job data in chrome.storage.local
    await chrome.storage.local.set({ jobData: jobData });
    
    // Notify popup if it's open (optional enhancement)
    // This allows real-time updates when user has popup open
    try {
      chrome.runtime.sendMessage({
        type: 'JOB_DATA_UPDATED',
        jobData: jobData
      }, () => {
        const err = chrome.runtime.lastError;
        if (err) {
          // Popup might not be open or other non-fatal error; ignore
        }
      });
    } catch (error) {
      // Ignore if popup is not open or messaging fails
    }
    
    console.log('Resume Scanner: Job data stored successfully');
  } catch (error) {
    console.error('Resume Scanner: Error storing job data', error);
  }
}

/**
 * Handle extension installation
 */
chrome.runtime.onInstalled.addListener((details) => {
  if (details.reason === 'install') {
    console.log('Resume Scanner extension installed');
    // Could show welcome page or set default settings here
  } else if (details.reason === 'update') {
    console.log('Resume Scanner extension updated');
  }
});

/**
 * Handle tab updates to re-extract job data when navigating
 */
chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
  if (changeInfo.status === 'complete' && tab.url) {
    // Check if URL is a supported job portal
    if (tab.url.includes('naukri.com') || tab.url.includes('indeed.com')) {
      // Content script will automatically extract on page load
      // This is just for logging/debugging
      console.log('Resume Scanner: Detected job portal page', tab.url);
    }
  }
});

