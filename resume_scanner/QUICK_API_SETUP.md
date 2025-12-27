# Quick API Setup Guide

## 🚀 Fastest Way: Use OpenAI

### Step 1: Get API Key
1. Go to https://platform.openai.com/api-keys
2. Sign up or log in
3. Click "Create new secret key"
4. Copy the key (starts with `sk-`)

### Step 2: Update popup.js

1. Open `popup.js`
2. Find the `analyzeResume` function (around line 351)
3. Replace the entire function with the code from `API_EXAMPLE_OPENAI.js`
4. Replace `YOUR_API_KEY_HERE` with your actual OpenAI API key
5. Save the file

### Step 3: Reload Extension
1. Go to `chrome://extensions/`
2. Find "Resume Scanner"
3. Click the reload icon (🔄)

### Step 4: Test
1. Open a job listing on Naukri/Indeed
2. Open the extension
3. Paste your resume
4. Click "Scan Resume"

---

## 🔧 Alternative: Use Your Own Backend

### Simple Node.js Backend Example

Create a file `server.js`:

```javascript
const express = require('express');
const cors = require('cors');
const app = express();

app.use(cors());
app.use(express.json());

app.post('/compare', (req, res) => {
  const { job_description, resume_text } = req.body;
  
  // Simple matching logic (replace with actual AI/ML)
  const jobWords = job_description.toLowerCase().split(/\s+/);
  const resumeWords = resume_text.toLowerCase().split(/\s+/);
  
  const commonWords = jobWords.filter(word => 
    resumeWords.includes(word) && word.length > 3
  );
  
  const matchPercentage = Math.min(100, (commonWords.length / jobWords.length) * 100);
  
  res.json({
    match_percentage: Math.round(matchPercentage),
    matched_skills: commonWords.slice(0, 5),
    missing_skills: ['Add more relevant skills'],
    suggestions: 'Consider highlighting more relevant experience.'
  });
});

app.listen(3000, () => {
  console.log('API running on http://localhost:3000');
});
```

Run: `node server.js`

Then in `popup.js`, change line 352:
```javascript
const API_ENDPOINT = 'http://localhost:3000/compare';
```

---

## 📝 Current Error: "Network error: Failed to fetch"

This means the API endpoint `https://api.example.com/compare` doesn't exist (it's just a placeholder).

**Fix:** Update the `API_ENDPOINT` in `popup.js` line 352 to your actual API URL.

---

## 🆘 Still Having Issues?

1. **Check browser console** (F12 → Console) for detailed errors
2. **Verify API endpoint** is correct and accessible
3. **Test API** with Postman or curl first
4. **Check CORS** - your API must allow requests from Chrome extensions
5. **See full guide** in `API_SETUP.md` for more options

---

## 💡 Recommended: OpenAI (Easiest)

- ✅ No backend needed
- ✅ Works immediately
- ✅ High quality analysis
- ✅ Pay per use (~$0.01-0.10 per scan)

Get started: https://platform.openai.com/api-keys

