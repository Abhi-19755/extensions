ICONS PLACEHOLDER
=================

Add your extension icons here:

Required files:
- icon16.png  (16x16 pixels)
- icon48.png  (48x48 pixels)  
- icon128.png (128x128 pixels)

Quick way to create icons:
1. Create a 128x128 image with a target/timer design
2. Export at 128px, 48px, and 16px sizes
3. Use tools like https://favicon.io or Figma

The extension will work without icons, but they improve the user experience.

Once you add icons, update manifest.json to include:

  "action": {
    "default_popup": "popup.html",
    "default_icon": {
      "16": "icons/icon16.png",
      "48": "icons/icon48.png",
      "128": "icons/icon128.png"
    },
    "default_title": "Focus Timer"
  },
  "icons": {
    "16": "icons/icon16.png",
    "48": "icons/icon48.png",
    "128": "icons/icon128.png"
  },

