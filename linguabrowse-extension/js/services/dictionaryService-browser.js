/**
 * Dictionary Service for LinguaBrowse
 * Provides translations and rich context for words
 */

class DictionaryService {
  constructor() {
    // Dictionary cache for quick lookups
    this.cache = {};
    
    // Configuration
    this.config = {
      // Default language pairs
      languagePairs: {
        english: ['spanish', 'french', 'german', 'mandarin'],
        spanish: ['english'],
        french: ['english'],
        german: ['english'],
        mandarin: ['english']
      },
      // Cache size limit
      maxCacheEntries: 500,
      // Use online dictionaries or local only
      useOnlineDictionaries: true,
      // Path to dictionaries
      dictionaryPath: 'data/dictionaries/'
    };
    
    // Dictionary data loaded from files
    this.dictionaries = {};
  }
  
  /**
   * Initialize service by preloading essential dictionaries
   * @returns {Promise<boolean>} True if initialized successfully
   */
  async initialize() {
    try {
      // For testing, preload Spanish dictionary
      await this.loadDictionary('spanish');
      return true;
    } catch (error) {
      console.error('Error initializing dictionary service:', error);
      return false;
    }
  }
  
  /**
   * Load a dictionary file for a specific language
   * @param {string} language - The language to load
   * @returns {Promise<Object>} The loaded dictionary data
   */
  async loadDictionary(language) {
    // Skip if already loaded
    if (this.dictionaries[language]) {
      return this.dictionaries[language];
    }
    
    try {
      // In a real extension, this would load from a JSON file
      // For the MVP, we'll simulate loading the Spanish dictionary
      if (language.toLowerCase() === 'spanish') {
        // Try to fetch the Spanish dictionary
        try {
          const response = await fetch(this.config.dictionaryPath + 'spanish.json');
          if (response.ok) {
            const data = await response.json();
            this.dictionaries[language] = data;
            return data;
          }
        } catch (e) {
          console.warn('Could not load Spanish dictionary from file, using mock data');
        }
        
        // Fallback to mock dictionary
        this.dictionaries[language] = this.getMockSpanishDictionary();
        return this.dictionaries[language];
      }
      
      // For other languages, create empty dictionaries
      this.dictionaries[language] = {};
      return this.dictionaries[language];
    } catch (error) {
      console.error(`Error loading ${language} dictionary:`, error);
      // Create an empty dictionary if loading fails
      this.dictionaries[language] = {};
      return this.dictionaries[language];
    }
  }
  
  /**
   * Get complete word data with translations, examples, etc.
   * @param {string} word - The word to look up
   * @param {string} language - The language of the word
   * @returns {Promise<Object>} Complete word data
   */
  async getWordData(word, language) {
    const normalizedWord = word.toLowerCase();
    const normalizedLang = language.toLowerCase();
    const cacheKey = `${normalizedLang}:${normalizedWord}`;
    
    // Check cache first
    if (this.cache[cacheKey]) {
      return this.cache[cacheKey];
    }
    
    // Ensure the dictionary is loaded
    await this.loadDictionary(normalizedLang);
    
    // Try to find in our dictionary
    const dictionary = this.dictionaries[normalizedLang] || {};
    let wordData = dictionary[normalizedWord];
    
    // If not found and online dictionaries are enabled, try API
    if (!wordData && this.config.useOnlineDictionaries) {
      try {
        wordData = await this.fetchFromExternalAPI(normalizedWord, normalizedLang);
      } catch (error) {
        console.warn(`Could not fetch ${normalizedWord} from API:`, error);
      }
    }
    
    // If still not found, create basic entry
    if (!wordData) {
      wordData = {
        word: normalizedWord,
        translations: [normalizedWord], // Default to same word
        partOfSpeech: 'unknown',
        difficulty: 'intermediate',
        examples: []
      };
    }
    
    // Cache the result
    this.cache[cacheKey] = wordData;
    this.pruneCache();
    
    return wordData;
  }
  
  /**
   * Get translations for a word
   * @param {string} word - The word to translate
   * @param {string} fromLanguage - Source language
   * @param {string} toLanguage - Target language
   * @returns {Promise<Array>} List of translations
   */
  async getTranslations(word, fromLanguage, toLanguage) {
    // Get complete word data first
    const wordData = await this.getWordData(word, fromLanguage);
    
    // Return the translations (or just the word itself if none available)
    return wordData.translations || [word];
  }
  
  /**
   * Fetch word data from an external API
   * @param {string} word - The word to look up
   * @param {string} language - The language of the word
   * @returns {Promise<Object>} Word data
   */
  async fetchFromExternalAPI(word, language) {
    // In a real extension, this would call a translation API
    // For MVP, we'll simulate a response after a small delay
    return new Promise(resolve => {
      setTimeout(() => {
        // Mock API response
        resolve({
          word: word,
          translations: [word], // Default translation is same word
          partOfSpeech: 'unknown',
          difficulty: 'intermediate',
          examples: []
        });
      }, 100);
    });
  }
  
  /**
   * Add a custom word or override an existing one
   * @param {string} word - The word to add
   * @param {string} language - The language of the word
   * @param {Object} data - Word data
   * @returns {Promise<boolean>} True if successful
   */
  async addCustomWord(word, language, data) {
    const normalizedWord = word.toLowerCase();
    const normalizedLang = language.toLowerCase();
    
    try {
      // Ensure the dictionary is loaded
      await this.loadDictionary(normalizedLang);
      
      // Add or update the word
      this.dictionaries[normalizedLang][normalizedWord] = {
        ...data,
        word: normalizedWord, // Ensure the word field matches
        isCustom: true
      };
      
      // Update cache
      const cacheKey = `${normalizedLang}:${normalizedWord}`;
      this.cache[cacheKey] = this.dictionaries[normalizedLang][normalizedWord];
      
      // In a real extension, save to storage
      console.log(`[Mock Dictionary] Added custom word: ${normalizedWord}`);
      
      return true;
    } catch (error) {
      console.error('Error adding custom word:', error);
      return false;
    }
  }
  
  /**
   * Prune the cache if it gets too large
   */
  pruneCache() {
    const cacheKeys = Object.keys(this.cache);
    if (cacheKeys.length > this.config.maxCacheEntries) {
      // Remove oldest entries (first 20% of entries)
      const removeCount = Math.ceil(this.config.maxCacheEntries * 0.2);
      cacheKeys.slice(0, removeCount).forEach(key => {
        delete this.cache[key];
      });
    }
  }
  
  /**
   * Update service configuration
   * @param {Object} newConfig - New configuration settings
   */
  updateConfig(newConfig) {
    this.config = { ...this.config, ...newConfig };
  }
  
  /**
   * Clear all dictionaries and cache
   */
  clearDictionaries() {
    this.dictionaries = {};
    this.cache = {};
  }
  
  /**
   * Create a mock Spanish dictionary for testing
   * @returns {Object} Mock dictionary data
   */
  getMockSpanishDictionary() {
    return {
      "casa": {
        "word": "casa",
        "translations": ["house", "home"],
        "partOfSpeech": "noun",
        "difficulty": "beginner",
        "examples": [
          {
            "original": "Mi casa está cerca del parque.",
            "translated": "My house is near the park."
          },
          {
            "original": "Me siento seguro en casa.",
            "translated": "I feel safe at home."
          }
        ]
      },
      "tiempo": {
        "word": "tiempo",
        "translations": ["time", "weather"],
        "partOfSpeech": "noun",
        "difficulty": "beginner",
        "examples": [
          {
            "original": "No tengo tiempo para ir al cine.",
            "translated": "I don't have time to go to the movies."
          },
          {
            "original": "El tiempo está muy bueno hoy.",
            "translated": "The weather is very nice today."
          }
        ]
      },
      "hombre": {
        "word": "hombre",
        "translations": ["man", "male"],
        "partOfSpeech": "noun",
        "difficulty": "beginner",
        "examples": [
          {
            "original": "El hombre está leyendo el periódico.",
            "translated": "The man is reading the newspaper."
          }
        ]
      },
      "mujer": {
        "word": "mujer",
        "translations": ["woman", "wife"],
        "partOfSpeech": "noun",
        "difficulty": "beginner",
        "examples": [
          {
            "original": "La mujer trabaja en una oficina.",
            "translated": "The woman works in an office."
          },
          {
            "original": "Mi mujer es doctora.",
            "translated": "My wife is a doctor."
          }
        ]
      },
      "día": {
        "word": "día",
        "translations": ["day"],
        "partOfSpeech": "noun",
        "difficulty": "beginner",
        "examples": [
          {
            "original": "Hoy es un día hermoso.",
            "translated": "Today is a beautiful day."
          }
        ]
      },
      "agua": {
        "word": "agua",
        "translations": ["water"],
        "partOfSpeech": "noun",
        "difficulty": "beginner",
        "examples": [
          {
            "original": "Necesito beber más agua.",
            "translated": "I need to drink more water."
          }
        ]
      },
      "comida": {
        "word": "comida",
        "translations": ["food", "meal"],
        "partOfSpeech": "noun",
        "difficulty": "beginner",
        "examples": [
          {
            "original": "La comida está lista.",
            "translated": "The food is ready."
          },
          {
            "original": "Vamos a preparar la comida.",
            "translated": "Let's prepare the meal."
          }
        ]
      },
      "hablar": {
        "word": "hablar",
        "translations": ["to speak", "to talk"],
        "partOfSpeech": "verb",
        "difficulty": "beginner",
        "examples": [
          {
            "original": "Yo puedo hablar español.",
            "translated": "I can speak Spanish."
          },
          {
            "original": "Me gusta hablar con mis amigos.",
            "translated": "I like talking with my friends."
          }
        ]
      },
      "comer": {
        "word": "comer",
        "translations": ["to eat"],
        "partOfSpeech": "verb",
        "difficulty": "beginner",
        "examples": [
          {
            "original": "Vamos a comer a las dos.",
            "translated": "We're going to eat at two o'clock."
          }
        ]
      },
      "beber": {
        "word": "beber",
        "translations": ["to drink"],
        "partOfSpeech": "verb",
        "difficulty": "beginner",
        "examples": [
          {
            "original": "Prefiero beber agua que refresco.",
            "translated": "I prefer to drink water rather than soda."
          }
        ]
      },
      "amigo": {
        "word": "amigo",
        "translations": ["friend"],
        "partOfSpeech": "noun",
        "difficulty": "beginner",
        "examples": [
          {
            "original": "Él es mi mejor amigo.",
            "translated": "He is my best friend."
          }
        ]
      },
      "familia": {
        "word": "familia",
        "translations": ["family"],
        "partOfSpeech": "noun",
        "difficulty": "beginner",
        "examples": [
          {
            "original": "Mi familia es muy importante para mí.",
            "translated": "My family is very important to me."
          }
        ]
      },
      "ciudad": {
        "word": "ciudad",
        "translations": ["city"],
        "partOfSpeech": "noun",
        "difficulty": "beginner",
        "examples": [
          {
            "original": "Vivo en una ciudad grande.",
            "translated": "I live in a big city."
          }
        ]
      },
      "país": {
        "word": "país",
        "translations": ["country"],
        "partOfSpeech": "noun",
        "difficulty": "beginner",
        "examples": [
          {
            "original": "España es un país bonito.",
            "translated": "Spain is a beautiful country."
          }
        ]
      },
      "escuela": {
        "word": "escuela",
        "translations": ["school"],
        "partOfSpeech": "noun",
        "difficulty": "beginner",
        "examples": [
          {
            "original": "Los niños van a la escuela.",
            "translated": "The children go to school."
          }
        ]
      },
      "universidad": {
        "word": "universidad",
        "translations": ["university"],
        "partOfSpeech": "noun",
        "difficulty": "beginner",
        "examples": [
          {
            "original": "Estudio en la universidad.",
            "translated": "I study at the university."
          }
        ]
      },
      "idioma": {
        "word": "idioma",
        "translations": ["language"],
        "partOfSpeech": "noun",
        "difficulty": "intermediate",
        "examples": [
          {
            "original": "El español es un idioma bonito.",
            "translated": "Spanish is a beautiful language."
          }
        ]
      },
      "aprender": {
        "word": "aprender",
        "translations": ["to learn"],
        "partOfSpeech": "verb",
        "difficulty": "beginner",
        "examples": [
          {
            "original": "Quiero aprender español.",
            "translated": "I want to learn Spanish."
          }
        ]
      },
      "enseñar": {
        "word": "enseñar",
        "translations": ["to teach", "to show"],
        "partOfSpeech": "verb",
        "difficulty": "intermediate",
        "examples": [
          {
            "original": "Me gusta enseñar idiomas.",
            "translated": "I like teaching languages."
          },
          {
            "original": "Voy a enseñarte mi colección.",
            "translated": "I'm going to show you my collection."
          }
        ]
      }
    };
  }
}

// Create singleton instance
const dictionaryService = new DictionaryService();

// Initialize it
dictionaryService.initialize();

// Make it globally available
window.dictionaryService = dictionaryService;
