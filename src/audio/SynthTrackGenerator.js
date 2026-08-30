/**
 * SynthTrackGenerator.js // Procedural Web Audio Synthwave Music Engine for Rhythm Keys
 * Synthesizes dynamic electronic basslines, arpeggios, chords, and drum beats in real-time.
 */

export class SynthTrackGenerator {
  /**
   * @param {AudioContext} audioCtx 
   * @param {AudioNode} destinationNode 
   */
  constructor(audioCtx, destinationNode) {
    this.ctx = audioCtx;
    this.destination = destinationNode;
    this.isPlaying = false;
    this.bpm = 115;
    this.intervalId = null;
    this.step = 0;
    this.currentTrackId = 'cyber-odyssey';

    // Master generator output gain
    this.masterGain = this.ctx.createGain();
    this.masterGain.gain.setValueAtTime(0.45, this.ctx.currentTime);
    this.masterGain.connect(this.destination);

    // Pentatonic & modal scales for synthwave chords, leads, and chiptune arpeggios
    this.scales = {
      'cyber-odyssey': {
        bpm: 110,
        bass: [110.0, 98.0, 87.31, 98.0], // A2, G2, F2, G2
        chords: [
          [220, 261.63, 329.63], // Am
          [196, 246.94, 293.66], // G
          [174.61, 220, 261.63], // F
          [196, 246.94, 293.66]  // G
        ],
        lead: [440, 523.25, 587.33, 659.25, 783.99, 880]
      },
      'neon-pulse': {
        bpm: 125,
        bass: [73.42, 65.41, 55.0, 65.41], // D2, C2, A1, C2
        chords: [
          [293.66, 349.23, 440], // Dm
          [261.63, 329.63, 392], // C
          [220, 261.63, 329.63], // Am
          [261.63, 329.63, 392]  // C
        ],
        lead: [587.33, 698.46, 783.99, 880, 1046.5, 1174.66]
      },
      'midnight-city': {
        bpm: 105,
        bass: [130.81, 146.83, 110.0, 116.54], // C3, D3, A2, Bb2
        chords: [
          [261.63, 329.63, 392], // C
          [293.66, 369.99, 440], // D
          [220, 261.63, 329.63], // Am
          [233.08, 293.66, 349.23] // Bb
        ],
        lead: [523.25, 587.33, 659.25, 783.99, 880]
      },
      'starlight-hyperdrive': {
        bpm: 130,
        bass: [98.0, 110.0, 123.47, 130.81], // G2, A2, B2, C3
        chords: [
          [392, 493.88, 587.33], // G
          [440, 523.25, 659.25], // Am
          [493.88, 622.25, 739.99], // B
          [523.25, 659.25, 783.99]  // C
        ],
        lead: [783.99, 880, 987.77, 1046.5, 1174.66, 1318.51]
      },
      'cosmic-horizon': {
        bpm: 95,
        bass: [82.41, 87.31, 98.0, 110.0], // E2, F2, G2, A2
        chords: [
          [329.63, 392, 493.88], // Em
          [349.23, 440, 523.25], // F
          [392, 493.88, 587.33], // G
          [440, 523.25, 659.25]  // Am
        ],
        lead: [659.25, 783.99, 880, 987.77, 1046.5]
      }
    };
  }

  setTrack(trackId) {
    this.currentTrackId = trackId;
    const config = this.scales[trackId] || this.scales['cyber-odyssey'];
    this.bpm = config.bpm;
    if (this.isPlaying) {
      this.stop();
      this.start();
    }
  }

  start() {
    if (this.isPlaying) return;
    this.isPlaying = true;
    this.step = 0;

    const stepTimeMs = (60 / this.bpm / 4) * 1000; // 16th notes
    this.intervalId = setInterval(() => {
      this.playStep(this.step);
      this.step = (this.step + 1) % 64; // 4-bar loop
    }, stepTimeMs);
  }

  stop() {
    if (!this.isPlaying) return;
    this.isPlaying = false;
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
  }

  /**
   * Schedules a single 16th note step of bass, drums, chord pad, and arp
   */
  playStep(step) {
    if (this.ctx.state === 'suspended') {
      this.ctx.resume();
    }

    const t = this.ctx.currentTime;
    const trackConfig = this.scales[this.currentTrackId] || this.scales['cyber-odyssey'];
    const barIndex = Math.floor(step / 16) % 4;
    const stepInBar = step % 16;

    // 1. Kick Drum (on 0, 4, 8, 12: Four on the Floor)
    if (stepInBar % 4 === 0) {
      this.triggerKick(t);
    }

    // 2. Snare / Clap (on 4, 12)
    if (stepInBar === 4 || stepInBar === 12) {
      this.triggerSnare(t);
    }

    // 3. Hi-Hat (Every 2nd 16th note: 2, 6, 10, 14)
    if (stepInBar % 2 === 0) {
      this.triggerHiHat(t, stepInBar % 4 === 2);
    }

    // 4. Bassline (Pulsing 8th notes)
    if (stepInBar % 2 === 0) {
      const bassFreq = trackConfig.bass[barIndex];
      this.triggerBass(t, bassFreq);
    }

    // 5. Arpeggio Lead (16th notes syncopation)
    const arpNotes = trackConfig.lead;
    const arpNote = arpNotes[(step + (barIndex * 2)) % arpNotes.length];
    if (step % 2 === 1 || step % 4 === 0) {
      this.triggerLeadArp(t, arpNote);
    }

    // 6. Chord Pad (Triggered at start of each bar)
    if (stepInBar === 0) {
      this.triggerChordPad(t, trackConfig.chords[barIndex]);
    }
  }

  triggerKick(t) {
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(140, t);
    osc.frequency.exponentialRampToValueAtTime(38, t + 0.12);

    gain.gain.setValueAtTime(0.7, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.25);

    osc.connect(gain);
    gain.connect(this.masterGain);

    osc.start(t);
    osc.stop(t + 0.25);
  }

  triggerSnare(t) {
    // Noise buffer for snap
    const bufferSize = this.ctx.sampleRate * 0.15;
    const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const output = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      output[i] = Math.random() * 2 - 1;
    }

    const whiteNoise = this.ctx.createBufferSource();
    whiteNoise.buffer = buffer;

    const filter = this.ctx.createBiquadFilter();
    filter.type = 'highpass';
    filter.frequency.setValueAtTime(1200, t);

    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(0.35, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.15);

    whiteNoise.connect(filter);
    filter.connect(gain);
    gain.connect(this.masterGain);

    whiteNoise.start(t);
    whiteNoise.stop(t + 0.15);
  }

  triggerHiHat(t, accent) {
    const bufferSize = this.ctx.sampleRate * 0.04;
    const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const output = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      output[i] = Math.random() * 2 - 1;
    }

    const noise = this.ctx.createBufferSource();
    noise.buffer = buffer;

    const filter = this.ctx.createBiquadFilter();
    filter.type = 'highpass';
    filter.frequency.setValueAtTime(7000, t);

    const gain = this.ctx.createGain();
    const volume = accent ? 0.22 : 0.1;
    gain.gain.setValueAtTime(volume, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.04);

    noise.connect(filter);
    filter.connect(gain);
    gain.connect(this.masterGain);

    noise.start(t);
    noise.stop(t + 0.04);
  }

  triggerBass(t, freq) {
    const osc = this.ctx.createOscillator();
    const filter = this.ctx.createBiquadFilter();
    const gain = this.ctx.createGain();

    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(freq, t);

    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(600, t);
    filter.frequency.exponentialRampToValueAtTime(180, t + 0.18);
    filter.Q.setValueAtTime(4, t);

    gain.gain.setValueAtTime(0.4, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.2);

    osc.connect(filter);
    filter.connect(gain);
    gain.connect(this.masterGain);

    osc.start(t);
    osc.stop(t + 0.2);
  }

  triggerLeadArp(t, freq) {
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'square';
    osc.frequency.setValueAtTime(freq, t);

    gain.gain.setValueAtTime(0.12, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.12);

    osc.connect(gain);
    gain.connect(this.masterGain);

    osc.start(t);
    osc.stop(t + 0.12);
  }

  triggerChordPad(t, chordNotes) {
    chordNotes.forEach((note) => {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'triangle';
      osc.frequency.setValueAtTime(note, t);

      gain.gain.setValueAtTime(0.001, t);
      gain.gain.linearRampToValueAtTime(0.08, t + 0.3);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 2.0);

      osc.connect(gain);
      gain.connect(this.masterGain);

      osc.start(t);
      osc.stop(t + 2.0);
    });
  }
}
