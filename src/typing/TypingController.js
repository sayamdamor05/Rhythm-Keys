/**
 * TypingController.js // Typing & Accuracy Engine for Rhythm Keys
 * Handles keystrokes, character validation, combo streaks, real-time WPM, judgment callbacks, and practice mode.
 */

export class TypingController {
  /**
   * @param {Object} options
   * @param {Function} options.onTypo
   * @param {Function} options.onCorrect
   * @param {Function} options.onJudgment
   * @param {Function} options.onLineComplete
   * @param {Function} options.onStatsUpdate
   */
  constructor(options = {}) {
    this.onTypo = options.onTypo || (() => {});
    this.onCorrect = options.onCorrect || (() => {});
    this.onJudgment = options.onJudgment || (() => {});
    this.onLineComplete = options.onLineComplete || (() => {});
    this.onStatsUpdate = options.onStatsUpdate || (() => {});

    this.targetLine = '';
    this.typedBuffer = '';
    this.hasActiveTypo = false;
    this.isPracticeMode = false;

    // Performance & Judgment Metrics
    this.totalAttempts = 0;
    this.totalCorrect = 0;
    this.perfectHits = 0;
    this.greatHits = 0;
    this.missedHits = 0;
    this.currentStreak = 0;
    this.maxStreak = 0;
    this.score = 0;
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
    this.perfectHits = 0;
    this.greatHits = 0;
    this.missedHits = 0;
    this.currentStreak = 0;
    this.maxStreak = 0;
    this.score = 0;
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

      // Combo multiplier calculation
      const mult = this.getMultiplier();
      const points = 100 * mult;
      this.score += points;
      this.perfectHits++;

      this.checkErrorState();
      this.onCorrect(key);
      this.onJudgment({
        type: 'PERFECT',
        points: points,
        streak: this.currentStreak,
        multiplier: mult
      });
    } else {
      this.currentStreak = 0;
      this.hasActiveTypo = true;
      this.missedHits++;
      this.onTypo(key, expectedChar);
      this.onJudgment({
        type: 'MISS',
        points: 0,
        streak: 0,
        multiplier: 1
      });
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

  getMultiplier() {
    if (this.currentStreak >= 50) return 4;
    if (this.currentStreak >= 25) return 3;
    if (this.currentStreak >= 10) return 2;
    return 1;
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

    const mult = this.getMultiplier();

    return {
      wpm: Math.max(0, wpm),
      accuracy: Math.min(100, Math.max(0, accuracy)),
      combo: `x${mult}`,
      multiplier: mult,
      streak: this.currentStreak,
      maxStreak: this.maxStreak,
      score: this.score,
      perfectHits: this.perfectHits,
      missedHits: this.missedHits,
      hasTypo: this.hasActiveTypo,
      progress: this.targetLine.length > 0 ? (this.typedBuffer.length / this.targetLine.length) : 0
    };
  }

  emitStats() {
    this.onStatsUpdate(this.getStats());
  }
}
