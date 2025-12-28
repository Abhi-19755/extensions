# Resume Scanner - User Guide

## 📦 Installation

1. **Open Chrome Extensions Page**
   - Open Google Chrome
   - Navigate to `chrome://extensions/`
   - Or go to: Menu (⋮) → Extensions → Manage Extensions

2. **Enable Developer Mode**
   - Toggle the "Developer mode" switch in the top-right corner

3. **Load the Extension**
   - Click "Load unpacked" button
   - Select the folder: `D:\Full stack\extensions\resume scanner`
   - The extension should now appear in your extensions list

4. **Pin the Extension (Optional but Recommended)**
   - Click the puzzle piece icon (🧩) in Chrome toolbar
   - Find "Resume Scanner" and click the pin icon to keep it visible

---

## 🚀 How to Use

### Step 1: Open a Job Listing

1. Go to one of these job portals:
   - **Naukri.com** - Navigate to any job listing page
   - **Indeed.com** - Navigate to any job listing page

2. Make sure you're on a page that shows the full job description (not just the search results)

### Step 2: Open the Extension

1. Click the **Resume Scanner** icon in your Chrome toolbar
2. The extension popup will open showing:
   - Job title and source (if detected)
   - Resume text input area
   - Upload button

### Step 3: Add Your Resume

You have **two options** to add your resume:

#### Option A: Paste Resume Text
1. Open your resume in a text editor or Word document
2. Copy all the text (Ctrl+C)
3. Paste it into the "Resume Text" textarea in the extension popup

#### Option B: Upload Resume File
1. Click the "📄 Upload Resume File" button
2. Select a file:
   - **Supported**: `.txt` files, `.pdf` files
   - **Not supported yet**: `.docx`, `.doc` files (paste text instead)

3. Wait for the file to process (you'll see "Processing file..." message)
4. The resume text will automatically appear in the textarea

### Step 4: Scan Your Resume

1. Once both job description and resume are available:
   - The "Scan Resume" button will become enabled (blue)
   - Job description is automatically extracted from the page
   - Resume text is in the textarea

2. Click the **"Scan Resume"** button

3. Wait for analysis:
   - You'll see a loading spinner
   - The extension sends data to the AI API
   - Processing usually takes a few seconds

### Step 5: View Results

After scanning, you'll see:

1. **Match Percentage** (Circular Progress)
   - Shows how well your resume matches the job
   - 0-100% score

2. **Matched Skills** (Green tags)
   - Skills from the job that are in your resume
   - Highlighted in green

3. **Missing Skills** (Red tags)
   - Skills required by the job but not in your resume
   - Highlighted in red

4. **Improvement Suggestions**
   - AI-generated recommendations
   - Tips to improve your resume match

---

## 💡 Tips & Best Practices

### ✅ Do's
- **Keep the job page open** while using the extension
- **Use full resume text** - include all sections (skills, experience, education)
- **Refresh the extension** if job data isn't detected (close and reopen popup)
- **Check multiple job listings** to see how your resume matches different roles

### ❌ Don'ts
- Don't close the job listing page while scanning
- Don't use very short resume text (aim for at least 200-300 words)
- Don't upload password-protected PDFs

---

## 🔧 Troubleshooting

### Problem: "No job description found"
**Solution:**
- Make sure you're on a job listing page (not search results)
- Refresh the page and try again
- Close and reopen the extension popup
- Check if you're on Naukri.com or Indeed.com

### Problem: "PDF parsing failed"
**Solution:**
- Ensure the PDF is not password-protected
- Try converting PDF to text first, then paste
- Check if PDF contains actual text (not just scanned images)
- Use a `.txt` file instead

### Problem: "API request failed"
**Solution:**
- Check your internet connection
- Verify the API endpoint in `popup.js` (line 204)
- The default endpoint is `https://api.example.com/compare` (placeholder)
- Update it to your actual AI API endpoint

### Problem: Extension icon not showing
**Solution:**
- Go to `chrome://extensions/`
- Find "Resume Scanner"
- Click the pin icon (📌) to pin it to toolbar
- Or click the puzzle piece icon (🧩) to access it

### Problem: Resume text not saving
**Solution:**
- The extension auto-saves resume text
- If it's not saving, check Chrome storage permissions
- Try pasting the text again

---

## 🔌 API Configuration

The extension uses an AI API to analyze resumes. By default, it's set to a placeholder endpoint.

### To Use Your Own API:

1. Open `popup.js`
2. Find line 204: `const API_ENDPOINT = 'https://api.example.com/compare';`
3. Replace with your API endpoint
4. Ensure your API accepts this format:

**Request:**
```json
{
  "job_description": "...",
  "resume_text": "..."
}
```

**Response:**
```json
{
  "match_percentage": 85,
  "matched_skills": ["JavaScript", "React", "Node.js"],
  "missing_skills": ["TypeScript", "Docker"],
  "suggestions": "Consider adding TypeScript and Docker experience..."
}
```

5. Reload the extension after making changes

---

## 📋 Supported Job Portals

Currently supported:
- ✅ **Naukri.com** - Full support
- ✅ **Indeed.com** - Full support

More portals can be added by updating `contentScript.js`

---

## 🆘 Need Help?

If you encounter issues:
1. Check the browser console (F12 → Console tab) for error messages
2. Verify all files are in the extension folder
3. Make sure the extension is reloaded after any code changes
4. Check that PDF.js files (`pdf.min.js`, `pdf.worker.min.js`) are present

---

## 🎯 Quick Start Checklist

- [ ] Extension loaded in Chrome
- [ ] Extension icon visible in toolbar
- [ ] Opened a job listing on Naukri or Indeed
- [ ] Resume text pasted or uploaded
- [ ] "Scan Resume" button is enabled
- [ ] API endpoint configured (if using custom API)
- [ ] Ready to scan!

---

**Happy Job Hunting! 🚀**

