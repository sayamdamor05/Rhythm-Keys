/**
 * Rhythm Keys // Cockpit Rhythm-Typing Engine
 * Phase 1: UI Prototype & Interactive Systems
 */

document.addEventListener('DOMContentLoaded', () => {
  // DOM Elements
  const trackSelector = document.getElementById('trackSelector');
  const currentTrackTitle = document.getElementById('currentTrackTitle');
  const currentTrackArtist = document.getElementById('currentTrackArtist');
  const btnPlayPause = document.getElementById('btnPlayPause');
  const playButtonText = document.getElementById('playButtonText');
  const btnRestart = document.getElementById('btnRestart');
  const timelineSlider = document.getElementById('timelineSlider');
  const timeCurrent = document.getElementById('timeCurrent');
  const hudWpm = document.getElementById('hudWpm');
  const hudAcc = document.getElementById('hudAcc');
  const hudCombo = document.getElementById('hudCombo');
  const audioStatusBadge = document.getElementById('audioStatusBadge');
  const audioStatusText = document.getElementById('audioStatusText');
  const keys = document.querySelectorAll('.key');
  const navItems = document.querySelectorAll('.nav-item');
  const diffBtn = document.getElementById('diffHard');
  const activeCharsContainer = document.getElementById('activeChars');
  const lyricPrev = document.getElementById('lyricPrev');
  const lyricNext = document.getElementById('lyricNext');
  const lyricProgressFill = document.getElementById('lyricProgressFill');

  // Track presets metadata
  const trackDatabase = {
    'midnight-city': {
      title: 'Midnight City',
      artist: 'M83',
      duration: '03:45',
      prev: 'Waiting in a car, waiting for a ride in the dark',
      active: 'The city is my church, it wraps in the night',
      next: 'The city is my church, it wraps in the blinding twilight'
    },
    'cyber-odyssey': {
      title: 'Cyber Odyssey',
      artist: 'Stellar Voyager',
      duration: '02:58',
      prev: 'Departing docking bay zero niner into hyperlane',
      active: 'Warp engines engaged, velocity climbing beyond light',
      next: 'Signals radiating across the galactic rim'
    },
    'neon-pulse': {
      title: 'Neon Pulse',
      artist: 'RetroWave 2088',
      duration: '04:12',
      prev: 'Synthesizers blazing through the obsidian streets',
      active: 'Feel the rhythm of the grid taking full control',
      next: 'Electric memories flashing in the rearview mirror'
    },
    'jamendo-stream': {
      title: 'Jamendo Stream',
      artist: 'Creative Commons Artist',
      duration: '03:15',
      prev: 'Streaming royalty-free audio tracks from Jamendo API',
      active: 'Synchronized lyrics parsed automatically via LRC feed',
      next: 'Real-time Web Audio API low-pass filter active'
    }
  };

  // State
  let isPlaying = false;
  let currentTrackKey = 'midnight-city';
  let targetText = trackDatabase[currentTrackKey].active;
  let typedInput = "The city is my";
  let cursorIndex = typedInput.length;
  let isError = false;

  // Key map for easy physical keyboard -> virtual key lookup
  const keyElementMap = new Map();
  keys.forEach((keyEl) => {
    const dataKey = keyEl.getAttribute('data-key');
    if (dataKey) {
      keyElementMap.set(dataKey.toLowerCase(), keyEl);
    }
  });

  /**
   * Renders the active lyric line with character highlighting
   */
  function renderActiveLine() {
    activeCharsContainer.innerHTML = '';
    const target = targetText;

    for (let i = 0; i < target.length; i++) {
      const charSpan = document.createElement('span');
      charSpan.classList.add('char');
      charSpan.textContent = target[i];

      if (i < typedInput.length) {
        if (typedInput[i] === target[i]) {
          charSpan.classList.add('char-correct');
        } else {
          charSpan.classList.add('char-error');
        }
      } else if (i === typedInput.length) {
        charSpan.classList.add('char-cursor');
      } else {
        charSpan.classList.add('char-pending');
      }

      activeCharsContainer.appendChild(charSpan);
    }

    // Update progress bar
    const progress = Math.min(100, (typedInput.length / target.length) * 100);
    lyricProgressFill.style.width = `${progress}%`;
  }

  /**
   * Updates audio engine HUD status simulation
   */
  function updateAudioEngineStatus(hasError) {
    if (hasError) {
      audioStatusBadge.classList.add('degraded');
      audioStatusText.textContent = 'AUDIO ENGINE: MUFFLED (LOW-PASS 400Hz) - FIX TYPO!';
    } else {
      audioStatusBadge.classList.remove('degraded');
      audioStatusText.textContent = 'AUDIO ENGINE: SYNCHRONIZED (FILTER CLEAR)';
    }
  }

  /**
   * Updates track display
   */
  function switchTrack(trackKey) {
    const track = trackDatabase[trackKey] || trackDatabase['midnight-city'];
    currentTrackKey = trackKey;
    currentTrackTitle.textContent = track.title;
    currentTrackArtist.textContent = track.artist;
    lyricPrev.querySelector('.line-text').textContent = track.prev;
    lyricNext.querySelector('.line-text').textContent = track.next;
    targetText = track.active;
    typedInput = '';
    cursorIndex = 0;
    isError = false;
    updateAudioEngineStatus(false);
    renderActiveLine();
  }

  // Event Listeners
  trackSelector.addEventListener('change', (e) => {
    switchTrack(e.target.value);
  });

  // Play / Pause Toggle
  btnPlayPause.addEventListener('click', () => {
    isPlaying = !isPlaying;
    if (isPlaying) {
      playButtonText.textContent = 'DISENGAGE';
      btnPlayPause.style.background = 'linear-gradient(135deg, #00e5ff 0%, #0284c7 100%)';
      btnPlayPause.style.boxShadow = '0 0 25px rgba(0, 229, 255, 0.6)';
    } else {
      playButtonText.textContent = 'ENGAGE';
      btnPlayPause.style.background = 'linear-gradient(135deg, #ff66cc 0%, #bd00ff 100%)';
      btnPlayPause.style.boxShadow = '0 0 20px rgba(255, 102, 204, 0.5)';
    }
  });

  // Restart Button
  btnRestart.addEventListener('click', () => {
    typedInput = '';
    cursorIndex = 0;
    isError = false;
    timelineSlider.value = 0;
    timeCurrent.textContent = '00:00';
    updateAudioEngineStatus(false);
    renderActiveLine();
  });

  // Difficulty Toggle
  const diffs = ['NORMAL', 'HARD', 'HYPER'];
  let currentDiffIdx = 1;
  diffBtn.addEventListener('click', () => {
    currentDiffIdx = (currentDiffIdx + 1) % diffs.length;
    diffBtn.textContent = diffs[currentDiffIdx];
  });

  // Navigation Items Tab Switching
  navItems.forEach((nav) => {
    nav.addEventListener('click', () => {
      navItems.forEach((n) => n.classList.remove('active'));
      nav.classList.add('active');
    });
  });

  // Physical Keyboard Listener -> Virtual 3D Keyboard Reactions & Typing
  window.addEventListener('keydown', (e) => {
    const key = e.key;
    const lowerKey = key.toLowerCase();

    // Visual press on virtual keyboard
    const virtualKey = keyElementMap.get(lowerKey) || keyElementMap.get(key);
    if (virtualKey) {
      virtualKey.classList.add('key-pressed');
      setTimeout(() => virtualKey.classList.remove('key-pressed'), 120);
    }

    // Ignore modifier standalone triggers
    if (['Shift', 'Control', 'Alt', 'Meta', 'CapsLock', 'Tab'].includes(key)) {
      return;
    }

    // Handle Backspace
    if (key === 'Backspace') {
      if (typedInput.length > 0) {
        typedInput = typedInput.slice(0, -1);
        cursorIndex = typedInput.length;
        // Check if there are still errors in remaining string
        const hasTypo = [...typedInput].some((ch, idx) => ch !== targetText[idx]);
        isError = hasTypo;
        updateAudioEngineStatus(isError);
        renderActiveLine();
      }
      e.preventDefault();
      return;
    }

    // Character Typing
    if (key.length === 1 && typedInput.length < targetText.length) {
      typedInput += key;
      const expectedChar = targetText[typedInput.length - 1];
      if (key !== expectedChar) {
        isError = true;
        updateAudioEngineStatus(true);
      } else {
        const hasTypo = [...typedInput].some((ch, idx) => ch !== targetText[idx]);
        isError = hasTypo;
        updateAudioEngineStatus(isError);
      }
      renderActiveLine();
      e.preventDefault();
    }
  });

  // Virtual key clicks
  keys.forEach((keyEl) => {
    keyEl.addEventListener('click', () => {
      const dataKey = keyEl.getAttribute('data-key');
      if (dataKey) {
        const event = new KeyboardEvent('keydown', { key: dataKey });
        window.dispatchEvent(event);
      }
    });
  });

  // Initial render
  renderActiveLine();
});
