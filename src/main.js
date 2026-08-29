/**
 * Rhythm Keys // Cockpit Rhythm-Typing Engine
 * Phase 2 & 3: Web Audio API Engine, Real-Time Typing Controller, LRC Synchronization
 */

import { AudioController } from './audio/AudioController.js';
import { TypingController } from './typing/TypingController.js';
import { LrcParser } from './lyrics/LrcParser.js';
import { SONG_DATABASE } from './lyrics/songDatabase.js';

document.addEventListener('DOMContentLoaded', () => {
  // --- 1. DOM ELEMENTS ---
  const trackSelector = document.getElementById('trackSelector');
  const currentTrackTitle = document.getElementById('currentTrackTitle');
  const currentTrackArtist = document.getElementById('currentTrackArtist');
  const btnPlayPause = document.getElementById('btnPlayPause');
  const playButtonText = document.getElementById('playButtonText');
  const playPolygon = document.getElementById('playPolygon');
  const btnRestart = document.getElementById('btnRestart');
  const timelineSlider = document.getElementById('timelineSlider');
  const timeCurrent = document.getElementById('timeCurrent');
  const timeDuration = document.getElementById('timeDuration');
  const volumeSlider = document.getElementById('volumeSlider');
  const diffBtn = document.getElementById('diffHard');
  const eqBars = document.querySelectorAll('.eq-bar');

  // Stats HUD
  const hudWpm = document.getElementById('hudWpm');
  const hudAcc = document.getElementById('hudAcc');
  const hudCombo = document.getElementById('hudCombo');
  const audioStatusBadge = document.getElementById('audioStatusBadge');
  const audioStatusText = document.getElementById('audioStatusText');

  // Lyrics Elements
  const lyricPrevText = document.getElementById('lyricPrevText');
  const activeCharsContainer = document.getElementById('activeChars');
  const lyricNextText = document.getElementById('lyricNextText');
  const lyricProgressFill = document.getElementById('lyricProgressFill');

  // Modals
  const customModal = document.getElementById('customSongModal');
  const btnCustomModalOpen = document.getElementById('btnCustomModalOpen');
  const btnCustomModalClose = document.getElementById('btnCustomModalClose');
  const btnCustomCancel = document.getElementById('btnCustomCancel');
  const btnCustomLoad = document.getElementById('btnCustomLoad');
  const customTitleInput = document.getElementById('customTitleInput');
  const customAudioUrl = document.getElementById('customAudioUrl');
  const customLrcText = document.getElementById('customLrcText');

  // Results Modal
  const resultsModal = document.getElementById('resultsModal');
  const resultsGradeBadge = document.getElementById('resultsGradeBadge');
  const resultsTrackInfo = document.getElementById('resultsTrackInfo');
  const resWpm = document.getElementById('resWpm');
  const resAcc = document.getElementById('resAcc');
  const resCombo = document.getElementById('resCombo');
  const resLines = document.getElementById('resLines');
  const btnResultsRestart = document.getElementById('btnResultsRestart');

  // Keyboard elements
  const keys = document.querySelectorAll('.key');
  const keyElementMap = new Map();
  keys.forEach((keyEl) => {
    const dataKey = keyEl.getAttribute('data-key');
    if (dataKey) {
      keyElementMap.set(dataKey.toLowerCase(), keyEl);
    }
  });

  // --- 2. ENGINE INSTANCES ---
  const audio = new AudioController();
  let currentSong = SONG_DATABASE['cyber-odyssey'];
  let parsedLyrics = LrcParser.parse(currentSong.lrc);
  let activeLyricIndex = 0;
  let isGameFinished = false;

  const typing = new TypingController({
    onTypo: () => {
      audio.applyPenalty();
      audioStatusBadge.classList.add('degraded');
      audioStatusText.textContent = 'AUDIO ENGINE: MUFFLED (LOW-PASS 380Hz) - CORRECT TYPO!';
      renderActiveChars();
    },
    onCorrect: () => {
      audio.clearPenalty();
      audioStatusBadge.classList.remove('degraded');
      audioStatusText.textContent = 'AUDIO ENGINE: SYNCHRONIZED (FILTER CLEAR)';
      renderActiveChars();
    },
    onLineComplete: () => {
      // Advance to next lyric line if available
      if (activeLyricIndex < parsedLyrics.length - 1) {
        setLyricLine(activeLyricIndex + 1);
      } else {
        finishGame();
      }
    },
    onStatsUpdate: (stats) => {
      hudWpm.textContent = stats.wpm;
      hudAcc.textContent = `${stats.accuracy}%`;
      hudCombo.textContent = stats.combo;
      lyricProgressFill.style.width = `${Math.min(100, stats.progress * 100)}%`;
    }
  });

  // --- 3. HELPER FUNCTIONS ---
  function formatTime(seconds) {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  }

  function loadTrack(trackKey, customData = null) {
    audio.pause();
    isGameFinished = false;

    if (customData) {
      currentSong = customData;
    } else {
      currentSong = SONG_DATABASE[trackKey] || SONG_DATABASE['cyber-odyssey'];
    }

    parsedLyrics = LrcParser.parse(currentSong.lrc);
    currentTrackTitle.textContent = currentSong.title;
    currentTrackArtist.textContent = currentSong.artist;
    timeDuration.textContent = formatTime(currentSong.duration || 120);
    timelineSlider.value = 0;
    timeCurrent.textContent = '00:00';

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
      lyricPrevText.textContent = '(Cockpit Flight Systems Ready)';
    }

    // Active Target Line
    const activeText = parsedLyrics[activeLyricIndex].text || '';
    typing.setTargetLine(activeText);
    renderActiveChars();

    // Next Line
    if (activeLyricIndex < parsedLyrics.length - 1) {
      lyricNextText.textContent = parsedLyrics[activeLyricIndex + 1].text || '(...)';
    } else {
      lyricNextText.textContent = '(Final Transmission Approaching)';
    }
  }

  function renderActiveChars() {
    activeCharsContainer.innerHTML = '';
    const target = typing.targetLine;
    const typed = typing.typedBuffer;

    if (!target) {
      const span = document.createElement('span');
      span.className = 'char char-pending';
      span.textContent = '(Instrumental Section - Standby)';
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

  function updatePlayButtonState(playing) {
    if (playing) {
      playButtonText.textContent = 'DISENGAGE';
      btnPlayPause.style.background = 'linear-gradient(135deg, #00e5ff 0%, #0284c7 100%)';
      btnPlayPause.style.boxShadow = '0 0 25px rgba(0, 229, 255, 0.6)';
      playPolygon.setAttribute('points', '6 4 10 4 10 20 6 20 14 4 18 4 18 20 14 20'); // Pause icon bars
    } else {
      playButtonText.textContent = 'ENGAGE';
      btnPlayPause.style.background = 'linear-gradient(135deg, #ff66cc 0%, #bd00ff 100%)';
      btnPlayPause.style.boxShadow = '0 0 20px rgba(255, 102, 204, 0.5)';
      playPolygon.setAttribute('points', '5 3 19 12 5 21 5 3'); // Play triangle
    }
  }

  function finishGame() {
    if (isGameFinished) return;
    isGameFinished = true;
    audio.pause();
    updatePlayButtonState(false);

    const stats = typing.getStats();
    let grade = 'A';
    if (stats.accuracy >= 98 && stats.wpm >= 60) grade = 'RANK S';
    else if (stats.accuracy >= 90) grade = 'RANK A';
    else if (stats.accuracy >= 80) grade = 'RANK B';
    else grade = 'RANK C';

    resultsGradeBadge.textContent = grade;
    resultsTrackInfo.textContent = `${currentSong.title} // ${currentSong.artist}`;
    resWpm.textContent = stats.wpm;
    resAcc.textContent = `${stats.accuracy}%`;
    resCombo.textContent = `${stats.combo} (${typing.maxStreak})`;
    resLines.textContent = `${typing.completedLinesCount} / ${parsedLyrics.length}`;

    resultsModal.classList.add('active');
    resultsModal.setAttribute('aria-hidden', 'false');
  }

  // --- 4. REAL-TIME SYNC & VISUALIZER LOOP ---
  function syncLoop() {
    if (audio.isPlaying && !isGameFinished) {
      const curTime = audio.getCurrentTime();
      const duration = currentSong.duration || 120;

      // Update timeline seeker
      timeCurrent.textContent = formatTime(curTime);
      timelineSlider.value = Math.min(100, (curTime / duration) * 100);

      // Check lyrics sync
      const targetIndex = LrcParser.getActiveIndex(parsedLyrics, curTime);
      if (targetIndex !== -1 && targetIndex !== activeLyricIndex) {
        setLyricLine(targetIndex);
      }

      // Check song end
      if (curTime >= duration) {
        finishGame();
      }

      // Update EQ Visualizer bars with Web Audio Analyser data
      const freqData = audio.getFrequencyData();
      if (freqData && freqData.length > 0) {
        eqBars.forEach((bar, idx) => {
          const sample = freqData[idx * 2] || 0;
          const percent = Math.max(15, Math.min(100, (sample / 255) * 100));
          bar.style.height = `${percent}%`;
        });
      }
    } else {
      // Idle EQ bounce
      eqBars.forEach((bar, idx) => {
        bar.style.height = `${15 + ((idx % 3) * 10)}%`;
      });
    }

    requestAnimationFrame(syncLoop);
  }
  requestAnimationFrame(syncLoop);

  // --- 5. EVENT LISTENERS ---

  // Play / Pause Toggle
  btnPlayPause.addEventListener('click', () => {
    if (audio.isPlaying) {
      audio.pause();
      updatePlayButtonState(false);
    } else {
      audio.play();
      updatePlayButtonState(true);
    }
  });

  // Restart Track
  btnRestart.addEventListener('click', () => {
    audio.restart();
    typing.reset();
    setLyricLine(0);
    timelineSlider.value = 0;
    timeCurrent.textContent = '00:00';
    updatePlayButtonState(false);
  });

  // Track Selector Change
  trackSelector.addEventListener('change', (e) => {
    const val = e.target.value;
    if (val === 'custom-lrc') {
      customModal.classList.add('active');
      customModal.setAttribute('aria-hidden', 'false');
    } else {
      loadTrack(val);
    }
  });

  // Timeline Slider Scrubbing
  timelineSlider.addEventListener('input', (e) => {
    const percent = parseFloat(e.target.value);
    const duration = currentSong.duration || 120;
    const targetSeconds = (percent / 100) * duration;
    audio.seek(targetSeconds);
    timeCurrent.textContent = formatTime(targetSeconds);

    const targetIndex = LrcParser.getActiveIndex(parsedLyrics, targetSeconds);
    if (targetIndex !== -1) {
      setLyricLine(targetIndex);
    }
  });

  // Volume Slider
  volumeSlider.addEventListener('input', (e) => {
    const vol = parseFloat(e.target.value) / 100;
    audio.setVolume(vol);
  });

  // Difficulty Toggle
  const diffs = ['NORMAL', 'HARD', 'HYPER'];
  let currentDiffIdx = 1;
  diffBtn.addEventListener('click', () => {
    currentDiffIdx = (currentDiffIdx + 1) % diffs.length;
    diffBtn.textContent = diffs[currentDiffIdx];
  });

  // Keyboard Handler (Physical Keydown)
  window.addEventListener('keydown', (e) => {
    // If modal is active, let typing happen inside inputs
    if (customModal.classList.contains('active')) {
      return;
    }

    const key = e.key;
    const lowerKey = key.toLowerCase();

    // Visual press animation on virtual 3D keyboard
    const virtualKey = keyElementMap.get(lowerKey) || keyElementMap.get(key);
    if (virtualKey) {
      virtualKey.classList.add('key-pressed');
      setTimeout(() => virtualKey.classList.remove('key-pressed'), 110);
    }

    // Auto-start music if not playing on first typing keystroke
    if (!audio.isPlaying && !isGameFinished && key.length === 1) {
      audio.play();
      updatePlayButtonState(true);
    }

    // Ignore navigation modifiers
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

  // Custom Modal Handlers
  btnCustomModalOpen.addEventListener('click', () => {
    customModal.classList.add('active');
    customModal.setAttribute('aria-hidden', 'false');
  });

  function closeCustomModal() {
    customModal.classList.remove('active');
    customModal.setAttribute('aria-hidden', 'true');
    if (trackSelector.value === 'custom-lrc') {
      trackSelector.value = currentSong.id;
    }
  }

  btnCustomModalClose.addEventListener('click', closeCustomModal);
  btnCustomCancel.addEventListener('click', closeCustomModal);

  btnCustomLoad.addEventListener('click', () => {
    const title = customTitleInput.value.trim() || 'Custom Cosmic Transmission';
    const audioUrl = customAudioUrl.value.trim() || null;
    const lrc = customLrcText.value.trim() || currentSong.lrc;

    const customData = {
      id: 'custom-user-track',
      title: title,
      artist: 'Custom Transmission',
      duration: 120,
      audioUrl: audioUrl,
      lrc: lrc
    };

    closeCustomModal();
    loadTrack('custom-user-track', customData);
    audio.play();
    updatePlayButtonState(true);
  });

  // Results Modal Restart
  btnResultsRestart.addEventListener('click', () => {
    resultsModal.classList.remove('active');
    resultsModal.setAttribute('aria-hidden', 'true');
    loadTrack(currentSong.id);
    audio.play();
    updatePlayButtonState(true);
  });

  // Initial Boot
  loadTrack('cyber-odyssey');
});
