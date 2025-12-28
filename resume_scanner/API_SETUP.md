# API Setup Guide for Resume Scanner

The extension requires an AI API endpoint to analyze resumes. This guide shows you how to configure it.

## 📍 Where to Configure

The API endpoint is configured in `popup.js` at **line 352**:

```javascript
const API_ENDPOINT = 'https://api.example.com/compare';
```

Replace this with your actual API endpoint.

---

## 🔧 Option 1: Using OpenAI API

### Setup Steps:

1. **Get OpenAI API Key**
   - Go to https://platform.openai.com/api-keys
   - Create a new API key
   - Copy the key (starts with `sk-`)

2. **Update `popup.js`** (around line 352):

```javascript
const API_ENDPOINT = 'https://api.openai.com/v1/chat/completions';
const OPENAI_API_KEY = 'AIzaSyA-0wtLOU3Drg7FBegvsqtVQKXW7YfHBks'; // Replace with your key

async function analyzeResume(jobDescription, resumeText) {
  const GEMINI_API_KEY = 'YOUR_GEMINI_API_KEY_HERE';

  const API_ENDPOINT =
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${GEMINI_API_KEY}`;

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

  const response = await fetch(API_ENDPOINT, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      contents: [
        {
          role: 'user',
          parts: [{ text: prompt }]
        }
      ]
    })
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
    matchPercentage: Math.max(0, Math.min(100, Number(analysis.match_percentage) || 0)),
    matchedSkills: Array.isArray(analysis.matched_skills) ? analysis.matched_skills : [],
    missingSkills: Array.isArray(analysis.missing_skills) ? analysis.missing_skills : [],
    suggestions: analysis.suggestions || 'No suggestions available.'
  };
}


---

## 🔧 Option 2: Using Your Own Backend API

### Backend Requirements:

Your API should accept POST requests with this format:

**Request:**
```json
{
  "job_description": "Full job description text...",
  "resume_text": "Full resume text..."
}
```

**Response:**
```json
{
  "match_percentage": 85,
  "matched_skills": ["JavaScript", "React", "Node.js"],
  "missing_skills": ["TypeScript", "Docker"],
  "suggestions": "Consider adding TypeScript and Docker experience to your resume."
}
```

### Example Backend (Node.js/Express):

```javascript
const express = require('express');
const app = express();

app.use(express.json());

app.post('/compare', async (req, res) => {
  const { job_description, resume_text } = req.body;
  
  // Your AI/ML analysis logic here
  // This is a simple example - replace with actual analysis
  
  const analysis = {
    match_percentage: 75, // Calculate based on your logic
    matched_skills: ["JavaScript", "React"],
    missing_skills: ["TypeScript"],
    suggestions: "Add more TypeScript experience."
  };
  
  res.json(analysis);
});

app.listen(3000, () => {
  console.log('API running on http://localhost:3000');
});
```

### Update Extension:

In `popup.js`, change line 352:

```javascript
const API_ENDPOINT = 'http://localhost:3000/compare'; // For local development
// OR
const API_ENDPOINT = 'https://your-api-domain.com/compare'; // For production
```

---

## 🔧 Option 3: Using Hugging Face API

### Setup:

1. Get API key from https://huggingface.co/settings/tokens
2. Update `popup.js`:

```javascript
const API_ENDPOINT = 'https://api-inference.huggingface.co/models/microsoft/DialoGPT-medium';
const HF_API_KEY = 'your-huggingface-token';

async function analyzeResume(jobDescription, resumeText) {
  // Similar structure to OpenAI but with Hugging Face format
  // Implementation depends on the model you choose
}
```

---

## 🔧 Option 4: Using Google Gemini API

### Setup:

1. Get API key from https://makersuite.google.com/app/apikey
2. Update `popup.js`:

```javascript
const API_ENDPOINT = `https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key=YOUR_API_KEY`;

async function analyzeResume(jobDescription, resumeText) {
  const requestBody = {
    contents: [{
      parts: [{
        text: `Analyze this resume against the job description and return JSON:
        
JOB: ${jobDescription}
RESUME: ${resumeText}

Return JSON: {"match_percentage": number, "matched_skills": [], "missing_skills": [], "suggestions": "..."}`
      }]
    }]
  };

  const response = await fetch(API_ENDPOINT, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(requestBody)
  });

  // Parse response...
}
```

---

## 🔒 Security Best Practices

### ⚠️ Important: API Key Security

**DO NOT commit API keys to version control!**

1. **For Development:**
   - Store API key in a separate config file
   - Add config file to `.gitignore`

2. **For Production:**
   - Use environment variables
   - Or use Chrome Extension's secure storage
   - Consider using a backend proxy to hide API keys

### Example: Secure API Key Storage

Create `config.js` (add to `.gitignore`):

```javascript
// config.js
const CONFIG = {
  API_ENDPOINT: 'https://api.example.com/compare',
  API_KEY: 'your-secret-key-here'
};
```

In `popup.js`:
```javascript
// Load config (you'll need to handle this securely)
const API_ENDPOINT = CONFIG.API_ENDPOINT;
```

---

## 🧪 Testing Your API

### Test with curl:

```bash
curl -X POST https://your-api.com/compare \
  -H "Content-Type: application/json" \
  -d '{
    "job_description": "Looking for a JavaScript developer with React experience.",
    "resume_text": "I am a JavaScript developer with 5 years of React experience."
  }'
```

### Expected Response:

```json
{
  "match_percentage": 85,
  "matched_skills": ["JavaScript", "React"],
  "missing_skills": [],
  "suggestions": "Great match!"
}
```

---

## 🐛 Troubleshooting

### Error: "Network error: Failed to fetch"

**Causes:**
1. **CORS Issues** - Your API doesn't allow requests from Chrome extensions
   - **Solution:** Add CORS headers to your backend:
     ```javascript
     res.header('Access-Control-Allow-Origin', '*');
     res.header('Access-Control-Allow-Methods', 'POST');
     ```

2. **Invalid URL** - API endpoint is incorrect
   - **Solution:** Check the URL in `popup.js` line 352
   - Make sure it starts with `http://` or `https://`

3. **API Server Down** - Your backend is not running
   - **Solution:** Check if your API server is running
   - Test the endpoint in browser/Postman

4. **HTTPS Required** - Chrome extensions require HTTPS for external APIs
   - **Solution:** Use HTTPS endpoint or localhost for development

### Error: "Invalid API response format"

**Cause:** API response doesn't match expected format

**Solution:** Ensure your API returns:
```json
{
  "match_percentage": <number>,
  "matched_skills": <array>,
  "missing_skills": <array>,
  "suggestions": <string>
}
```

### Error: "API request failed: 401"

**Cause:** Invalid or missing API key

**Solution:** 
- Check your API key is correct
- Verify authentication headers are set properly

---

## 📝 Quick Setup Checklist

- [ ] Choose an API provider (OpenAI, custom backend, etc.)
- [ ] Get API key/credentials
- [ ] Update `API_ENDPOINT` in `popup.js` (line 352)
- [ ] Add API key/authentication if needed
- [ ] Test API endpoint with curl/Postman
- [ ] Reload extension in Chrome
- [ ] Test with a real job listing and resume

---

## 💡 Example: Complete OpenAI Setup

Here's a ready-to-use OpenAI configuration:

1. **Get API key** from https://platform.openai.com/api-keys

2. **Replace the `analyzeResume` function in `popup.js`** (starting around line 345):

```javascript
async function analyzeResume(jobDescription, resumeText) {
  const API_ENDPOINT = 'https://api.openai.com/v1/chat/completions';
  const API_KEY = 'sk-your-key-here'; // ⚠️ Replace with your actual key
  
  // ... (use the OpenAI code from Option 1 above)
}
```

3. **Reload extension** and test!

---

## 🚀 Need Help?

- Check browser console (F12) for detailed error messages
- Verify API endpoint is accessible
- Test API independently with Postman/curl
- Check API documentation for your chosen provider

