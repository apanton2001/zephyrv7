/**
 * Spaced Repetition Service for LinguaBrowse
 * Implements SM-2 algorithm for optimized learning schedules
 */

class SpacedRepetitionService {
  constructor() {
    // Track learning progress for words
    this.learningData = {};
    
    // Configuration for the spaced repetition algorithm
    this.config = {
      // Base ease factor (difficulty multiplier) for new items
      defaultEaseFactor: 2.5,
      // Minimum ease factor to prevent items becoming too difficult
      minimumEaseFactor: 1.3,
      // How much to adjust ease factor based on performance
      easeFactorModifier: 0.15,
      // Default interval for first successful recall (in days)
      initialInterval: 1,
      // Maximum interval (in days)
      maximumInterval: 365,
      // Performance threshold to consider a review successful
      successThreshold: 0.6,
      // Maximum words to return in prioritization
      maxPrioritizedWords: 20
    };
  }
  
  /**
   * Process a review attempt and update spaced repetition data
   * @param {string} word - The word that was reviewed
   * @param {string} language - The language of the word
   * @param {number} performance - Score between 0 and 1 (0 = incorrect, 1 = perfect)
   * @returns {Object} Updated learning data for the word
   */
  processReview(word, language, performance) {
    // Normalize inputs
    const normalizedWord = word.toLowerCase();
    const normalizedLang = language.toLowerCase();
    const key = `${normalizedLang}:${normalizedWord}`;
    
    // Get or create learning data for this word
    const wordData = this.learningData[key] || {
      word: normalizedWord,
      language: normalizedLang,
      easeFactor: this.config.defaultEaseFactor,
      interval: 0, // Days until next review (0 means first time)
      reviewCount: 0,
      lastReview: new Date().toISOString(),
      nextReview: new Date().toISOString(), // Due immediately by default
      history: []
    };
    
    // Record this review in history
    wordData.history.push({
      date: new Date().toISOString(),
      performance: performance
    });
    
    // Update review count
    wordData.reviewCount++;
    
    // Calculate new interval based on SM-2 algorithm
    // (Simplified version of the SuperMemo SM-2 algorithm)
    
    // Determine if the review was successful
    const successful = performance >= this.config.successThreshold;
    
    // Calculate new ease factor
    // Performance 0-1 maps to -0.15 to +0.15 adjustment
    const easeAdjustment = (performance - 0.5) * 2 * this.config.easeFactorModifier;
    wordData.easeFactor = Math.max(
      this.config.minimumEaseFactor, 
      wordData.easeFactor + easeAdjustment
    );
    
    // Calculate new interval
    if (!successful) {
      // Failed review, reset interval but don't go all the way back to 0
      wordData.interval = Math.max(1, Math.floor(wordData.interval * 0.4));
    } else if (wordData.interval === 0) {
      // First successful review
      wordData.interval = this.config.initialInterval;
    } else if (wordData.interval === 1) {
      // Second successful review
      wordData.interval = 6; // Approximately 1 week
    } else {
      // Subsequent successful reviews
      wordData.interval = Math.min(
        this.config.maximumInterval,
        Math.round(wordData.interval * wordData.easeFactor)
      );
    }
    
    // Update last review time
    wordData.lastReview = new Date().toISOString();
    
    // Calculate next review date
    const nextReviewDate = new Date();
    nextReviewDate.setDate(nextReviewDate.getDate() + wordData.interval);
    wordData.nextReview = nextReviewDate.toISOString();
    
    // Update learning data
    this.learningData[key] = wordData;
    
    // Save learning data
    this.saveData();
    
    return {
      word: wordData.word,
      interval: wordData.interval,
      nextReview: wordData.nextReview,
      reviewCount: wordData.reviewCount
    };
  }
  
  /**
   * Get words that are due for review
   * @param {string} language - Language to filter by
   * @param {number} limit - Maximum number of words to return
   * @returns {Array} List of words due for review
   */
  getDueWords(language, limit = 10) {
    const normalizedLang = language.toLowerCase();
    const now = new Date().toISOString();
    
    // Find words in this language that are due for review
    const dueWords = Object.values(this.learningData)
      .filter(data => 
        data.language === normalizedLang &&
        data.nextReview <= now
      )
      .sort((a, b) => 
        // Sort by how overdue they are
        new Date(a.nextReview) - new Date(b.nextReview)
      )
      .slice(0, limit);
      
    return dueWords.map(data => data.word);
  }
  
  /**
   * Prioritize words for learning based on spaced repetition data
   * @param {Array} words - List of candidate words
   * @param {string} language - Language of the words
   * @param {number} count - Number of words to prioritize
   * @returns {Array} Prioritized list of words
   */
  prioritizeWords(words, language, count = 5) {
    const normalizedLang = language.toLowerCase();
    const now = new Date();
    
    // Create a copy to avoid modifying the original
    const wordList = [...words];
    
    // Score each word
    const scoredWords = wordList.map(word => {
      const normalizedWord = word.toLowerCase();
      const key = `${normalizedLang}:${normalizedWord}`;
      const wordData = this.learningData[key];
      
      if (!wordData) {
        // New word, high priority for initial learning
        return { word, score: 1.0 };
      }
      
      // Calculate how due this word is (negative means not due yet)
      const nextReviewDate = new Date(wordData.nextReview);
      const daysUntilDue = (nextReviewDate - now) / (1000 * 60 * 60 * 24);
      
      if (daysUntilDue <= 0) {
        // Overdue words get highest priority
        return { word, score: 1.0 + Math.abs(daysUntilDue) / 10 };
      }
      
      // Words due soon get medium priority
      if (daysUntilDue < 1) {
        return { word, score: 0.7 };
      }
      
      // Words with few reviews get higher priority than well-learned words
      const reviewFactor = Math.max(0, 5 - wordData.reviewCount) / 5;
      
      // Words with low ease factor (difficult words) get somewhat higher priority
      const easeFactor = (3.0 - wordData.easeFactor) / 3.0;
      
      // Combine factors - inverting days until due so sooner = higher score
      const score = (reviewFactor * 0.4) + (easeFactor * 0.3) + (1 / (daysUntilDue + 1)) * 0.3;
      
      return { word, score };
    });
    
    // Sort by score (highest first) and take the requested count
    return scoredWords
      .sort((a, b) => b.score - a.score)
      .slice(0, count)
      .map(item => item.word);
  }
  
  /**
   * Get learning statistics for a language
   * @param {string} language - Language to get stats for
   * @returns {Object} Statistics about learning progress
   */
  getStatistics(language) {
    const normalizedLang = language.toLowerCase();
    const words = Object.values(this.learningData)
      .filter(data => data.language === normalizedLang);
    
    if (words.length === 0) {
      return {
        totalWords: 0,
        averageEaseFactor: 0,
        wordsLearned: 0,
        wordsDue: 0
      };
    }
    
    const now = new Date().toISOString();
    const wordsDue = words.filter(data => data.nextReview <= now).length;
    const wordsLearned = words.filter(data => data.reviewCount >= 2).length;
    const totalEaseFactor = words.reduce((sum, data) => sum + data.easeFactor, 0);
    
    return {
      totalWords: words.length,
      averageEaseFactor: totalEaseFactor / words.length,
      wordsLearned,
      wordsDue
    };
  }
  
  /**
   * Save learning data to storage
   * In a real extension, this would save to Chrome storage
   * For this demo, we'll log to console
   */
  saveData() {
    // In a real extension, this would use chrome.storage.sync.set
    console.log('[Mock SRS] Saving learning data:', this.learningData);
    
    // For the demo, simulate saving to localStorage
    try {
      localStorage.setItem('linguabrowse-srs-data', JSON.stringify(this.learningData));
    } catch (e) {
      console.warn('Could not save SRS data to localStorage', e);
    }
  }
  
  /**
   * Load learning data from storage
   * In a real extension, this would load from Chrome storage
   * For this demo, we'll load from localStorage if available
   */
  loadData() {
    try {
      const savedData = localStorage.getItem('linguabrowse-srs-data');
      if (savedData) {
        this.learningData = JSON.parse(savedData);
        console.log('[Mock SRS] Loaded learning data:', this.learningData);
      }
    } catch (e) {
      console.warn('Could not load SRS data from localStorage', e);
    }
  }
  
  /**
   * Clear all learning data
   */
  clearData() {
    this.learningData = {};
    this.saveData();
  }
  
  /**
   * Update configuration settings
   * @param {Object} newConfig - New configuration settings
   */
  updateConfig(newConfig) {
    this.config = { ...this.config, ...newConfig };
  }
}

// Create singleton instance
const spacedRepetition = new SpacedRepetitionService();

// Try to load saved data
spacedRepetition.loadData();

// Make it globally available
window.spacedRepetition = spacedRepetition;
