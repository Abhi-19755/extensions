# 🎯 Focus Timer + Distraction Blocker

A production-ready Chrome extension for students featuring a Pomodoro timer with intelligent distraction blocking.

![Manifest V3](https://img.shields.io/badge/Manifest-V3-blue)
![Chrome Extension](https://img.shields.io/badge/Platform-Chrome-green)

## ✨ Features

### Core Features
- **Pomodoro Timer**: Default 25-minute study sessions with 5-minute breaks
- **Distraction Blocking**: Automatically blocks distracting websites during study sessions
- **Customizable Settings**: Adjust study/break times and manage blocked sites
- **Desktop Notifications**: Get notified when sessions end
- **Sound Alerts**: Optional bell sound when sessions complete
- **Persistent Storage**: All settings saved using Chrome Storage API


## 📁 File Structure

```
distraction-blocker/
├── manifest.json      # Extension configuration (Manifest V3)
├── background.js      # Service worker: timer logic, blocking, notifications
├── popup.html         # Main popup UI
├── popup.js           # Popup interactions and state management
├── styles.css         # Modern dark theme styling
├── content.js         # Content script for backup blocking
├── blocked.html       # Focus message shown on blocked sites
├── rules.json         # Declarative net request rules (dynamic)
├── icons/             # Extension icons (add your own)
└── sounds/            # Bell sound for notifications
```

## 🚀 Installation

1. **Clone or download** this repository
2. Open Chrome and navigate to `chrome://extensions/`
3. Enable **Developer mode** (toggle in top-right corner)
4. Click **Load unpacked**
5. Select the `distraction-blocker` folder
6. The extension icon will appear in your toolbar!

## ⚙️ Configuration

### Timer Settings
- **Study Duration**: 1-120 minutes (default: 25)
- **Break Duration**: 1-30 minutes (default: 5)
- **Sound Alert**: Toggle on/off

### Blocked Sites (Default)
- YouTube, Instagram, Reddit, Twitter/X
- TikTok, Facebook, Netflix, Twitch

Add or remove sites via the Settings panel.

## 🛠️ How It Works

### Timer Logic
The timer runs in the background service worker, ensuring it continues even when the popup is closed. State is persisted to Chrome storage and restored on browser restart.

### Site Blocking
Uses Chrome's `declarativeNetRequest` API for efficient blocking:
- During study sessions: blocked sites redirect to `blocked.html`
- During breaks: all sites accessible
- Content script provides backup blocking

## 🎨 Design

- **Dark Theme**: Easy on the eyes during long study sessions
- **Circular Progress Ring**: Visual timer representation
- **Smooth Animations**: Polished micro-interactions
- **Responsive Layout**: Works on various screen sizes

## 📝 Usage Tips

1. **Start Simple**: Begin with default 25/5 minute cycles
2. **Customize Blocks**: Add sites that distract YOU specifically
3. **Stay Consistent**: Regular sessions build focus habits

## 🔒 Permissions Explained

| Permission | Purpose |
|------------|---------|
| `storage` | Save settings and timer state |
| `alarms` | Keep timer running in background |
| `notifications` | Desktop alerts when sessions end |
| `tabs` | Access current tab for blocking |
| `declarativeNetRequest` | Efficient site blocking |
| `host_permissions` | Apply blocking to all websites |

## 🐛 Troubleshooting

**Timer not persisting?**
- Check that the extension has permission to run in background
- Service worker may need to restart: disable/enable extension

**Sites not blocking?**
- Ensure timer is running (not paused)
- Check if site is in blocked list
- Try refreshing the blocked page

## 🤝 Contributing

Contributions welcome! Please:
1. Fork the repository
2. Create a feature branch
3. Submit a pull request

## 📄 License

MIT License - feel free to use and modify for your needs.

---

**Made with 💜 for focused students everywhere**

