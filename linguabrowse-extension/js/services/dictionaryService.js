/**
 * Dictionary Service for LinguaBrowse
 * Manages dictionaries, word lookup, and custom word management
 */

class DictionaryService {
  constructor() {
    // Cache for loaded dictionaries
    this.dictionaries = {};
    // User's custom dictionary entries
    this.customDictionary = {};
    // Configuration
    this.config = {
      // List of supported languages
      supportedLanguages: ['spanish', 'french', 'german', 'mandarin', 'english'],
      // Default source language (for translations)
      defaultSourceLanguage: 'english',
      // Fallback to API if word not found in local dictionary
      useExternalAPI: true,
      // Maximum number of API requests per minute (to avoid rate limiting)
      maxRequestsPerMinute: 20
    };
    // Track API usage
    this.apiRequestCount = 0;
    this.apiRequestReset = Date.now() + 60000; // Reset after 1 minute
  }
  
  /**
   * Initialize the dictionary service
   * @param {Object} customDictionary - User's custom dictionary
   */
  async initialize(customDictionary = {}) {
    this.customDictionary = customDictionary;
    
    // Preload the most commonly used dictionaries
    try {
      await this.loadDictionary('spanish');
    } catch (error) {
      console.warn('Failed to preload Spanish dictionary:', error);
    }
  }
  
  /**
   * Load a dictionary for a specific language
   * @param {string} language - The language to load
   * @returns {Promise<Object>} - The loaded dictionary
   */
  async loadDictionary(language) {
    // Normalize language name
    const normalizedLang = language.toLowerCase();
    
    // Check if already loaded
    if (this.dictionaries[normalizedLang]) {
      return this.dictionaries[normalizedLang];
    }
    
    try {
      // Load dictionary from local file
      const response = await fetch(`/data/dictionaries/${normalizedLang}.json`);
      if (!response.ok) {
        throw new Error(`Failed to load ${language} dictionary: ${response.statusText}`);
      }
      
      const dictionary = await response.json();
      this.dictionaries[normalizedLang] = dictionary;
      return dictionary;
    } catch (error) {
      console.error(`Error loading dictionary for ${language}:`, error);
      // Create an empty dictionary as fallback
      this.dictionaries[normalizedLang] = {};
      return this.dictionaries[normalizedLang];
    }
  }
  
  /**
   * Get a word's data from the dictionary
   * @param {string} word - The word to look up
   * @param {string} language - The target language
   * @param {string} [sourceLanguage] - The source language (defaults to English)
   * @returns {Promise<Object|null>} - Word data or null if not found
   */
  async getWordData(word, language, sourceLanguage = this.config.defaultSourceLanguage) {
    // Normalize word and languages
    const normalizedWord = word.toLowerCase().trim();
    const normalizedLang = language.toLowerCase();
    const normalizedSource = sourceLanguage.toLowerCase();
    
    // Check if language is supported
    if (!this.isLanguageSupported(normalizedLang)) {
      console.warn(`Language ${language} is not supported`);
      return null;
    }
    
    // Try to get from custom dictionary first
    const customEntry = this.getCustomWordData(normalizedWord, normalizedLang, normalizedSource);
    if (customEntry) {
      return customEntry;
    }
    
    // Make sure the dictionary is loaded
    await this.loadDictionary(normalizedLang);
    
    // Look up in the loaded dictionary
    const dictionary = this.dictionaries[normalizedLang] || {};
    const entry = dictionary[normalizedWord];
    
    if (entry) {
      return entry;
    }
    
    // If not found locally and external API is enabled, try that
    if (this.config.useExternalAPI) {
      return this.lookupWordFromAPI(normalizedWord, normalizedLang, normalizedSource);
    }
    
    return null;
  }
  
  /**
   * Get a word's data from the user's custom dictionary
   * @param {string} word - The word to look up
   * @param {string} language - The target language
   * @param {string} sourceLanguage - The source language
   * @returns {Object|null} - Word data or null if not found
   */
  getCustomWordData(word, language, sourceLanguage) {
    const customLangDict = this.customDictionary[language] || {};
    return customLangDict[word] || null;
  }
  
  /**
   * Look up a word from an external API
   * @param {string} word - The word to look up
   * @param {string} language - The target language
   * @param {string} sourceLanguage - The source language
   * @returns {Promise<Object|null>} - Word data or null if not found
   */
  async lookupWordFromAPI(word, language, sourceLanguage) {
    // Check API rate limiting
    if (!this.checkApiRateLimit()) {
      console.warn('API rate limit reached, skipping external lookup');
      return null;
    }
    
    // In a real implementation, this would call a dictionary API
    // For now, we'll create a basic mock entry
    this.incrementApiCounter();
    
    // Simulate API call delay
    await new Promise(resolve => setTimeout(resolve, 100));
    
    // Create a simple mock entry
    return {
      translations: [word],  // Mock translation
      partOfSpeech: 'unknown',
      difficulty: 'unknown',
      examples: [],
      topics: [],
      source: 'api'
    };
  }
  
  /**
   * Get translations for a word
   * @param {string} word - The word to translate
   * @param {string} fromLanguage - The source language
   * @param {string} toLanguage - The target language
   * @returns {Promise<string[]>} - Array of translations
   */
  async getTranslations(word, fromLanguage, toLanguage) {
    const wordData = await this.getWordData(word, toLanguage, fromLanguage);
    
    if (wordData?.translations?.length) {
      return wordData.translations;
    }
    
    // If we have no translations, return the word itself
    return [word];
  }
  
  /**
   * Add a custom word to the user's dictionary
   * @param {string} word - The word to add
   * @param {string} language - The language of the word
   * @param {Object} wordData - Word data (translations, examples, etc.)
   * @returns {Object} - The added word data
   */
  addCustomWord(word, language, wordData) {
    // Normalize word and language
    const normalizedWord = word.toLowerCase().trim();
    const normalizedLang = language.toLowerCase();
    
    // Create language dictionary if it doesn't exist
    if (!this.customDictionary[normalizedLang]) {
      this.customDictionary[normalizedLang] = {};
    }
    
    // Add or update the word
    this.customDictionary[normalizedLang][normalizedWord] = {
      ...wordData,
      isCustom: true,
      dateAdded: Date.now()
    };
    
    return this.customDictionary[normalizedLang][normalizedWord];
  }
  
  /**
   * Get a list of all words in a dictionary
   * @param {string} language - The language to get words for
   * @returns {Promise<string[]>} - Array of words
   */
  async getAllWords(language) {
    // Normalize language
    const normalizedLang = language.toLowerCase();
    
    // Make sure the dictionary is loaded
    await this.loadDictionary(normalizedLang);
    
    // Get words from both builtin and custom dictionaries
    const builtinWords = Object.keys(this.dictionaries[normalizedLang] || {});
    const customWords = Object.keys(this.customDictionary[normalizedLang] || {});
    
    // Combine and remove duplicates
    return [...new Set([...builtinWords, ...customWords])];
  }
  
  /**
   * Filter words by difficulty level
   * @param {string} language - The language to filter
   * @param {string} level - The difficulty level ('beginner', 'intermediate', 'advanced')
   * @returns {Promise<string[]>} - Array of words matching the difficulty
   */
  async getWordsByDifficulty(language, level) {
    // Normalize language and level
    const normalizedLang = language.toLowerCase();
    const normalizedLevel = level.toLowerCase();
    
    // Make sure the dictionary is loaded
    await this.loadDictionary(normalizedLang);
    
    // Get all words
    const words = await this.getAllWords(normalizedLang);
    
    // Filter by difficulty
    const result = [];
    
    for (const word of words) {
      const wordData = await this.getWordData(word, normalizedLang);
      if (wordData?.difficulty === normalizedLevel) {
        result.push(word);
      }
    }
    
    return result;
  }
  
  /**
   * Get words by a specific topic
   * @param {string} language - The language to filter
   * @param {string} topic - The topic to filter by
   * @returns {Promise<string[]>} - Array of words related to the topic
   */
  async getWordsByTopic(language, topic) {
    // Normalize language and topic
    const normalizedLang = language.toLowerCase();
    const normalizedTopic = topic.toLowerCase();
    
    // Make sure the dictionary is loaded
    await this.loadDictionary(normalizedLang);
    
    // Get all words
    const words = await this.getAllWords(normalizedLang);
    
    // Filter by topic
    const result = [];
    
    for (const word of words) {
      const wordData = await this.getWordData(word, normalizedLang);
      if (wordData?.topics?.includes(normalizedTopic)) {
        result.push(word);
      }
    }
    
    return result;
  }
  
  /**
   * Check if a language is supported
   * @param {string} language - The language to check
   * @returns {boolean} - True if the language is supported
   */
  isLanguageSupported(language) {
    return this.config.supportedLanguages.includes(language.toLowerCase());
  }
  
  /**
   * Get statistics about a dictionary
   * @param {string} language - The language to get stats for
   * @returns {Promise<Object>} - Dictionary statistics
   */
  async getDictionaryStats(language) {
    // Normalize language
    const normalizedLang = language.toLowerCase();
    
    // Make sure the dictionary is loaded
    await this.loadDictionary(normalizedLang);
    
    // Get all words
    const builtinWords = Object.keys(this.dictionaries[normalizedLang] || {});
    const customWords = Object.keys(this.customDictionary[normalizedLang] || {});
    
    // Count by difficulty
    const builtinByDifficulty = {
      beginner: 0,
      intermediate: 0,
      advanced: 0,
      unknown: 0
    };
    
    for (const word of builtinWords) {
      const entry = this.dictionaries[normalizedLang][word];
      const difficulty = entry?.difficulty || 'unknown';
      builtinByDifficulty[difficulty]++;
    }
    
    return {
      totalWords: builtinWords.length + customWords.length,
      builtinWords: builtinWords.length,
      customWords: customWords.length,
      builtinByDifficulty
    };
  }
  
  /**
   * Check API rate limiting
   * @returns {boolean} - True if API request is allowed
   */
  checkApiRateLimit() {
    const now = Date.now();
    
    // Reset counter if the minute has passed
    if (now > this.apiRequestReset) {
      this.apiRequestCount = 0;
      this.apiRequestReset = now + 60000; // Reset after 1 minute
    }
    
    // Check if within rate limit
    return this.apiRequestCount < this.config.maxRequestsPerMinute;
  }
  
  /**
   * Increment API request counter
   */
  incrementApiCounter() {
    this.apiRequestCount++;
  }
  
  /**
   * Export custom dictionary for storage
   * @returns {Object} - Custom dictionary object
   */
  exportCustomDictionary() {
    return this.customDictionary;
  }
  
  /**
   * Update service configuration
   * @param {Object} newConfig - New configuration settings
   */
  updateConfig(newConfig) {
    this.config = { ...this.config, ...newConfig };
  }
}

// Create singleton instance
const dictionaryService = new DictionaryService();

// Export the service
export default dictionaryService;
