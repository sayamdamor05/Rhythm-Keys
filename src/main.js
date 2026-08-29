/**
 * Rhythm Keys // Precision Audio, Typing & 3D Three.js Engine
 * Clean, mathematically precise keyboard feedback, character cell rendering, and Lucide SVG transport controls.
 */

import { SpaceScene } from './space/SpaceScene.js';
import { AudioController } from './audio/AudioController.js';
import { TypingController } from './typing/TypingController.js';
import { LrcParser } from './lyrics/LrcParser.js';
import { SONG_DATABASE } from './lyrics/songDatabase.js';

document.addEventListener('DOMContentLoaded', () => {
  // --- 1. INITIALIZE THREE.JS 3D SPACE BACKGROUND ---
  const spaceCanvas = document.getElementById('spaceCanvas');
  let spaceScene = null;
  if (spaceCanvas) {
    spaceScene = new SpaceScene(spaceCanvas);
  }

  // --- 2. DOM ELEMENTS ---
  const currentTrackTitle = document.getElementById('currentTrackTitle');
  const currentTrackArtist = document.getElementById('currentTrackArtist');
  const btnPlayPause = document.getElementById('btnPlayPause');
  const playButtonText = document.getElementById('playButtonText');
  const playIconSvg = document.getElementById('playIconSvg');
  const pauseIconSvg = document.getElementById('pauseIconSvg');
  const btnRestart = document.getElementById('btnRestart');
  const diffHard = document.getElementById('diffHard');
  const diffText = document.getElementById('diffText');

  // Stats HUD
  const hudWpm = document.getElementById('hudWpm');
  const hudAcc = document.getElementById('hudAcc');

  // Lyrics Elements
  const lyricPrevText = document.getElementById('lyricPrevText');
  const activeCharsContainer = document.getElementById('activeChars');
  const lyricNextText = document.getElementById('lyricNextText');

  // Settings / Track Selector Modal
  const settingsModal = document.getElementById('settingsModal');
  const btnSettings = document.getElementById('btnSettings');
  const btnSettingsClose = document.getElementById('btnSettingsClose');
  const btnSettingsCancel = document.getElementById('btnSettingsCancel');
  const btnSettingsApply = document.getElementById('btnSettingsApply');
  const trackSelector = document.getElementById('trackSelector');
  const volumeSlider = document.getElementById('volumeSlider');
  const customFields = document.getElementById('customFields');
  const customTitleInput = document.getElementById('customTitleInput');
  const customAudioUrl = document.getElementById('customAudioUrl');
  const customLrcText = document.getElementById('customLrcText');

  // Navigation Items
  const navItems = document.querySelectorAll('.nav-btn');

  // Results Modal
  const resultsModal = document.getElementById('resultsModal');
  const resultsGradeBadge = document.getElementById('resultsGradeBadge');
  const resultsTrackInfo = document.getElementById('resultsTrackInfo');
  const resWpm = document.getElementById('resWpm');
  const resAcc = document.getElementById('resAcc');
  const resCombo = document.getElementById('resCombo');
  const resLines = document.getElementById('resLines');
  const btnResultsRestart = document.getElementById('btnResultsRestart');

  // On-Screen Keyboard Elements Map
  const keys = document.querySelectorAll('.key-3d');
  const keyElementMap = new Map();
  keys.forEach((keyEl) => {
    const dataKey = keyEl.getAttribute('data-key');
    if (dataKey) {
      keyElementMap.set(dataKey.toLowerCase(), keyEl);
    }
  });

  // --- 3. ENGINE INSTANCES ---
  const audio = new AudioController();
  let currentSong = SONG_DATABASE['midnight-city'];
  let parsedLyrics = LrcParser.parse(currentSong.lrc);
  let activeLyricIndex = 0;
  let isGameFinished = false;

  const typing = new TypingController({
    onTypo: () => {
      audio.applyPenalty();
      renderActiveChars();
    },
    onCorrect: () => {
      audio.clearPenalty();
      renderActiveChars();
    },
    onLineComplete: () => {
      if (activeLyricIndex < parsedLyrics.length - 1) {
        setLyricLine(activeLyricIndex + 1);
      } else {
        finishGame();
      }
    },
    onStatsUpdate: (stats) => {
      hudWpm.textContent = stats.wpm;
      hudAcc.textContent = `${stats.accuracy}%`;
    }
  });

  // --- 4. TRACK & LYRICS MANAGEMENT ---
  function loadTrack(trackKey, customData = null) {
    audio.pause();
    isGameFinished = false;

    if (customData) {
      currentSong = customData;
    } else {
      currentSong = SONG_DATABASE[trackKey] || SONG_DATABASE['midnight-city'];
    }

    parsedLyrics = LrcParser.parse(currentSong.lrc);
    currentTrackTitle.textContent = currentSong.title;
    currentTrackArtist.textContent = currentSong.artist;

    if (currentSong.audioUrl) {
      audio.loadAudioUrl(currentSong.audioUrl);
    } else {
      audio.setSynthTrack(currentSong.id);
    }

    activeLyricIndex = 0;
    setLyricLine(0);
    typing.reset();
    updatePlayButtonState(false);
  }

  function setLyricLine(index) {
    if (!parsedLyrics || parsedLyrics.length === 0) return;
    activeLyricIndex = Math.max(0, Math.min(parsedLyrics.length - 1, index));

    // Previous Line
    if (activeLyricIndex > 0) {
      lyricPrevText.textContent = parsedLyrics[activeLyricIndex - 1].text || '(...)';
    } else {
      lyricPrevText.textContent = 'Waiting for the sun to rise';
    }

    // Active Target Line
    const activeText = parsedLyrics[activeLyricIndex].text || '';
    typing.setTargetLine(activeText);
    renderActiveChars();

    // Next Line
    if (activeLyricIndex < parsedLyrics.length - 1) {
      lyricNextText.textContent = parsedLyrics[activeLyricIndex + 1].text || '(...)';
    } else {
      lyricNextText.textContent = 'Neon lights are shining bright';
    }
  }

  /**
   * Renders discrete, strict monospace character cells without overlap
   */
  function renderActiveChars() {
    activeCharsContainer.innerHTML = '';
    const target = typing.targetLine;
    const typed = typing.typedBuffer;

    if (!target) {
      const span = document.createElement('span');
      span.className = 'char char-pending';
      span.textContent = '(Instrumental Section)';
      activeCharsContainer.appendChild(span);
      return;
    }

    for (let i = 0; i < target.length; i++) {
      const span = document.createElement('span');
      span.className = 'char';
      span.textContent = target[i];

      if (i < typed.length) {
        if (typed[i] === target[i]) {
          span.classList.add('char-correct');
        } else {
          span.classList.add('char-error');
        }
      } else if (i === typed.length) {
        span.classList.add('char-cursor');
      } else {
        span.classList.add('char-pending');
      }

      activeCharsContainer.appendChild(span);
    }
  }

  /**
   * Updates the Play/Pause circular button state and SVG icons
   */
  function updatePlayButtonState(playing) {
    if (playing) {
      playButtonText.textContent = 'PAUSE';
      if (playIconSvg) playIconSvg.style.display = 'none';
      if (pauseIconSvg) pauseIconSvg.style.display = 'block';
    } else {
      playButtonText.textContent = 'PLAY';
      if (playIconSvg) playIconSvg.style.display = 'block';
      if (pauseIconSvg) pauseIconSvg.style.display = 'none';
    }
  }

  function finishGame() {
    if (isGameFinished) return;
    isGameFinished = true;
    audio.pause();
    updatePlayButtonState(false);

    const stats = typing.getStats();
    let grade = 'RANK S';
    if (stats.accuracy >= 98 && stats.wpm >= 60) grade = 'RANK S';
    else if (stats.accuracy >= 90) grade = 'RANK A';
    else if (stats.accuracy >= 80) grade = 'RANK B';
    else grade = 'RANK C';

    resultsGradeBadge.textContent = grade;
    resultsTrackInfo.textContent = `${currentSong.title} // ${currentSong.artist}`;
    resWpm.textContent = `${stats.wpm} WPM`;
    resAcc.textContent = `${stats.accuracy}%`;
    resCombo.textContent = `${stats.combo} (${typing.maxStreak})`;
    resLines.textContent = `${typing.completedLinesCount} / ${parsedLyrics.length}`;

    resultsModal.classList.add('active');
    resultsModal.setAttribute('aria-hidden', 'false');
  }

  // --- 5. REAL-TIME SYNC LOOP ---
  function syncLoop() {
    if (audio.isPlaying && !isGameFinished) {
      const curTime = audio.getCurrentTime();
      const duration = currentSong.duration || 120;

      const targetIndex = LrcParser.getActiveIndex(parsedLyrics, curTime);
      if (targetIndex !== -1 && targetIndex !== activeLyricIndex) {
        setLyricLine(targetIndex);
      }

      if (curTime >= duration) {
        finishGame();
      }
    }
    requestAnimationFrame(syncLoop);
  }
  requestAnimationFrame(syncLoop);

  // --- 6. EVENT LISTENERS ---

  // Play / Pause Button
  btnPlayPause.addEventListener('click', () => {
    if (audio.isPlaying) {
      audio.pause();
      updatePlayButtonState(false);
    } else {
      audio.play();
      updatePlayButtonState(true);
    }
  });

  // Restart Button
  btnRestart.addEventListener('click', () => {
    audio.restart();
    typing.reset();
    setLyricLine(0);
    updatePlayButtonState(false);
  });

  // Difficulty Toggle
  const diffs = ['NORMAL', 'HARD', 'HYPER'];
  let currentDiffIdx = 1;
  diffHard.addEventListener('click', () => {
    currentDiffIdx = (currentDiffIdx + 1) % diffs.length;
    diffText.textContent = diffs[currentDiffIdx];
  });

  // Navigation Items
  navItems.forEach((nav) => {
    nav.addEventListener('click', () => {
      navItems.forEach((n) => n.classList.remove('active'));
      nav.classList.add('active');
    });
  });

  // Settings Modal Handlers
  btnSettings.addEventListener('click', () => {
    settingsModal.classList.add('active');
    settingsModal.setAttribute('aria-hidden', 'false');
  });

  function closeSettings() {
    settingsModal.classList.remove('active');
    settingsModal.setAttribute('aria-hidden', 'true');
  }

  btnSettingsClose.addEventListener('click', closeSettings);
  btnSettingsCancel.addEventListener('click', closeSettings);

  trackSelector.addEventListener('change', (e) => {
    if (e.target.value === 'custom-lrc') {
      customFields.style.display = 'flex';
    } else {
      customFields.style.display = 'none';
    }
  });

  btnSettingsApply.addEventListener('click', () => {
    const val = trackSelector.value;
    if (val === 'custom-lrc') {
      const title = customTitleInput.value.trim() || 'Custom Song';
      const audioUrl = customAudioUrl.value.trim() || null;
      const lrc = customLrcText.value.trim() || currentSong.lrc;
      loadTrack('custom-track', {
        id: 'custom-track',
        title: title,
        artist: 'Custom Transmission',
        duration: 120,
        audioUrl: audioUrl,
        lrc: lrc
      });
    } else {
      loadTrack(val);
    }
    closeSettings();
    audio.play();
    updatePlayButtonState(true);
  });

  // Volume Slider
  volumeSlider.addEventListener('input', (e) => {
    const vol = parseFloat(e.target.value) / 100;
    audio.setVolume(vol);
  });

  // Visual Keypress Feedback & Typing Input
  window.addEventListener('keydown', (e) => {
    if (settingsModal.classList.contains('active')) {
      return;
    }

    const key = e.key;
    const lowerKey = key.toLowerCase();

    // Visual active animation on virtual 3D keyboard
    const virtualKey = keyElementMap.get(lowerKey) || keyElementMap.get(key);
    if (virtualKey) {
      virtualKey.classList.add('key-pressed');
      setTimeout(() => virtualKey.classList.remove('key-pressed'), 90);
    }

    // Auto-start music on first keypress if paused
    if (!audio.isPlaying && !isGameFinished && key.length === 1) {
      audio.play();
      updatePlayButtonState(true);
    }

    if (['Shift', 'Control', 'Alt', 'Meta', 'CapsLock', 'Tab'].includes(key)) {
      return;
    }

    const handled = typing.handleKey(key);
    if (handled) {
      e.preventDefault();
    }
  });

  // Virtual key mouse clicks
  keys.forEach((keyEl) => {
    keyEl.addEventListener('click', () => {
      const dataKey = keyEl.getAttribute('data-key');
      if (dataKey) {
        const event = new KeyboardEvent('keydown', { key: dataKey });
        window.dispatchEvent(event);
      }
    });
  });

  // Results Modal Restart
  btnResultsRestart.addEventListener('click', () => {
    resultsModal.classList.remove('active');
    resultsModal.setAttribute('aria-hidden', 'true');
    loadTrack(currentSong.id);
    audio.play();
    updatePlayButtonState(true);
  });

  // Initial Load
  loadTrack('midnight-city');
});
