/**
 * Google Translate Service for LinguaBrowse
 * Provides integration with Google Cloud Translation API v3beta1
 */

class GoogleTranslateService {
  constructor() {
    // Configuration
    this.config = {
      // Your Google Cloud Project ID - replace with your actual project ID
      projectId: 'your-google-cloud-project-id',
      // API key - in production, get this from secure storage
      apiKey: 'YOUR_API_KEY',
      // Base URL for Cloud Translation API v3beta1
      baseUrl: 'https://translation.googleapis.com/v3beta1',
      // Default source language
      defaultSourceLanguage: 'en', // English
      // Supported languages
      supportedLanguages: {
        'english': 'en',
        'spanish': 'es',
        'french': 'fr',
        'german': 'de',
        'mandarin': 'zh'
      },
      // Cache for translations to reduce API calls
      maxCacheSize: 500,
      // Usage limits
      dailyLimit: 500000, // Free tier: 500,000 characters per month
      charactersUsedToday: 0
    };
    
    // Cache for translations
    this.cache = {};
    
    // Last reset date for usage counting
    this.lastResetDate = new Date().toDateString();
  }
  
  /**
   * Translate text from one language to another
   * @param {string} text - The text to translate
   * @param {string} targetLang - The target language in human-readable form (e.g., 'spanish')
   * @param {string} sourceLang - The source language in human-readable form (e.g., 'english')
   * @returns {Promise<string>} - The translated text
   */
  async translateText(text, targetLang, sourceLang = 'english') {
    // Check cache first
    const cacheKey = `${sourceLang}:${targetLang}:${text}`;
    if (this.cache[cacheKey]) {
      console.log(`[Google Translate] Cache hit for "${text}"`);
      return this.cache[cacheKey];
    }
    
    // Normalize language codes
    const sourceCode = this.getLanguageCode(sourceLang);
    const targetCode = this.getLanguageCode(targetLang);
    
    // Skip if languages are the same
    if (sourceCode === targetCode) {
      return text;
    }
    
    // Check usage limits
    this.checkAndResetUsage();
    if (!this.checkUsageLimit(text.length)) {
      console.warn(`[Google Translate] Daily limit reached, skipping translation`);
      return text;
    }
    
    try {
      // In a real production environment, we would use the actual API
      // For development/demo purposes, we're using a simulated API response
      // In production, uncomment the actual API call and remove the setTimeout
      
      /* 
      // Real API call (commented out for development)
      const url = `${this.config.baseUrl}/projects/${this.config.projectId}:translateText`;
      
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.config.apiKey}`
        },
        body: JSON.stringify({
          sourceLanguageCode: sourceCode,
          targetLanguageCode: targetCode,
          contents: [text],
          mimeType: 'text/plain'
        })
      });
      
      if (!response.ok) {
        throw new Error(`Translation API error: ${response.status}`);
      }
      
      const data = await response.json();
      const translation = data.translations[0].translatedText;
      */
      
      // Simulated API response for development
      const translation = await this.simulateTranslation(text, sourceCode, targetCode);
      
      // Update usage count
      this.config.charactersUsedToday += text.length;
      
      // Cache the result
      this.addToCache(cacheKey, translation);
      
      return translation;
    } catch (error) {
      console.error(`[Google Translate] Translation error:`, error);
      // Fall back to the original text
      return text;
    }
  }
  
  /**
   * Get multiple translations for a word or phrase
   * @param {string} text - The text to translate
   * @param {string} targetLang - The target language
   * @param {string} sourceLang - The source language
   * @returns {Promise<string[]>} - Array of possible translations
   */
  async getAlternativeTranslations(text, targetLang, sourceLang = 'english') {
    // For MVP, we'll just return a single translation
    // In a full implementation, we would use additional API parameters
    // to get multiple translations
    const translation = await this.translateText(text, targetLang, sourceLang);
    return [translation];
  }
  
  /**
   * Convert language name to ISO code for API
   * @param {string} language - Language name
   * @returns {string} - ISO language code
   */
  getLanguageCode(language) {
    const normalizedLang = language.toLowerCase();
    return this.config.supportedLanguages[normalizedLang] || 'en';
  }
  
  /**
   * Add translation to cache
   * @param {string} key - Cache key
   * @param {string} translation - Translated text
   */
  addToCache(key, translation) {
    // Add to cache
    this.cache[key] = translation;
    
    // Prune cache if it's too large
    const keys = Object.keys(this.cache);
    if (keys.length > this.config.maxCacheSize) {
      // Remove oldest 20% of entries
      const removeCount = Math.ceil(this.config.maxCacheSize * 0.2);
      keys.slice(0, removeCount).forEach(k => delete this.cache[k]);
    }
  }
  
  /**
   * Check and reset usage counter if day changed
   */
  checkAndResetUsage() {
    const today = new Date().toDateString();
    if (today !== this.lastResetDate) {
      this.config.charactersUsedToday = 0;
      this.lastResetDate = today;
    }
  }
  
  /**
   * Check if we're within usage limits
   * @param {number} characterCount - Number of characters to translate
   * @returns {boolean} - True if within limits
   */
  checkUsageLimit(characterCount) {
    return (this.config.charactersUsedToday + characterCount) <= this.config.dailyLimit;
  }
  
  /**
   * Get usage statistics
   * @returns {Object} - Usage stats
   */
  getUsageStats() {
    return {
      charactersUsedToday: this.config.charactersUsedToday,
      dailyLimit: this.config.dailyLimit,
      percentUsed: (this.config.charactersUsedToday / this.config.dailyLimit) * 100
    };
  }
  
  /**
   * Update service configuration
   * @param {Object} newConfig - New configuration settings
   */
  updateConfig(newConfig) {
    this.config = { ...this.config, ...newConfig };
  }
  
  /**
   * Clear the translation cache
   */
  clearCache() {
    this.cache = {};
  }
  
  /**
   * Simulate translation for development (without API calls)
   * @param {string} text - Text to translate
   * @param {string} sourceCode - Source language code
   * @param {string} targetCode - Target language code
   * @returns {Promise<string>} - Simulated translation
   */
  async simulateTranslation(text, sourceCode, targetCode) {
    // Simple dictionary for common words in different languages
    // This is just for development/demo purposes
    const translations = {
      'en': {
        'es': {
          'hello': 'hola',
          'world': 'mundo',
          'language': 'idioma',
          'learn': 'aprender',
          'book': 'libro',
          'read': 'leer',
          'write': 'escribir',
          'understand': 'entender',
          'speak': 'hablar',
          'listen': 'escuchar',
          'friend': 'amigo',
          'family': 'familia',
          'house': 'casa',
          'food': 'comida',
          'water': 'agua',
          'time': 'tiempo',
          'day': 'día',
          'night': 'noche',
          'work': 'trabajo',
          'play': 'jugar',
          'computer': 'computadora',
          'phone': 'teléfono',
          'projects': 'proyectos'
        },
        'fr': {
          'hello': 'bonjour',
          'world': 'monde',
          'language': 'langue',
          'learn': 'apprendre',
          'book': 'livre',
          'read': 'lire',
          'write': 'écrire',
          'understand': 'comprendre',
          'speak': 'parler',
          'listen': 'écouter',
          'friend': 'ami',
          'family': 'famille',
          'house': 'maison',
          'food': 'nourriture',
          'water': 'eau',
          'time': 'temps',
          'day': 'jour',
          'night': 'nuit',
          'work': 'travail',
          'play': 'jouer',
          'computer': 'ordinateur',
          'phone': 'téléphone',
          'projects': 'projets'
        },
        'de': {
          'hello': 'hallo',
          'world': 'welt',
          'language': 'sprache',
          'learn': 'lernen',
          'book': 'buch',
          'read': 'lesen',
          'write': 'schreiben',
          'understand': 'verstehen',
          'speak': 'sprechen',
          'listen': 'hören',
          'friend': 'freund',
          'family': 'familie',
          'house': 'haus',
          'food': 'essen',
          'water': 'wasser',
          'time': 'zeit',
          'day': 'tag',
          'night': 'nacht',
          'work': 'arbeit',
          'play': 'spielen',
          'computer': 'computer',
          'phone': 'telefon',
          'projects': 'projekte'
        },
        'zh': {
          'hello': '你好',
          'world': '世界',
          'language': '语言',
          'learn': '学习',
          'book': '书',
          'read': '读',
          'write': '写',
          'understand': '理解',
          'speak': '说话',
          'listen': '听',
          'friend': '朋友',
          'family': '家庭',
          'house': '房子',
          'food': '食物',
          'water': '水',
          'time': '时间',
          'day': '日',
          'night': '夜',
          'work': '工作',
          'play': '玩',
          'computer': '电脑',
          'phone': '电话',
          'projects': '项目'
        }
      }
    };
    
    // Simulate network delay
    await new Promise(resolve => setTimeout(resolve, 100));
    
    // Get translation if available in our mock dictionary
    // Note: In a real implementation, this would be the API response
    if (translations[sourceCode]?.[targetCode]?.[text.toLowerCase()]) {
      return translations[sourceCode][targetCode][text.toLowerCase()];
    }
    
    // For words not in our dictionary, add a language-specific prefix
    // (This is just for simulation purposes)
    const prefixes = {
      'es': '[es] ',
      'fr': '[fr] ',
      'de': '[de] ',
      'zh': '[zh] '
    };
    
    return (prefixes[targetCode] || '') + text;
  }
}

// Create singleton instance
const googleTranslateService = new GoogleTranslateService();

// Export the service
export default googleTranslateService;
