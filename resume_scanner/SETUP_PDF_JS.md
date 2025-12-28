# PDF.js Setup Instructions

The extension uses PDF.js for PDF parsing. Due to Chrome Extension Manifest V3 Content Security Policy restrictions, you have two options:

## Option 1: Use CDN (Current Setup - May Require CSP Update)

The extension is currently configured to load PDF.js from CDN. If you encounter CSP errors, use Option 2.

## Option 2: Download PDF.js Locally (Recommended)

1. Download PDF.js from: https://mozilla.github.io/pdf.js/getting_started/#download
   - Or use direct links:
     - https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.min.js
     - https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js

2. Save the files in your extension root directory:
   - `pdf.min.js`
   - `pdf.worker.min.js`

3. Update `popup.html` to use local files:
   ```html
   <script src="pdf.min.js"></script>
   ```

4. Update `popup.js` line 137 to use local worker:
   ```javascript
   pdfjsLib.GlobalWorkerOptions.workerSrc = chrome.runtime.getURL('pdf.worker.min.js');
   ```

5. Update `manifest.json` to include worker in web_accessible_resources:
   ```json
   "web_accessible_resources": [
     {
       "resources": ["pdf.worker.min.js"],
       "matches": ["<all_urls>"]
     }
   ]
   ```

## Quick Setup Script

Run this in your extension directory to download PDF.js files:

**Windows PowerShell:**
```powershell
Invoke-WebRequest -Uri "https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.min.js" -OutFile "pdf.min.js"
Invoke-WebRequest -Uri "https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js" -OutFile "pdf.worker.min.js"
```

**Linux/Mac:**
```bash
curl -o pdf.min.js https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.min.js
curl -o pdf.worker.min.js https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js
```

