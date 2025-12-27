# Resume Scanner Chrome Extension

A Chrome extension that analyzes your resume against job descriptions from popular job portals like Naukri and Indeed.

## Features

- 🔍 Automatic job description extraction from Naukri and Indeed
- 📄 Resume text input (paste or upload)
- 🤖 AI-powered resume analysis
- 📊 Match percentage visualization
- ✅ Matched skills highlighting
- ❌ Missing skills identification
- 💡 Improvement suggestions

## Installation

1. Clone or download this repository
2. Open Chrome and navigate to `chrome://extensions/`
3. Enable "Developer mode" (toggle in top right)
4. Click "Load unpacked"
5. Select the extension folder

## Setup

### ⚠️ API Configuration Required

**The extension requires an AI API endpoint to function.** The default endpoint is a placeholder and will not work.

**Quick Setup Options:**

1. **📖 See [QUICK_API_SETUP.md](QUICK_API_SETUP.md)** for fastest setup (OpenAI recommended)
2. **📚 See [API_SETUP.md](API_SETUP.md)** for detailed guide with multiple options
3. **💻 See [API_EXAMPLE_OPENAI.js](API_EXAMPLE_OPENAI.js)** for ready-to-use OpenAI code

**Quick Steps:**
1. Choose an API provider (OpenAI is easiest - see QUICK_API_SETUP.md)
2. Update `API_ENDPOINT` in `popup.js` (line 352)
3. Add API key/authentication if needed
4. Reload the extension

**API Request Format:**
Your API should accept POST requests with this format:

```json
{
  "job_description": "...",
  "resume_text": "..."
}
```

3. Expected response format:

```json
{
  "match_percentage": 85,
  "matched_skills": ["JavaScript", "React", "Node.js"],
  "missing_skills": ["TypeScript", "Docker"],
  "suggestions": "Consider adding TypeScript and Docker experience to your resume."
}
```

## Usage

**📖 For detailed instructions, see [USER_GUIDE.md](USER_GUIDE.md)**

Quick Start:
1. Navigate to a job listing page on Naukri or Indeed
2. Click the extension icon in your Chrome toolbar
3. Paste your resume text or upload a file (.txt or .pdf)
4. Click "Scan Resume"
5. View your match analysis with percentage, matched/missing skills, and suggestions

## File Structure

```
resume-scanner/
├── manifest.json          # Extension manifest
├── popup.html            # Extension popup UI
├── popup.css             # Popup styles
├── popup.js              # Popup logic
├── contentScript.js      # Job description extraction
├── background.js         # Background service worker
└── utils/
    └── parser.js         # Text parsing utilities
```

## Permissions

- `activeTab`: Access current tab content
- `scripting`: Inject content scripts
- `storage`: Store resume and job data locally
- Host permissions for Naukri and Indeed domains

## Browser Compatibility

- Chrome 88+ (Manifest V3 support required)
- Edge 88+ (Chromium-based)

## Development

The extension uses:
- Manifest V3
- Vanilla JavaScript (no frameworks)
- Chrome Storage API
- Fetch API for HTTP requests

## Future Enhancements

- PDF/DOCX file parsing
- Resume history tracking
- ATS optimization tips
- Resume rewriting suggestions
- Support for more job portals

## License

MIT

