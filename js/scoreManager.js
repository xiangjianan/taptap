import platform from './platform';

const STORAGE_KEY = 'scoreHistory';
const MAX_SCORES_PER_LEVEL = 10;

export default class ScoreManager {
  constructor() {
    this.scores = { 1: [], 2: [] };
    this.onHighScore = null;
    this.loadScores();
  }

  init() {
    this.loadScores();
  }

  /**
   * Record a game score and check for new high score.
   * @param {number} level - 1 or 2
   * @param {number} numbersFound - count of correctly tapped numbers
   * @param {number} timeSpent - seconds taken
   * @returns {{ isNewHighScore: boolean, previousBest: object|null, currentBest: object|null, rank: number }}
   */
  recordScore(level, numbersFound, timeSpent) {
    if (level !== 1 && level !== 2) {
      return { isNewHighScore: false, previousBest: null, currentBest: null, rank: -1 };
    }

    const entry = {
      score: numbersFound,
      timeSpent: Math.round(timeSpent * 100) / 100,
      timestamp: Date.now()
    };

    const previousBest = this.getHighScore(level);
    const previousBestCopy = previousBest ? { ...previousBest } : null;

    const scores = this.scores[level] || [];
    scores.push(entry);
    scores.sort(ScoreManager.compareScores);
    this.scores[level] = scores.slice(0, MAX_SCORES_PER_LEVEL);

    const currentBest = this.getHighScore(level);
    const isNewHighScore = ScoreManager.isBetterScore(entry, previousBestCopy);

    const rank = this.getRank(level, entry);

    this.saveScores();

    const isFirstScore = previousBestCopy === null;

    if (isNewHighScore && !isFirstScore && this.onHighScore) {
      this.onHighScore(level, entry, previousBestCopy);
    }

    return { isNewHighScore, previousBest: previousBestCopy, currentBest, rank };
  }

  /**
   * Compare two scores: higher score wins; tie broken by shorter timeSpent.
   * Returns negative if a is better, positive if b is better, 0 if equal.
   */
  static compareScores(a, b) {
    const scoreA = a.score !== undefined ? a.score : a.numbersFound;
    const scoreB = b.score !== undefined ? b.score : b.numbersFound;
    if (scoreA !== scoreB) {
      return scoreB - scoreA;
    }
    return a.timeSpent - b.timeSpent;
  }

  static isBetterScore(a, b) {
    if (!b) return true;
    if (!a) return false;
    return ScoreManager.compareScores(a, b) < 0;
  }

  getHighScore(level) {
    const scores = this.scores[level];
    if (!scores || scores.length === 0) return null;
    return { ...scores[0] };
  }

  getTopScores(level) {
    const scores = this.scores[level];
    if (!scores) return [];
    return scores.map(s => ({ ...s }));
  }

  getRank(level, entry) {
    const scores = this.scores[level];
    if (!scores) return -1;
    for (let i = 0; i < scores.length; i++) {
      if (scores[i].timestamp === entry.timestamp &&
          scores[i].timeSpent === entry.timeSpent) {
        return i + 1;
      }
    }
    return -1;
  }

  saveScores() {
    try {
      platform.setStorageSync(STORAGE_KEY, JSON.stringify(this.scores));
    } catch (e) {
      // silent
    }
  }

  loadScores() {
    try {
      const saved = platform.getStorageSync(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        this.scores = {
          1: Array.isArray(parsed[1]) ? parsed[1] : [],
          2: Array.isArray(parsed[2]) ? parsed[2] : []
        };
        return;
      }
    } catch (e) {
      // silent
    }
    this.scores = { 1: [], 2: [] };
  }

  reset() {
    this.scores = { 1: [], 2: [] };
    this.saveScores();
  }
}
