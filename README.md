# Rhythm Keys 🚀 // Cockpit Rhythm-Typing Simulator

Rhythm Keys is a gamified typing practice web application that synchronizes typing practice with real-time music playback and synchronized LRC lyrics.

---

## 🌟 Visual Theme & Design Aesthetic
- **Futuristic Spaceship Cockpit HUD**: Glassmorphic dashboard looking out into an animated starfield with passing celestial bodies and atmospheric glowing planets.
- **Color Palette**: Deep space obsidian, Neon Cyan (`#00e5ff`) primary HUD accents, Soft Pink (`#ff66cc`) transport controls, Crimson Red error penalty indicators, and pastel-toned 3D soft tactile keyboard keys.
- **Audio Degradation Mechanics**: Typos trigger real-time Web Audio API low-pass filter muffling (400 Hz) and volume dips, which immediately restore upon typo correction.

---

## 🛠️ Project Structure
```
rhythm-keys/
├── index.html           # Cockpit viewport, HUD telemetry, and 3D keyboard markup
├── package.json         # Vite configuration and scripts
├── netlify.toml         # Production deployment settings for Netlify
├── .gitignore           # Git ignore rules
├── src/
│   ├── style.css        # Glassmorphism, animations, space background & 3D keyboard styles
│   └── main.js          # Interactive prototype, keyboard listeners, HUD updates
└── README.md            # Setup guide, Jamendo API & LRC instructions
```

---

## 🚀 Getting Started

### 1. Install Dependencies
```bash
npm install
```

### 2. Run Local Development Server
```bash
npm run dev
```

### 3. Build for Production (Netlify ready)
```bash
npm run build
```

---

## 🎵 External APIs & Audio Assets Guide

### 1. Jamendo API Integration (Royalty-Free Music)
Jamendo provides free access to thousands of Creative Commons tracks via their REST API.

1. **Sign Up & Obtain Client ID**:
   Register at the [Jamendo Developer Portal](https://developer.jamendo.com/v3.0) to get a `client_id`.

2. **Sample Fetch Function**:
```javascript
// Fetch royalty-free synthwave / electronic tracks
export async function fetchJamendoTracks(clientId, limit = 10) {
  const endpoint = `https://api.jamendo.com/v3.0/tracks/?client_id=${clientId}&format=jsonpretty&limit=${limit}&tags=synthwave&audioformat=mp32`;
  
  try {
    const res = await fetch(endpoint);
    const data = await res.json();
    return data.results.map(track => ({
      id: track.id,
      title: track.name,
      artist: track.artist_name,
      audioUrl: track.audio,
      duration: track.duration,
      albumArt: track.image
    }));
  } catch (error) {
    console.error("Failed to fetch Jamendo tracks:", error);
    return [];
  }
}
```

---

### 2. Synchronized Lyrics (.LRC) Guide
`.LRC` (Lyric) files use standard minute-second-millisecond timestamp tags preceding each lyric line: `[mm:ss.xx] Lyric text`.

#### Example Dummy `.LRC` String (for Testing):
```lrc
[00:00.00] (Instrumental Intro)
[00:15.50] Waiting in a car, waiting for a ride in the dark
[00:23.20] The night city grows, look and see her eyes, they look like yours
[00:31.00] The city is my church, it wraps in the blinding twilight
[00:39.40] Waiting in a car, waiting for the right time
[00:47.80] (Synth Solo Drop)
```

#### How to Create or Download `.LRC` Files:
1. **LRC Generators**: Tools like [lrcgenerator.com](https://lrcgenerator.com/) allow you to load any MP3 and tap keys in real-time to generate matching timestamped `.lrc` files.
2. **Open Databases**: Synchronized lyrics can be queried from community APIs like LRCLIB (`https://lrclib.net/api/get`).

---

## 🗺️ Roadmap & Phases
- [x] **Phase 1: Project Setup & UI Prototype** (Vite, Git, Glassmorphism Cockpit UI, 3D Keyboard, Layout).
- [ ] **Phase 2: Audio & Typing Engine** (Web Audio API `AudioContext`, `BiquadFilterNode`, keystroke penalty sync).
- [ ] **Phase 3: Lyric Synchronization** (`.LRC` parser, `requestAnimationFrame` audio time tracker, karaoke line advancement).
