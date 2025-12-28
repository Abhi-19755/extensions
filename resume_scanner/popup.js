// DOM Elements
const resumeTextarea = document.getElementById('resumeText');
const fileInput = document.getElementById('fileInput');
const scanButton = document.getElementById('scanButton');
const scanButtonText = document.getElementById('scanButtonText');
const scanButtonLoader = document.getElementById('scanButtonLoader');
const errorMessage = document.getElementById('errorMessage');
const results = document.getElementById('results');
const loadingState = document.getElementById('loadingState');
const jobInfo = document.getElementById('jobInfo');
const jobTitle = document.getElementById('jobTitle');
const jobSource = document.getElementById('jobSource');
const jobOverview = document.getElementById('jobOverview');
const jobOverviewText = document.getElementById('jobOverviewText');
const toggleJobOverview = document.getElementById('toggleJobOverview');
const refreshJobBtn = document.getElementById('refreshJobBtn');
const matchPercentage = document.getElementById('matchPercentage');
const scoreCircle = document.getElementById('scoreCircle');
const matchedSkills = document.getElementById('matchedSkills');
const missingSkills = document.getElementById('missingSkills');
const suggestions = document.getElementById('suggestions');

// State
let currentJobData = null;
let resumeText = '';

// Initialize
document.addEventListener('DOMContentLoaded', async () => {
  await loadJobData();
  loadResumeFromStorage();
  setupEventListeners();
  updateScanButtonState();
});

/**
 * Load job data from background script storage
 */
async function loadJobData() {
  try {
    const result = await chrome.storage.local.get(['jobData']);
    if (result.jobData && result.jobData.description) {
      currentJobData = result.jobData;
      displayJobInfo(currentJobData);
      // Clear any previous errors
      if (errorMessage) {
        errorMessage.classList.add('hidden');
      }
    } else {
      // Show job info section even if no data, so user can see refresh button
      if (jobInfo) {
        jobInfo.classList.remove('hidden');
        if (jobTitle) jobTitle.textContent = 'Job description not found';
        if (jobSource) jobSource.textContent = 'Click Refresh to try again';
      }
      showError('No job description found. Make sure you\'re on a job listing page, then click the Refresh button above.');
    }
  } catch (error) {
    console.error('Error loading job data:', error);
    showError('Failed to load job data. Please refresh the page.');
  }
}

/**
 * Display job information in the popup
 */
function displayJobInfo(jobData) {
  if (!jobData) return;
  
  jobTitle.textContent = jobData.title || 'Job Listing';
  jobSource.textContent = `Source: ${jobData.source || 'Unknown'}`;
  // Show overview snippet
  try {
    const full = jobData.description || '';
    const max = 300;
    if (jobOverviewText) {
      if (full.length > max) {
        jobOverviewText.textContent = full.slice(0, max).trim() + '...';
        if (toggleJobOverview) {
          toggleJobOverview.textContent = 'Show more';
          toggleJobOverview.dataset.expanded = 'false';
          toggleJobOverview.classList.remove('hidden');
        }
      } else {
        jobOverviewText.textContent = full.trim();
        if (toggleJobOverview) toggleJobOverview.classList.add('hidden');
      }
    }
  } catch (e) {
    // ignore
  }

  if (jobOverview) jobOverview.classList.remove('hidden');
  jobInfo.classList.remove('hidden');
}

/**
 * Load resume text from chrome storage
 */
function loadResumeFromStorage() {
  chrome.storage.local.get(['resumeText'], (result) => {
    if (result.resumeText) {
      resumeTextarea.value = result.resumeText;
      resumeText = result.resumeText;
    }
  });
}

/**
 * Setup event listeners
 */
function setupEventListeners() {
  // Resume textarea input
  resumeTextarea.addEventListener('input', (e) => {
    resumeText = e.target.value;
    saveResumeToStorage();
    updateScanButtonState();
  });

  // File input change
  fileInput.addEventListener('change', handleFileUpload);

  // Scan button click
  scanButton.addEventListener('click', handleScanResume);

  // Refresh job data button
  if (refreshJobBtn) {
    refreshJobBtn.addEventListener('click', async () => {
      refreshJobBtn.disabled = true;
      refreshJobBtn.textContent = '🔄 Refreshing...';
      await refreshJobData();
      refreshJobBtn.disabled = false;
      refreshJobBtn.textContent = '🔄 Refresh';
    });
  }

  // Toggle overview expand/collapse
  if (toggleJobOverview) {
    toggleJobOverview.addEventListener('click', () => {
      if (!currentJobData || !currentJobData.description) return;
      const expanded = toggleJobOverview.dataset.expanded === 'true';
      if (expanded) {
        // collapse
        const max = 300;
        jobOverviewText.textContent = currentJobData.description.slice(0, max).trim() + '...';
        toggleJobOverview.textContent = 'Show more';
        toggleJobOverview.dataset.expanded = 'false';
      } else {
        // expand
        jobOverviewText.textContent = currentJobData.description;
        toggleJobOverview.textContent = 'Show less';
        toggleJobOverview.dataset.expanded = 'true';
      }
    });
  }

  // Listen for job data updates from content script
  chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.type === 'JOB_DATA_UPDATED') {
      currentJobData = message.jobData;
      displayJobInfo(currentJobData);
      updateScanButtonState();
    }
  });
}

/**
 * Handle file upload
 */
async function handleFileUpload(event) {
  const file = event.target.files[0];
  if (!file) return;

  // Show loading state for file processing
  const originalButtonText = scanButtonText ? scanButtonText.textContent : '';
  if (scanButtonText) scanButtonText.textContent = 'Processing file...';
  if (scanButtonLoader) scanButtonLoader.classList.remove('hidden');
  if (scanButton) scanButton.disabled = true;

  try {
    let text = '';

    // Handle text files
    if (file.type === 'text/plain' || file.name.endsWith('.txt')) {
      text = await file.text();
    } 
    // Handle PDF files using PDF.js
    else if (file.type === 'application/pdf' || file.name.endsWith('.pdf')) {
      // Wait for PDF.js to load if it's still loading
      let retries = 0;
      while (typeof pdfjsLib === 'undefined' && retries < 10) {
        await new Promise(resolve => setTimeout(resolve, 100));
        retries++;
      }

      // Check if PDF.js is loaded
      if (typeof pdfjsLib === 'undefined') {
        showError('PDF.js library failed to load. Please refresh the extension and try again.');
        fileInput.value = '';
        throw new Error('PDF.js not loaded');
      }

      // Configure PDF.js worker (using local worker file)
      pdfjsLib.GlobalWorkerOptions.workerSrc = chrome.runtime.getURL('pdf.worker.min.js');

      try {
        const arrayBuffer = await file.arrayBuffer();
        const loadingTask = pdfjsLib.getDocument({ data: arrayBuffer });
        const pdf = await loadingTask.promise;

        // Extract text from all pages
        const textParts = [];
        for (let pageNum = 1; pageNum <= pdf.numPages; pageNum++) {
          const page = await pdf.getPage(pageNum);
          const textContent = await page.getTextContent();
          const pageText = textContent.items
            .map(item => item.str)
            .join(' ');
          textParts.push(pageText);
        }
        
        text = textParts.join('\n\n');
        
        if (!text || text.trim().length === 0) {
          showError('The PDF file appears to be empty or contains no extractable text. It may be a scanned image PDF.');
          fileInput.value = '';
          throw new Error('Empty PDF');
        }
      } catch (pdfError) {
        console.error('PDF parsing error:', pdfError);
        let errorMsg = 'Failed to parse PDF file.';
        if (pdfError.message && pdfError.message.includes('password')) {
          errorMsg = 'The PDF file is password-protected. Please remove the password and try again.';
        } else if (pdfError.message && pdfError.message.includes('Invalid PDF')) {
          errorMsg = 'The file is not a valid PDF or may be corrupted.';
        }
        showError(errorMsg);
        fileInput.value = '';
        throw pdfError;
      }
    } 
    // Handle DOCX files - show message that DOCX parsing requires additional setup
    else if (file.name.endsWith('.docx') || file.name.endsWith('.doc')) {
      showError('DOCX parsing requires additional setup. Please paste your resume text directly or convert to text/PDF first.');
      fileInput.value = '';
      throw new Error('DOCX not supported');
    } 
    // Unsupported format
    else {
      showError('Unsupported file format. Please use .txt or .pdf files or paste your resume text directly.');
      fileInput.value = '';
      throw new Error('Unsupported format');
    }

    if (!text || text.trim().length === 0) {
      showError('The file appears to be empty. Please check the file and try again.');
      fileInput.value = '';
      throw new Error('Empty file');
    }

    resumeText = text.trim();
    resumeTextarea.value = resumeText;
    saveResumeToStorage();
    updateScanButtonState();
    
    // Clear any previous errors
    if (errorMessage) {
      errorMessage.classList.add('hidden');
    }

  } catch (err) {
    console.error('Error reading file:', err);
    showError('Failed to read file. Please ensure the file is valid and try again.');
    fileInput.value = ''; // Reset file input
  } finally {
    // Restore button state
    if (scanButtonText) scanButtonText.textContent = originalButtonText || 'Scan Resume';
    if (scanButtonLoader) scanButtonLoader.classList.add('hidden');
    if (scanButton) scanButton.disabled = false;
    updateScanButtonState();
  }
}


/**
 * Save resume text to chrome storage
 */
function saveResumeToStorage() {
  chrome.storage.local.set({ resumeText: resumeText });
}

/**
 * Refresh job data by requesting content script to re-extract
 */
async function refreshJobData() {
  try {
    // Get current active tab
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    
    if (!tab || !tab.url) {
      showError('Unable to access current tab. Please refresh the page.');
      return;
    }

    // Check if it's a supported job portal
    if (!tab.url.includes('naukri.com') && !tab.url.includes('indeed.com')) {
      showError('Please open a job listing page on Naukri or Indeed.');
      return;
    }

    // Inject content script to re-extract job data
    await chrome.scripting.executeScript({
      target: { tabId: tab.id },
      files: ['contentScript.js']
    });

    // Wait a bit for extraction to complete
    await new Promise(resolve => setTimeout(resolve, 1000));

    // Reload job data
    await loadJobData();
    updateScanButtonState();
  } catch (error) {
    console.error('Error refreshing job data:', error);
    showError('Failed to refresh job data. Please reload the page and try again.');
  }
}

/**
 * Update scan button enabled/disabled state
 */
function updateScanButtonState() {
  const hasJobData = currentJobData && currentJobData.description;
  const hasResume = resumeText.trim().length > 0;
  
  scanButton.disabled = !(hasJobData && hasResume);
  
  // Update button tooltip/status
  if (scanButton) {
    if (!hasJobData) {
      scanButton.title = 'Job description not found. Click Refresh button above.';
    } else if (!hasResume) {
      scanButton.title = 'Please enter your resume text.';
    } else {
      scanButton.title = 'Click to scan your resume against the job description.';
    }
  }
}

/**
 * Handle scan resume button click
 */
async function handleScanResume() {
  if (!currentJobData || !currentJobData.description) {
    showError('No job description found. Please open a job listing page on Naukri or Indeed.');
    return;
  }

  if (!resumeText || !resumeText.trim()) {
    showError('Please enter or upload your resume text.');
    return;
  }

  // Hide previous results and errors
  if (results) results.classList.add('hidden');
  if (errorMessage) errorMessage.classList.add('hidden');
  if (loadingState) loadingState.classList.remove('hidden');
  
  // Disable button and show loading
  if (scanButton) scanButton.disabled = true;
  if (scanButtonText) scanButtonText.classList.add('hidden');
  if (scanButtonLoader) scanButtonLoader.classList.remove('hidden');

  try {
    const analysisResult = await analyzeResume(
      currentJobData.description,
      resumeText
    );

    displayResults(analysisResult);
  } catch (error) {
    console.error('Error analyzing resume:', error);
    showError(error.message || 'Failed to analyze resume. Please try again.');
  } finally {
    // Re-enable button and hide loading
    if (loadingState) loadingState.classList.add('hidden');
    if (scanButton) scanButton.disabled = false;
    if (scanButtonText) scanButtonText.classList.remove('hidden');
    if (scanButtonLoader) scanButtonLoader.classList.add('hidden');
    updateScanButtonState();
  }
}

/**
 * Send resume and job description to AI API
 * 
 * ⚠️ API SETUP REQUIRED ⚠️
 * See API_SETUP.md for detailed instructions on configuring your API endpoint.
 * 
 * Quick setup:
 * 1. Choose an API provider (OpenAI, custom backend, etc.)
 * 2. Update API_ENDPOINT below with your endpoint URL
 * 3. Add authentication headers if needed (see API_SETUP.md)
 * 4. Reload the extension
 */
/**
 * Gemini API – Resume Analysis (CORRECT)
 */
// WARNING: Storing API keys in source files is insecure. Do not commit
// this key to version control. Prefer `chrome.storage.local` or an
// options page in production.
const GEMINI_API_KEY = 'AIzaSyA-0wtLOU3Drg7FBegvsqtVQKXW7YfHBks';

async function analyzeResume(jobDescription, resumeText) {
  if (!GEMINI_API_KEY || GEMINI_API_KEY === 'PUT_YOUR_GEMINI_API_KEY_HERE') {
    throw new Error('Gemini API key not configured. Please set GEMINI_API_KEY at the top of popup.js');
  }

  let API_ENDPOINT = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${GEMINI_API_KEY}`;

  async function detectWorkingEndpoint(apiKey, payload) {
    async function tryEndpoint(url) {
      try {
        const resp = await fetch(url, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        });
        return resp;
      } catch (e) {
        return { ok: false, status: 0, _error: e };
      }
    }

    let resp = await tryEndpoint(API_ENDPOINT);
    if (resp && resp.ok) return API_ENDPOINT;

    const listUrl = `https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`;
    let listResp;
    try {
      listResp = await fetch(listUrl);
    } catch (e) {
      throw new Error(`Failed to call ListModels: ${e.message}`);
    }

    if (!listResp.ok) {
      const txt = await listResp.text().catch(() => '');
      throw new Error(`ListModels failed (${listResp.status}): ${txt}`);
    }

    const listData = await listResp.json();
    const models = (listData.models || []).map(m => m.name).filter(Boolean);
    models.sort((a, b) => (a.includes('gemini') === b.includes('gemini') ? 0 : a.includes('gemini') ? -1 : 1));

    const methods = ['generateContent', 'generateText', 'generate'];
    let lastErrorText = null;

    for (const model of models) {
      for (const method of methods) {
        const url = `https://generativelanguage.googleapis.com/v1beta/${model}:${method}?key=${apiKey}`;
        resp = await tryEndpoint(url);
        if (resp && resp.ok) return url;
        try {
          lastErrorText = await (resp.text ? resp.text() : Promise.resolve(String(resp._error || '')));
        } catch (e) {
          lastErrorText = String(resp._error || e.message || 'unknown');
        }
      }
    }

    throw new Error(`No compatible model/method found. Last error: ${lastErrorText}`);
  }


    
  if (!jobDescription || !jobDescription.trim()) {
    throw new Error('Job description is required');
  }

  if (!resumeText || !resumeText.trim()) {
    throw new Error('Resume text is required');
  }

  const prompt = `
You are an expert resume analyzer.

Analyze the resume against the job description and return ONLY valid JSON.

JOB DESCRIPTION:
${jobDescription.trim()}

RESUME:
${resumeText.trim()}

Return JSON in this exact format:
{
  "match_percentage": number between 0-100,
  "matched_skills": ["skill1", "skill2"],
  "missing_skills": ["skill3", "skill4"],
  "suggestions": "Specific, actionable suggestions"
}
`;

  const payload = {
    contents: [
      {
        role: 'user',
        parts: [{ text: prompt }]
      }
    ]
  };

  try {
    API_ENDPOINT = await detectWorkingEndpoint(GEMINI_API_KEY, payload);
  } catch (err) {
    throw new Error(`Gemini endpoint detection failed: ${err.message}`);
  }

  const response = await fetch(API_ENDPOINT, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(payload)
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Gemini API error (${response.status}): ${errorText}`);
  }

  const data = await response.json();

  const text =
    data.candidates?.[0]?.content?.parts?.[0]?.text;

  if (!text) {
    throw new Error('No content returned from Gemini');
  }

  let analysis;
  try {
    analysis = JSON.parse(text);
  } catch {
    const match = text.match(/\{[\s\S]*\}/);
    if (!match) throw new Error('Invalid JSON from Gemini');
    analysis = JSON.parse(match[0]);
  }

  return {
    matchPercentage: Number(analysis.match_percentage) || 0,
    matchedSkills: Array.isArray(analysis.matched_skills)
      ? analysis.matched_skills
      : [],
    missingSkills: Array.isArray(analysis.missing_skills)
      ? analysis.missing_skills
      : [],
    suggestions: analysis.suggestions || 'No suggestions available.'
  };
}


/**
 * Display analysis results
 */
function displayResults(result) {
  if (!result) {
    showError('Invalid analysis results received.');
    return;
  }

  // Update match percentage
  const percentage = Math.max(0, Math.min(100, Math.round(result.matchPercentage || 0)));
  if (matchPercentage) {
    matchPercentage.textContent = `${percentage}%`;
  }
  
  // Update circular progress
  if (scoreCircle) {
    const circumference = 2 * Math.PI * 54; // radius = 54
    const offset = circumference - (percentage / 100) * circumference;
    scoreCircle.style.strokeDashoffset = offset;
  }
  
  // Update matched skills
  if (matchedSkills) {
    matchedSkills.innerHTML = '';
    if (result.matchedSkills && result.matchedSkills.length > 0) {
      result.matchedSkills.forEach(skill => {
        if (skill && typeof skill === 'string') {
          const tag = createSkillTag(skill, 'matched');
          matchedSkills.appendChild(tag);
        }
      });
    } else {
      matchedSkills.innerHTML = '<div class="empty-state">No matched skills found</div>';
    }
  }
  
  // Update missing skills
  if (missingSkills) {
    missingSkills.innerHTML = '';
    if (result.missingSkills && result.missingSkills.length > 0) {
      result.missingSkills.forEach(skill => {
        if (skill && typeof skill === 'string') {
          const tag = createSkillTag(skill, 'missing');
          missingSkills.appendChild(tag);
        }
      });
    } else {
      missingSkills.innerHTML = '<div class="empty-state">No missing skills - great match!</div>';
    }
  }
  
  // Update suggestions
  if (suggestions) {
    suggestions.textContent = result.suggestions || 'No suggestions available.';
  }
  
  // Show results
  if (results) {
    results.classList.remove('hidden');
  }
}

/**
 * Create a skill tag element
 */
function createSkillTag(skill, type) {
  const tag = document.createElement('span');
  tag.className = `skill-tag ${type}`;
  tag.textContent = skill;
  return tag;
}

/**
 * Show error message
 */
function showError(message) {
  if (!errorMessage) {
    console.error('Error message element not found:', message);
    return;
  }
  
  errorMessage.textContent = message || 'An error occurred';
  errorMessage.classList.remove('hidden');
  
  // Auto-hide after 5 seconds
  setTimeout(() => {
    if (errorMessage) {
      errorMessage.classList.add('hidden');
    }
  }, 5000);
}

