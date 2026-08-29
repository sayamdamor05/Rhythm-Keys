/**
 * LrcParser.js // Synchronized Lyric Parser for Rhythm Keys
 * Parses standard .LRC format files with [mm:ss.xx] or [mm:ss.xxx] timestamps
 */

export class LrcParser {
  /**
   * Parses an LRC formatted string into an array of timed lyric objects
   * @param {string} lrcString 
   * @returns {Array<{ time: number, text: string, rawTime: string }>}
   */
  static parse(lrcString) {
    if (!lrcString || typeof lrcString !== 'string') {
      return [];
    }

    const lines = lrcString.split(/\r?\n/);
    const timeTagRegex = /\[(\d{2}):(\d{2})(?:\.(\d{2,3}))?\]/g;
    const lyricEntries = [];

    for (const rawLine of lines) {
      const trimmedLine = rawLine.trim();
      if (!trimmedLine) continue;

      // Extract all timestamp tags in the line (handles multi-tag lines like [01:10.00][02:20.00] Repeat text)
      let match;
      const timestamps = [];
      timeTagRegex.lastIndex = 0;

      while ((match = timeTagRegex.exec(trimmedLine)) !== null) {
        const minutes = parseInt(match[1], 10);
        const seconds = parseInt(match[2], 10);
        const milliseconds = match[3] 
          ? parseInt(match[3].padEnd(3, '0').slice(0, 3), 10) 
          : 0;
        
        const totalSeconds = (minutes * 60) + seconds + (milliseconds / 1000);
        timestamps.push({
          time: totalSeconds,
          rawTime: match[0]
        });
      }

      // Extract remaining text without timestamps
      const lyricText = trimmedLine.replace(timeTagRegex, '').trim();

      // Only add if there was at least one timestamp tag
      for (const ts of timestamps) {
        lyricEntries.push({
          time: ts.time,
          text: lyricText,
          rawTime: ts.rawTime
        });
      }
    }

    // Sort chronologically by time
    lyricEntries.sort((a, b) => a.time - b.time);
    return lyricEntries;
  }

  /**
   * Finds the active lyric line index for a given audio timestamp (in seconds)
   * @param {Array<{ time: number, text: string }>} lyrics 
   * @param {number} currentTimeSeconds 
   * @returns {number} index of the active lyric line, or -1 if before first line
   */
  static getActiveIndex(lyrics, currentTimeSeconds) {
    if (!lyrics || lyrics.length === 0) return -1;
    if (currentTimeSeconds < lyrics[0].time) return 0;

    let activeIdx = 0;
    for (let i = 0; i < lyrics.length; i++) {
      if (currentTimeSeconds >= lyrics[i].time) {
        activeIdx = i;
      } else {
        break;
      }
    }
    return activeIdx;
  }
}
