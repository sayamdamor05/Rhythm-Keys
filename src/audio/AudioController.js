/**
 * AudioController.js // Web Audio API Engine for Rhythm Keys
 * Controls music playback, real-time frequency analysis, and typo degradation filters (BiquadFilterNode).
 */

import { SynthTrackGenerator } from './SynthTrackGenerator.js';

export class AudioController {
  constructor() {
    this.ctx = null;
    this.masterGain = null;
    this.penaltyFilter = null;
    this.analyser = null;
    this.synthEngine = null;

    this.isPlaying = false;
    this.isMuffled = false;
    this.playbackStartTime = 0;
    this.pausedAtTime = 0;
    this.audioElement = null;
    this.mediaSourceNode = null;
    this.useExternalAudio = false;

    // Default parameters
    this.normalFilterFreq = 20000; // All-pass / crystal clear
    this.muffledFilterFreq = 380;   // Low-pass muffle on typo
    this.currentVolume = 0.85;
  }

  /**
   * Initializes the Web Audio context graph on first user gesture
   */
  init() {
    if (this.ctx) {
      if (this.ctx.state === 'suspended') {
        this.ctx.resume();
      }
      return;
    }

    const AudioContextClass = window.AudioContext || window.webkitAudioContext;
    this.ctx = new AudioContextClass();

    // 1. Penalty Filter Node (BiquadFilter lowpass)
    this.penaltyFilter = this.ctx.createBiquadFilter();
    this.penaltyFilter.type = 'lowpass';
    this.penaltyFilter.frequency.setValueAtTime(this.normalFilterFreq, this.ctx.currentTime);
    this.penaltyFilter.Q.setValueAtTime(2.0, this.ctx.currentTime);

    // 2. Master Gain Node (Volume & Ducking)
    this.masterGain = this.ctx.createGain();
    this.masterGain.gain.setValueAtTime(this.currentVolume, this.ctx.currentTime);

    // 3. Analyser Node (Equalizer / HUD Waveform feedback)
    this.analyser = this.ctx.createAnalyser();
    this.analyser.fftSize = 64;
    this.analyser.smoothingTimeConstant = 0.8;

    // Route: Audio Source -> Penalty Filter -> Master Gain -> Analyser -> Destination (Speakers)
    this.penaltyFilter.connect(this.masterGain);
    this.masterGain.connect(this.analyser);
    this.analyser.connect(this.ctx.destination);

    // Initialize Procedural Web Audio Synth Engine
    this.synthEngine = new SynthTrackGenerator(this.ctx, this.penaltyFilter);
  }

  /**
   * Loads an external audio stream / URL (e.g. Jamendo stream)
   * @param {string} audioUrl 
   */
  loadAudioUrl(audioUrl) {
    this.init();
    this.useExternalAudio = true;
    if (this.synthEngine) {
      this.synthEngine.stop();
    }

    if (!this.audioElement) {
      this.audioElement = new Audio();
      this.audioElement.crossOrigin = 'anonymous';
      this.mediaSourceNode = this.ctx.createMediaElementSource(this.audioElement);
      this.mediaSourceNode.connect(this.penaltyFilter);
    }

    this.audioElement.src = audioUrl;
    this.audioElement.load();
  }

  /**
   * Switches to built-in procedural synth music track
   * @param {string} trackId 
   */
  setSynthTrack(trackId) {
    this.init();
    this.useExternalAudio = false;
    if (this.audioElement) {
      this.audioElement.pause();
    }
    if (this.synthEngine) {
      this.synthEngine.setTrack(trackId);
    }
  }

  /**
   * Starts or resumes music playback
   */
  play() {
    this.init();
    if (this.isPlaying) return;

    this.isPlaying = true;
    this.playbackStartTime = this.ctx.currentTime - this.pausedAtTime;

    if (this.useExternalAudio && this.audioElement) {
      this.audioElement.play().catch(e => console.warn("Audio playback error:", e));
    } else if (this.synthEngine) {
      this.synthEngine.start();
    }
  }

  /**
   * Pauses audio playback
   */
  pause() {
    if (!this.isPlaying) return;
    this.isPlaying = false;
    this.pausedAtTime = this.ctx.currentTime - this.playbackStartTime;

    if (this.useExternalAudio && this.audioElement) {
      this.audioElement.pause();
    } else if (this.synthEngine) {
      this.synthEngine.stop();
    }
  }

  /**
   * Resets playback position to zero
   */
  restart() {
    this.pausedAtTime = 0;
    this.playbackStartTime = this.ctx ? this.ctx.currentTime : 0;

    if (this.useExternalAudio && this.audioElement) {
      this.audioElement.currentTime = 0;
    }
    if (this.synthEngine) {
      this.synthEngine.step = 0;
    }
    this.clearPenalty();
  }

  /**
   * Seeks to specific time in seconds
   * @param {number} seconds 
   */
  seek(seconds) {
    this.pausedAtTime = seconds;
    if (this.ctx) {
      this.playbackStartTime = this.ctx.currentTime - seconds;
    }
    if (this.useExternalAudio && this.audioElement) {
      this.audioElement.currentTime = seconds;
    }
  }

  /**
   * Returns current audio position in seconds
   * @returns {number}
   */
  getCurrentTime() {
    if (!this.isPlaying) {
      return this.pausedAtTime;
    }
    if (this.useExternalAudio && this.audioElement) {
      return this.audioElement.currentTime;
    }
    if (this.ctx) {
      return Math.max(0, this.ctx.currentTime - this.playbackStartTime);
    }
    return 0;
  }

  /**
   * Sets Master Volume (0.0 to 1.0)
   * @param {number} volume 
   */
  setVolume(volume) {
    this.currentVolume = Math.max(0, Math.min(1, volume));
    if (this.masterGain && this.ctx) {
      const targetGain = this.isMuffled ? this.currentVolume * 0.45 : this.currentVolume;
      this.masterGain.gain.setValueAtTime(targetGain, this.ctx.currentTime);
    }
  }

  /**
   * TYPO PENALTY: Immediately muffles audio with low-pass filter and ducks volume
   */
  applyPenalty() {
    if (this.isMuffled || !this.ctx) return;
    this.isMuffled = true;

    const t = this.ctx.currentTime;
    // Exponential ramp down to 380Hz for underwater/cockpit-damaged muffled effect
    this.penaltyFilter.frequency.cancelScheduledValues(t);
    this.penaltyFilter.frequency.setValueAtTime(this.penaltyFilter.frequency.value, t);
    this.penaltyFilter.frequency.exponentialRampToValueAtTime(this.muffledFilterFreq, t + 0.08);

    // Duck volume slightly
    this.masterGain.gain.cancelScheduledValues(t);
    this.masterGain.gain.setValueAtTime(this.masterGain.gain.value, t);
    this.masterGain.gain.linearRampToValueAtTime(this.currentVolume * 0.45, t + 0.08);
  }

  /**
   * PENALTY RECOVERY: Immediately restores full frequency spectrum and crystal-clear audio
   */
  clearPenalty() {
    if (!this.isMuffled || !this.ctx) return;
    this.isMuffled = false;

    const t = this.ctx.currentTime;
    // Exponential ramp back to full all-pass 20kHz
    this.penaltyFilter.frequency.cancelScheduledValues(t);
    this.penaltyFilter.frequency.setValueAtTime(Math.max(100, this.penaltyFilter.frequency.value), t);
    this.penaltyFilter.frequency.exponentialRampToValueAtTime(this.normalFilterFreq, t + 0.12);

    // Restore volume
    this.masterGain.gain.cancelScheduledValues(t);
    this.masterGain.gain.setValueAtTime(this.masterGain.gain.value, t);
    this.masterGain.gain.linearRampToValueAtTime(this.currentVolume, t + 0.12);
  }

  /**
   * Retrieves frequency data array for visualizer animation
   * @returns {Uint8Array}
   */
  getFrequencyData() {
    if (!this.analyser) {
      return new Uint8Array(16);
    }
    const dataArray = new Uint8Array(this.analyser.frequencyBinCount);
    this.analyser.getByteFrequencyData(dataArray);
    return dataArray;
  }
}
