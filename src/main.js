/**
 * Rhythm Keys // Precision Audio, Typing & 3D Three.js Engine
 * Real-time spectrum visualizer, Leaderboard system, Practice drills, judgment FX & mechanical key SFX.
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
  const trackBpmBadge = document.getElementById('trackBpmBadge');
  const btnHeaderTrackPicker = document.getElementById('btnHeaderTrackPicker');
  const headerSpectrumCanvas = document.getElementById('headerSpectrumCanvas');
  const specCtx = headerSpectrumCanvas ? headerSpectrumCanvas.getContext('2d') : null;

  // Transport Buttons
  const btnPlayPause = document.getElementById('btnPlayPause');
  const playButtonText = document.getElementById('playButtonText');
  const playIconSvg = document.getElementById('playIconSvg');
  const pauseIconSvg = document.getElementById('pauseIconSvg');
  const btnRestart = document.getElementById('btnRestart');
  const btnToggleSfx = document.getElementById('btnToggleSfx');
  const sfxLabel = document.getElementById('sfxLabel');
  const diffHard = document.getElementById('diffHard');
  const diffText = document.getElementById('diffText');

  // Stats HUD
  const hudComboContainer = document.getElementById('hudComboContainer');
  const hudCombo = document.getElementById('hudCombo');
  const hudStreak = document.getElementById('hudStreak');
  const hudWpm = document.getElementById('hudWpm');
  const hudAcc = document.getElementById('hudAcc');
  const hudScore = document.getElementById('hudScore');

  // Lyrics Elements & Overlays
  const lyricPrevText = document.getElementById('lyricPrevText');
  const activeCharsContainer = document.getElementById('activeChars');
  const lyricNextText = document.getElementById('lyricNextText');
  const lineProgressBar = document.getElementById('lineProgressBar');
  const judgmentOverlay = document.getElementById('judgmentOverlay');

  // Practice Mode Banner
  const practiceBanner = document.getElementById('practiceBanner');
  const practiceSpeedBtns = document.querySelectorAll('.practice-speed-btn');

  // Navigation Items
  const navPlay = document.getElementById('navPlay');
  const navPractice = document.getElementById('navPractice');
  const navLeaderboard = document.getElementById('navLeaderboard');
  const allNavBtns = [navPlay, navPractice, navLeaderboard];

  // Settings & Track Selector Modal
  const settingsModal = document.getElementById('settingsModal');
  const btnSettings = document.getElementById('btnSettings');
  const btnSettingsClose = document.getElementById('btnSettingsClose');
  const btnSettingsCancel = document.getElementById('btnSettingsCancel');
  const btnSettingsApply = document.getElementById('btnSettingsApply');
  const trackCardsGrid = document.getElementById('trackCardsGrid');
  const volumeSlider = document.getElementById('volumeSlider');
  const volumeVal = document.getElementById('volumeVal');
  const customTrackDetails = document.getElementById('customTrackDetails');
  const customTitleInput = document.getElementById('customTitleInput');
  const customAudioUrl = document.getElementById('customAudioUrl');
  const customLrcText = document.getElementById('customLrcText');

  // Leaderboard Modal
  const leaderboardModal = document.getElementById('leaderboardModal');
  const btnLeaderboardClose = document.getElementById('btnLeaderboardClose');
  const btnLeaderboardClose2 = document.getElementById('btnLeaderboardClose2');
  const btnLeaderboardReset = document.getElementById('btnLeaderboardReset');
  const leaderboardTbody = document.getElementById('leaderboardTbody');

  // Results Modal
  const resultsModal = document.getElementById('resultsModal');
  const resultsGradeBadge = document.getElementById('resultsGradeBadge');
  const resultsTrackInfo = document.getElementById('resultsTrackInfo');
  const resScore = document.getElementById('resScore');
  const resWpm = document.getElementById('resWpm');
  const resAcc = document.getElementById('resAcc');
  const resCombo = document.getElementById('resCombo');
  const playerNameInput = document.getElementById('playerNameInput');
  const btnSaveScore = document.getElementById('btnSaveScore');
  const btnResultsTracks = document.getElementById('btnResultsTracks');
  const btnResultsRestart = document.getElementById('btnResultsRestart');

  // Virtual 3D Keyboard Map
  const keys = document.querySelectorAll('.key-3d');
  const keyElementMap = new Map();
  keys.forEach((keyEl) => {
    const dataKey = keyEl.getAttribute('data-key');
    if (dataKey) {
      keyElementMap.set(dataKey.toLowerCase(), keyEl);
    }
  });

  // --- 3. STATE & ENGINES ---
  const audio = new AudioController();
  let currentSong = SONG_DATABASE['midnight-city'];
  let parsedLyrics = LrcParser.parse(currentSong.lrc);
  let activeLyricIndex = 0;
  let isGameFinished = false;
  let isPracticeMode = false;
  let selectedTrackId = 'midnight-city';
  let gameSpeed = 1.0;

  // Typing Controller with Real-time Scoring & Judgment
  const typing = new TypingController({
    onTypo: () => {
      if (!isPracticeMode) {
        audio.applyPenalty();
      }
      audio.playKeyClick(false);
      renderActiveChars();
    },
    onCorrect: () => {
      audio.clearPenalty();
      audio.playKeyClick(true);
      renderActiveChars();
    },
    onJudgment: (judg) => {
      showJudgmentEffect(judg.type, judg.points);
    },
    onLineComplete: () => {
      if (isPracticeMode) {
        // In practice mode, optionally loop current line or advance
        if (activeLyricIndex < parsedLyrics.length - 1) {
          setLyricLine(activeLyricIndex + 1);
        } else {
          setLyricLine(0);
        }
      } else {
        if (activeLyricIndex < parsedLyrics.length - 1) {
          setLyricLine(activeLyricIndex + 1);
        } else {
          finishGame();
        }
      }
    },
    onStatsUpdate: (stats) => {
      if (hudWpm) hudWpm.textContent = stats.wpm;
      if (hudAcc) hudAcc.textContent = `${stats.accuracy}%`;
      if (hudStreak) hudStreak.textContent = stats.streak;
      if (hudScore) hudScore.textContent = stats.score.toLocaleString();

      if (lineProgressBar) {
        lineProgressBar.style.width = `${Math.round(stats.progress * 100)}%`;
      }
    }
  });

  // --- 4. FLOATING FINAL FANTASY JUDGMENT EFFECT ---
  function showJudgmentEffect(type, points) {
    if (!judgmentOverlay) return;
    const el = document.createElement('div');
    el.className = `judgment-bubble ${type === 'PERFECT' ? 'judgment-perfect' : 'judgment-miss'}`;
    el.textContent = type === 'PERFECT' ? `CRITICAL +${points}` : 'MISS';
    judgmentOverlay.appendChild(el);
    setTimeout(() => {
      if (el.parentNode) el.parentNode.removeChild(el);
    }, 550);
  }

  // --- 5. POPULATE TRACK SELECTION CARDS ---
  function renderTrackCards() {
    if (!trackCardsGrid) return;
    trackCardsGrid.innerHTML = '';
    Object.values(SONG_DATABASE).forEach((song) => {
      const card = document.createElement('div');
      card.className = `track-card ${song.id === selectedTrackId ? 'active' : ''}`;
      card.innerHTML = `
        <span class="track-card-title">${song.title}</span>
        <span class="track-card-artist">${song.artist}</span>
        <span class="track-card-genre">${song.genre} • ${song.bpm} BPM</span>
      `;
      card.addEventListener('click', () => {
        document.querySelectorAll('.track-card').forEach((c) => c.classList.remove('active'));
        card.classList.add('active');
        selectedTrackId = song.id;
      });
      trackCardsGrid.appendChild(card);
    });
  }
  renderTrackCards();

  // --- 6. TRACK LOADING ---
  function loadTrack(trackKey, customData = null) {
    audio.pause();
    isGameFinished = false;

    if (customData) {
      currentSong = customData;
      selectedTrackId = 'custom-track';
    } else {
      currentSong = SONG_DATABASE[trackKey] || SONG_DATABASE['midnight-city'];
      selectedTrackId = currentSong.id;
    }

    parsedLyrics = LrcParser.parse(currentSong.lrc);
    currentTrackTitle.textContent = currentSong.title;
    currentTrackArtist.textContent = currentSong.artist;
    if (trackBpmBadge) {
      trackBpmBadge.textContent = `${currentSong.bpm || 110} BPM`;
    }

    if (currentSong.audioUrl) {
      audio.loadAudioUrl(currentSong.audioUrl);
    } else {
      audio.setSynthTrack(currentSong.id);
    }

    activeLyricIndex = 0;
    setLyricLine(0);
    typing.reset();
    updatePlayButtonState(false);
    renderTrackCards();
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

    if (lineProgressBar) {
      lineProgressBar.style.width = '0%';
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
    if (stats.accuracy >= 98 && stats.wpm >= 65) grade = 'RANK S';
    else if (stats.accuracy >= 90) grade = 'RANK A';
    else if (stats.accuracy >= 80) grade = 'RANK B';
    else grade = 'RANK C';

    resultsGradeBadge.textContent = grade;
    resultsTrackInfo.textContent = `${currentSong.title} // ${currentSong.artist}`;
    resScore.textContent = stats.score.toLocaleString();
    resWpm.textContent = `${stats.wpm} WPM`;
    resAcc.textContent = `${stats.accuracy}%`;
    resCombo.textContent = `${stats.maxStreak} STREAK`;

    resultsModal.classList.add('active');
    resultsModal.setAttribute('aria-hidden', 'false');
  }

  // --- 7. LEADERBOARD SYSTEM (LOCAL STORAGE & PRESETS) ---
  const DEFAULT_LEADERBOARD = [
    { name: 'VortexPilot', track: 'Midnight City', wpm: 92, acc: 99, score: 24600 },
    { name: 'CyberKnight', track: 'Neon Pulse', wpm: 86, acc: 98, score: 21800 },
    { name: 'StellarEcho', track: 'Cyber Odyssey', wpm: 78, acc: 96, score: 18400 },
    { name: 'HyperDrive_88', track: 'Starlight Hyperdrive', wpm: 74, acc: 95, score: 16200 },
    { name: 'AstralZen', track: 'Cosmic Horizon', wpm: 68, acc: 94, score: 14000 }
  ];

  function getLeaderboard() {
    try {
      const saved = localStorage.getItem('rhythm_keys_leaderboard');
      if (saved) return JSON.parse(saved);
    } catch (e) {
      console.warn("Could not read localStorage leaderboard:", e);
    }
    return DEFAULT_LEADERBOARD;
  }

  function saveLeaderboard(entries) {
    try {
      localStorage.setItem('rhythm_keys_leaderboard', JSON.stringify(entries));
    } catch (e) {
      console.warn("Could not save localStorage leaderboard:", e);
    }
  }

  function renderLeaderboardTable() {
    if (!leaderboardTbody) return;
    leaderboardTbody.innerHTML = '';
    const entries = getLeaderboard().sort((a, b) => b.score - a.score);

    entries.forEach((entry, idx) => {
      const tr = document.createElement('tr');
      const rankBadge = idx < 9 ? `0${idx + 1}` : `${idx + 1}`;
      tr.innerHTML = `
        <td class="rank-badge-cell">[ ${rankBadge} ]</td>
        <td style="color: #ffffff; font-weight: 700;">${entry.name}</td>
        <td>${entry.track}</td>
        <td>${entry.wpm}</td>
        <td>${entry.acc}%</td>
        <td style="color: #ffffff; font-weight: 800;">${entry.score.toLocaleString()}</td>
      `;
      leaderboardTbody.appendChild(tr);
    });
  }

  // --- 8. MAKO CRYSTAL AUDIO SPECTRUM VISUALIZER & SYNC LOOP ---
  function drawSpectrum() {
    if (!specCtx || !headerSpectrumCanvas) return;
    const freqData = audio.getFrequencyData();
    const width = headerSpectrumCanvas.width;
    const height = headerSpectrumCanvas.height;

    specCtx.clearRect(0, 0, width, height);

    const barCount = 18;
    const barWidth = Math.floor(width / barCount) - 2;
    const step = Math.floor(freqData.length / barCount);

    for (let i = 0; i < barCount; i++) {
      const val = audio.isPlaying ? freqData[i * step] : 10;
      const barHeight = Math.max(2, (val / 255) * height);
      const x = i * (barWidth + 2);
      const y = height - barHeight;

      const grad = specCtx.createLinearGradient(0, y, 0, height);
      grad.addColorStop(0, '#38bdf8'); // Mako Cyan
      grad.addColorStop(1, '#1d4ed8'); // Deep Royal Sapphire

      specCtx.fillStyle = grad;
      specCtx.fillRect(x, y, barWidth, barHeight);
    }
  }

  function syncLoop() {
    drawSpectrum();

    if (audio.isPlaying && !isGameFinished) {
      const curTime = audio.getCurrentTime();
      const duration = currentSong.duration || 120;

      // Pass real-time audio energy to SpaceScene
      if (spaceScene) {
        const energy = audio.getAudioEnergy();
        spaceScene.setAudioEnergy(energy);
      }

      if (!isPracticeMode) {
        const targetIndex = LrcParser.getActiveIndex(parsedLyrics, curTime);
        if (targetIndex !== -1 && targetIndex !== activeLyricIndex) {
          setLyricLine(targetIndex);
        }

        if (curTime >= duration) {
          finishGame();
        }
      }
    }

    requestAnimationFrame(syncLoop);
  }
  requestAnimationFrame(syncLoop);

  // --- 9. EVENT HANDLERS & NAVIGATION ---

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

  // Toggle SFX Key Click
  btnToggleSfx.addEventListener('click', () => {
    audio.sfxEnabled = !audio.sfxEnabled;
    if (audio.sfxEnabled) {
      btnToggleSfx.classList.add('active');
      sfxLabel.textContent = 'SFX ON';
    } else {
      btnToggleSfx.classList.remove('active');
      sfxLabel.textContent = 'SFX OFF';
    }
  });

  // Difficulty Toggle
  const diffs = [
    { text: 'SPEED: 1.0x', mult: 1.0 },
    { text: 'SPEED: 1.25x', mult: 1.25 },
    { text: 'SPEED: 1.50x', mult: 1.5 }
  ];
  let currentDiffIdx = 0;
  diffHard.addEventListener('click', () => {
    currentDiffIdx = (currentDiffIdx + 1) % diffs.length;
    diffText.textContent = diffs[currentDiffIdx].text;
    gameSpeed = diffs[currentDiffIdx].mult;
  });

  // Navigation Modes
  navPlay.addEventListener('click', () => {
    allNavBtns.forEach((b) => b.classList.remove('active'));
    navPlay.classList.add('active');
    isPracticeMode = false;
    practiceBanner.style.display = 'none';
  });

  navPractice.addEventListener('click', () => {
    allNavBtns.forEach((b) => b.classList.remove('active'));
    navPractice.classList.add('active');
    isPracticeMode = true;
    practiceBanner.style.display = 'flex';
  });

  navLeaderboard.addEventListener('click', () => {
    renderLeaderboardTable();
    leaderboardModal.classList.add('active');
    leaderboardModal.setAttribute('aria-hidden', 'false');
  });

  // Practice Speed Controls
  practiceSpeedBtns.forEach((btn) => {
    btn.addEventListener('click', () => {
      practiceSpeedBtns.forEach((b) => b.classList.remove('active'));
      btn.classList.add('active');
    });
  });

  // Settings & Track Station Modal
  function openSettings() {
    renderTrackCards();
    settingsModal.classList.add('active');
    settingsModal.setAttribute('aria-hidden', 'false');
  }

  function closeSettings() {
    settingsModal.classList.remove('active');
    settingsModal.setAttribute('aria-hidden', 'true');
  }

  btnSettings.addEventListener('click', openSettings);
  if (btnHeaderTrackPicker) btnHeaderTrackPicker.addEventListener('click', openSettings);
  btnSettingsClose.addEventListener('click', closeSettings);
  btnSettingsCancel.addEventListener('click', closeSettings);

  btnSettingsApply.addEventListener('click', () => {
    if (customTrackDetails && customTrackDetails.open) {
      const title = customTitleInput.value.trim() || 'Custom Signal';
      const audioUrl = customAudioUrl.value.trim() || null;
      const lrc = customLrcText.value.trim() || currentSong.lrc;
      loadTrack('custom-track', {
        id: 'custom-track',
        title: title,
        artist: 'Custom Transmission',
        genre: 'User Broadcast',
        duration: 120,
        bpm: 115,
        audioUrl: audioUrl,
        lrc: lrc
      });
    } else {
      loadTrack(selectedTrackId);
    }
    closeSettings();
    audio.play();
    updatePlayButtonState(true);
  });

  // Volume Slider
  volumeSlider.addEventListener('input', (e) => {
    const val = parseInt(e.target.value, 10);
    volumeVal.textContent = `${val}%`;
    audio.setVolume(val / 100);
  });

  // Leaderboard Modal Close & Reset
  function closeLeaderboard() {
    leaderboardModal.classList.remove('active');
    leaderboardModal.setAttribute('aria-hidden', 'true');
  }
  btnLeaderboardClose.addEventListener('click', closeLeaderboard);
  btnLeaderboardClose2.addEventListener('click', closeLeaderboard);

  btnLeaderboardReset.addEventListener('click', () => {
    saveLeaderboard(DEFAULT_LEADERBOARD);
    renderLeaderboardTable();
  });

  // Results Modal Handlers
  btnSaveScore.addEventListener('click', () => {
    const name = playerNameInput.value.trim() || 'StarPilot';
    const stats = typing.getStats();
    const currentList = getLeaderboard();
    currentList.push({
      name: name,
      track: currentSong.title,
      wpm: stats.wpm,
      acc: stats.accuracy,
      score: stats.score
    });
    saveLeaderboard(currentList);
    btnSaveScore.textContent = 'Saved! ✓';
    btnSaveScore.disabled = true;
    setTimeout(() => {
      resultsModal.classList.remove('active');
      resultsModal.setAttribute('aria-hidden', 'true');
      navLeaderboard.click();
    }, 600);
  });

  btnResultsTracks.addEventListener('click', () => {
    resultsModal.classList.remove('active');
    resultsModal.setAttribute('aria-hidden', 'true');
    openSettings();
  });

  btnResultsRestart.addEventListener('click', () => {
    resultsModal.classList.remove('active');
    resultsModal.setAttribute('aria-hidden', 'true');
    loadTrack(currentSong.id);
    audio.play();
    updatePlayButtonState(true);
  });

  // Keyboard Shortcuts & Typing Event Listeners
  window.addEventListener('keydown', (e) => {
    const key = e.key;

    // Ignore when modal active
    if (settingsModal.classList.contains('active') || leaderboardModal.classList.contains('active')) {
      if (key === 'Escape') {
        closeSettings();
        closeLeaderboard();
      }
      return;
    }

    if (resultsModal.classList.contains('active')) {
      return;
    }

    // Shortcut: ESC opens settings
    if (key === 'Escape') {
      openSettings();
      return;
    }

    // Shortcut: Spacebar toggles playback when not currently typing a word that expects space
    const target = typing.targetLine;
    const nextExpected = target ? target[typing.typedBuffer.length] : null;
    if (key === ' ' && nextExpected !== ' ' && !audio.isPlaying) {
      e.preventDefault();
      audio.play();
      updatePlayButtonState(true);
      return;
    }

    // Shortcut: TAB restarts or loops line in practice
    if (key === 'Tab') {
      e.preventDefault();
      if (isPracticeMode) {
        typing.setTargetLine(typing.targetLine);
        renderActiveChars();
      } else {
        btnRestart.click();
      }
      return;
    }

    const lowerKey = key.toLowerCase();

    // Visual active animation on virtual 3D keyboard
    const virtualKey = keyElementMap.get(lowerKey) || keyElementMap.get(key);
    if (virtualKey) {
      virtualKey.classList.add('key-pressed');
      setTimeout(() => virtualKey.classList.remove('key-pressed'), 75);
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

  // Initial Load
  loadTrack('midnight-city');
});

