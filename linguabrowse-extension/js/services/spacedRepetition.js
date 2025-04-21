/**
 * Spaced Repetition Service for LinguaBrowse
 * Implements a simplified SM-2 algorithm for optimal learning intervals
 */

class SpacedRepetitionService {
  constructor() {
    // Configuration for the spaced repetition algorithm
    this.config = {
      // Minimum interval in days
      minInterval: 1,
      // Maximum interval in days (about 6 months)
      maxInterval: 180,
      // Initial ease factor (higher = easier to remember)
      initialEase: 2.5,
      // Minimum ease factor
      minEase: 1.3,
      // Default response quality thresholds
      defaultThreshold: 3, // 0-5 scale, 3 or higher considered successful recall
      // Maximum words to return for review in one session
      maxReviewBatchSize: 20
    };
  }
  
  /**
   * Initialize user's learning data from storage
   * @param {Object} learningData - User's learning data from storage
   */
  initialize(learningData = {}) {
    this.learningData = learningData;
  }
  
  /**
   * Get words that are due for review
   * @param {string} language - The language to get due words for
   * @param {number} [limit] - Maximum number of words to return
   * @returns {Array} - Array of words due for review
   */
  getDueWords(language, limit = this.config.maxReviewBatchSize) {
    const now = Date.now();
    const languageData = this.learningData[language] || {};
    
    // Filter words that are due
    const dueWords = Object.entries(languageData)
      .filter(([word, data]) => {
        // Word is due if:
        // 1. It has a next review date and that date is in the past
        // 2. OR it has been seen but doesn't have a next review date yet
        return (data.nextReview && data.nextReview <= now) || 
               (data.firstSeen && !data.nextReview);
      })
      .map(([word, data]) => ({
        word,
        ...data,
        // Calculate overdue factor (1.0 = just due, >1.0 = overdue)
        overdueFactor: data.nextReview
          ? Math.max(1, (now - data.nextReview) / (1000 * 60 * 60 * 24) + 1)
          : 1
      }))
      // Sort by overdue factor (most overdue first)
      .sort((a, b) => b.overdueFactor - a.overdueFactor)
      // Limit to requested number of words
      .slice(0, limit)
      // Map to return format
      .map(item => item.word);
      
    return dueWords;
  }
  
  /**
   * Get new words that haven't been seen yet
   * @param {Array} allWords - All available words
   * @param {string} language - The language
   * @param {number} [limit] - Maximum number of words to return
   * @returns {Array} - Array of new words
   */
  getNewWords(allWords, language, limit = this.config.maxReviewBatchSize) {
    const languageData = this.learningData[language] || {};
    
    // Filter words that haven't been seen yet
    const newWords = allWords.filter(word => !languageData[word])
      // Shuffle to get random selection
      .sort(() => Math.random() - 0.5)
      // Limit to requested number of words
      .slice(0, limit);
      
    return newWords;
  }
  
  /**
   * Process a review of a word
   * @param {string} word - The word that was reviewed
   * @param {string} language - The language of the word
   * @param {number} performance - Performance rating (0-5)
   * @returns {Object} - Updated word data
   */
  processReview(word, language, performance) {
    // Initialize language data if it doesn't exist
    if (!this.learningData[language]) {
      this.learningData[language] = {};
    }
    
    // Get current word data or create new entry
    const wordData = this.learningData[language][word] || {
      word,
      firstSeen: Date.now(),
      timesReviewed: 0,
      timesCorrect: 0,
      currentInterval: 0,
      easeFactor: this.config.initialEase,
      lastReviewed: null,
      nextReview: null
    };
    
    // Update general stats
    wordData.timesReviewed++;
    if (performance >= this.config.defaultThreshold) {
      wordData.timesCorrect++;
    }
    wordData.lastReviewed = Date.now();
    
    // Calculate new interval and next review date
    const { interval, easeFactor } = this.calculateNextInterval(
      wordData.currentInterval,
      wordData.easeFactor,
      performance
    );
    
    // Update word data
    wordData.currentInterval = interval;
    wordData.easeFactor = easeFactor;
    wordData.nextReview = Date.now() + (interval * 24 * 60 * 60 * 1000);
    wordData.lastPerformance = performance;
    
    // Add review to history
    if (!wordData.reviewHistory) {
      wordData.reviewHistory = [];
    }
    wordData.reviewHistory.push({
      date: Date.now(),
      performance,
      newInterval: interval
    });
    
    // Trim history if it gets too long
    if (wordData.reviewHistory.length > 50) {
      wordData.reviewHistory = wordData.reviewHistory.slice(-50);
    }
    
    // Update word data in learning data
    this.learningData[language][word] = wordData;
    
    return wordData;
  }
  
  /**
   * Calculate next interval using SM-2 algorithm
   * @param {number} currentInterval - Current interval in days
   * @param {number} currentEase - Current ease factor
   * @param {number} performance - Performance rating (0-5)
   * @returns {Object} - New interval and ease factor
   */
  calculateNextInterval(currentInterval, currentEase, performance) {
    // Normalized performance to 0-1 range
    const normalizedPerformance = performance / 5;
    
    // Calculate new ease factor
    // Performance affects ease: higher performance = higher ease
    let newEase = currentEase + (0.1 - (5 - performance) * 0.08);
    
    // Keep ease factor within bounds
    newEase = Math.max(this.config.minEase, Math.min(newEase, 2.5));
    
    // Calculate new interval
    let newInterval;
    
    if (performance < this.config.defaultThreshold) {
      // If performance is below threshold, reset interval
      // But don't go all the way back to 1 for slight misses
      if (performance >= 2) {
        // Partial reset for near misses
        newInterval = Math.max(
          this.config.minInterval,
          Math.ceil(currentInterval * 0.5)
        );
      } else {
        // Complete reset for poor performance
        newInterval = this.config.minInterval;
      }
    } else {
      // If performance is good, increase interval according to SM-2
      if (currentInterval === 0) {
        // First successful review
        newInterval = 1;
      } else if (currentInterval === 1) {
        // Second successful review
        newInterval = 6;
      } else {
        // All subsequent reviews
        newInterval = Math.round(currentInterval * newEase);
      }
    }
    
    // Keep interval within bounds
    newInterval = Math.max(this.config.minInterval, 
                       Math.min(newInterval, this.config.maxInterval));
    
    return { interval: newInterval, easeFactor: newEase };
  }
  
  /**
   * Get stats about the user's learning progress
   * @param {string} language - The language to get stats for
   * @returns {Object} - Statistics about learning progress
   */
  getStats(language) {
    const languageData = this.learningData[language] || {};
    const words = Object.values(languageData);
    
    // If no words, return empty stats
    if (words.length === 0) {
      return {
        totalWords: 0,
        wordsLearned: 0,
        wordsInProgress: 0,
        wordsToReview: 0,
        averageEase: 0,
        streakDays: 0
      };
    }
    
    // Count words by status
    const now = Date.now();
    const wordsLearned = words.filter(w => 
      w.timesCorrect >= 3 && w.easeFactor > 2.0
    ).length;
    
    const wordsInProgress = words.filter(w => 
      w.timesCorrect > 0 && w.timesCorrect < 3
    ).length;
    
    const wordsToReview = words.filter(w => 
      w.nextReview && w.nextReview <= now
    ).length;
    
    // Calculate average ease
    const totalEase = words.reduce((sum, w) => sum + (w.easeFactor || 0), 0);
    const averageEase = totalEase / words.length;
    
    // Calculate learning streak
    // In a full implementation, this would check for consecutive days of activity
    // For now, we'll just return a placeholder value
    const streakDays = 0;
    
    return {
      totalWords: words.length,
      wordsLearned,
      wordsInProgress,
      wordsToReview,
      averageEase,
      streakDays
    };
  }
  
  /**
   * Prioritize words for quiz selection
   * @param {Array} words - Array of candidate words
   * @param {string} language - The language
   * @param {number} count - Number of words to return
   * @returns {Array} - Prioritized array of words
   */
  prioritizeWords(words, language, count = 5) {
    const languageData = this.learningData[language] || {};
    const now = Date.now();
    
    // Calculate priority score for each word
    const scoredWords = words.map(word => {
      const data = languageData[word] || {};
      let score = 0;
      
      // Higher score = higher priority
      
      // Due words get highest priority
      if (data.nextReview && data.nextReview <= now) {
        // Overdue words get extra priority based on how overdue they are
        const daysSinceReview = (now - data.nextReview) / (1000 * 60 * 60 * 24);
        score += 1000 + Math.min(daysSinceReview * 10, 500);
      }
      
      // Words that have been seen but are struggling get high priority
      else if (data.timesReviewed && data.timesCorrect / data.timesReviewed < 0.7) {
        score += 800;
      }
      
      // Words that are almost learned (seen 2+ times successfully) get medium priority
      else if (data.timesCorrect >= 2) {
        score += 500;
      }
      
      // Words that have been seen at least once get lower priority
      else if (data.timesReviewed) {
        score += 200;
      }
      
      // New words get lowest priority
      else {
        score += 100;
      }
      
      // Add some randomness to avoid showing the same words all the time
      score += Math.random() * 50;
      
      return { word, score };
    });
    
    // Sort by score (highest first) and take requested count
    return scoredWords
      .sort((a, b) => b.score - a.score)
      .slice(0, count)
      .map(item => item.word);
  }
  
  /**
   * Update service configuration
   * @param {Object} newConfig - New configuration settings
   */
  updateConfig(newConfig) {
    this.config = { ...this.config, ...newConfig };
  }
  
  /**
   * Export learning data for storage
   * @returns {Object} - Learning data object
   */
  exportLearningData() {
    return this.learningData;
  }
  
  /**
   * Reset all learning data for a language
   * @param {string} language - The language to reset
   */
  resetLanguageData(language) {
    if (this.learningData[language]) {
      this.learningData[language] = {};
    }
  }
}

// Create singleton instance
const spacedRepetition = new SpacedRepetitionService();

// Export the service
export default spacedRepetition;
