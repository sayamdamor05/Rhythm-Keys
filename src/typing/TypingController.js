/**
 * TypingController.js // Typing & Accuracy Engine for Rhythm Keys
 * Handles keystrokes, character validation, combo streaks, real-time WPM, and audio penalty callbacks.
 */

export class TypingController {
  /**
   * @param {Object} options
   * @param {Function} options.onTypo
   * @param {Function} options.onCorrect
   * @param {Function} options.onLineComplete
   * @param {Function} options.onStatsUpdate
   */
  constructor(options = {}) {
    this.onTypo = options.onTypo || (() => {});
    this.onCorrect = options.onCorrect || (() => {});
    this.onLineComplete = options.onLineComplete || (() => {});
    this.onStatsUpdate = options.onStatsUpdate || (() => {});

    this.targetLine = '';
    this.typedBuffer = '';
    this.hasActiveTypo = false;

    // Performance Metrics
    this.totalAttempts = 0;
    this.totalCorrect = 0;
    this.currentStreak = 0;
    this.maxStreak = 0;
    this.startTime = null;
    this.completedLinesCount = 0;
  }

  /**
   * Sets new target lyric line to type
   * @param {string} text 
   */
  setTargetLine(text) {
    this.targetLine = text || '';
    this.typedBuffer = '';
    this.hasActiveTypo = false;
  }

  /**
   * Resets all performance stats
   */
  reset() {
    this.typedBuffer = '';
    this.hasActiveTypo = false;
    this.totalAttempts = 0;
    this.totalCorrect = 0;
    this.currentStreak = 0;
    this.maxStreak = 0;
    this.startTime = null;
    this.completedLinesCount = 0;
    this.emitStats();
  }

  /**
   * Process physical key press
   * @param {string} key 
   * @returns {boolean} whether the key was handled
   */
  handleKey(key) {
    if (!this.targetLine) return false;

    if (!this.startTime) {
      this.startTime = performance.now();
    }

    // Handle Backspace
    if (key === 'Backspace') {
      if (this.typedBuffer.length > 0) {
        this.typedBuffer = this.typedBuffer.slice(0, -1);
        this.checkErrorState();
        this.emitStats();
        return true;
      }
      return false;
    }

    // Ignore non-character keys
    if (key.length !== 1) {
      return false;
    }

    // Don't accept more characters if line is already filled
    if (this.typedBuffer.length >= this.targetLine.length) {
      return false;
    }

    const nextIndex = this.typedBuffer.length;
    const expectedChar = this.targetLine[nextIndex];
    this.typedBuffer += key;
    this.totalAttempts++;

    if (key === expectedChar) {
      this.totalCorrect++;
      this.currentStreak++;
      if (this.currentStreak > this.maxStreak) {
        this.maxStreak = this.currentStreak;
      }
      this.checkErrorState();
      this.onCorrect(key);
    } else {
      this.currentStreak = 0;
      this.hasActiveTypo = true;
      this.onTypo(key, expectedChar);
    }

    this.emitStats();

    // Check if entire line has been successfully typed
    if (this.typedBuffer === this.targetLine) {
      this.completedLinesCount++;
      this.onLineComplete(this.targetLine);
    }

    return true;
  }

  /**
   * Checks if current typed buffer has any incorrect characters
   */
  checkErrorState() {
    let typoFound = false;
    for (let i = 0; i < this.typedBuffer.length; i++) {
      if (this.typedBuffer[i] !== this.targetLine[i]) {
        typoFound = true;
        break;
      }
    }

    this.hasActiveTypo = typoFound;
    if (!typoFound) {
      this.onCorrect();
    }
  }

  /**
   * Calculates WPM, Accuracy, and Combo Multiplier
   */
  getStats() {
    const elapsedMinutes = this.startTime 
      ? Math.max(0.01, (performance.now() - this.startTime) / 60000)
      : 0.01;

    // Standard WPM: (correct characters / 5) / minutes
    const wpm = Math.round((this.totalCorrect / 5) / elapsedMinutes);

    // Accuracy percentage
    const accuracy = this.totalAttempts > 0 
      ? Math.round((this.totalCorrect / this.totalAttempts) * 100) 
      : 100;

    // Combo Multiplier
    let multiplier = 1;
    if (this.currentStreak >= 50) multiplier = 4;
    else if (this.currentStreak >= 25) multiplier = 3;
    else if (this.currentStreak >= 10) multiplier = 2;

    return {
      wpm: Math.max(0, wpm),
      accuracy: Math.min(100, Math.max(0, accuracy)),
      combo: `x${multiplier}`,
      streak: this.currentStreak,
      hasTypo: this.hasActiveTypo,
      progress: this.targetLine.length > 0 ? (this.typedBuffer.length / this.targetLine.length) : 0
    };
  }

  emitStats() {
    this.onStatsUpdate(this.getStats());
  }
}
