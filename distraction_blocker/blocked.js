/**
 * Blocked Page Script
 * Handles timer display and motivational quotes on the blocked page
 */

// Motivational quotes
const quotes = [
  "The secret of getting ahead is getting started.",
  "Focus on being productive instead of busy.",
  "Success is the sum of small efforts repeated day in and day out.",
  "The only way to do great work is to love what you do.",
  "Don't watch the clock; do what it does. Keep going.",
  "Your future is created by what you do today, not tomorrow.",
  "The harder you work for something, the greater you'll feel when you achieve it.",
  "Dreams don't work unless you do.",
  "Push yourself, because no one else is going to do it for you.",
  "Great things never come from comfort zones.",
  "It's not about perfect. It's about effort.",
  "The expert in anything was once a beginner."
];

// Show random quote
function showRandomQuote() {
  const quoteEl = document.getElementById('quote');
  if (quoteEl) {
    quoteEl.textContent = quotes[Math.floor(Math.random() * quotes.length)];
  }
}

// Get timer from background
async function updateTimer() {
  try {
    const response = await chrome.runtime.sendMessage({ action: 'getState' });
    if (response && response.timerState) {
      const { timeRemaining, isStudySession, isRunning } = response.timerState;
      const minutes = Math.floor(timeRemaining / 60);
      const seconds = timeRemaining % 60;
      
      const timerEl = document.getElementById('timer');
      if (timerEl) {
        timerEl.textContent = 
          `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
      }
      
      // If not in study session or timer not running, redirect back
      if (!isStudySession || !isRunning) {
        history.back();
      }
    }
  } catch (e) {
    console.log('Could not get timer state:', e);
  }
}

// Listen for session changes
function setupMessageListener() {
  chrome.runtime.onMessage.addListener((message) => {
    if (message.action === 'sessionEnded' && message.type === 'study') {
      // Break started, allow access
      history.back();
    }
  });
}

// Go back button handler
function setupGoBackButton() {
  const goBackBtn = document.getElementById('goBackBtn');
  if (goBackBtn) {
    goBackBtn.addEventListener('click', () => {
      history.back();
    });
  }
}

// Initialize
document.addEventListener('DOMContentLoaded', () => {
  showRandomQuote();
  updateTimer();
  setupMessageListener();
  setupGoBackButton();
  
  // Update timer every second
  setInterval(updateTimer, 1000);
});

