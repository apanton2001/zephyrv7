/**
 * Audio Service for LinguaBrowse
 * Handles pronunciation of words in different languages
 */

class AudioService {
  constructor() {
    // Audio cache storage - maps language+word to audio data
    this.audioCache = {};
    // Track if audio is currently playing
    this.isPlaying = false;
    // Configuration settings
    this.config = {
      // Default voice settings for each language
      voices: {
        spanish: { lang: 'es-ES', gender: 'female' },
        french: { lang: 'fr-FR', gender: 'female' },
        german: { lang: 'de-DE', gender: 'female' },
        mandarin: { lang: 'zh-CN', gender: 'female' },
        english: { lang: 'en-US', gender: 'female' }
      },
      // Use free TTS API or fallback to browser's built-in TTS
      useExternalTTS: true,
      // Maximum cache size in entries
      maxCacheEntries: 100
    };
    
    // Initialize audio elements
    this.audioElement = new Audio();
    this.audioElement.addEventListener('ended', () => {
      this.isPlaying = false;
    });
  }
  
  /**
   * Play pronunciation of a word in a specific language
   * @param {string} word - The word to pronounce
   * @param {string} language - The language to use
   * @returns {Promise<boolean>} - True if played successfully
   */
  async pronounceWord(word, language) {
    try {
      // Don't overlap audio playback
      if (this.isPlaying) {
        this.audioElement.pause();
      }
      
      // Normalize the language name
      const normalizedLang = language.toLowerCase();
      
      // Check if we have the audio in cache
      const cacheKey = `${normalizedLang}:${word.toLowerCase()}`;
      if (this.audioCache[cacheKey]) {
        return this.playFromCache(cacheKey);
      }
      
      // Get audio URL
      const audioUrl = await this.getAudioUrl(word, normalizedLang);
      if (!audioUrl) {
        console.warn(`Could not get audio for "${word}" in ${language}`);
        return false;
      }
      
      // Play the audio
      this.audioElement.src = audioUrl;
      
      // Cache the audio URL for future use (except for data URLs which are already cached as data)
      if (!audioUrl.startsWith('data:')) {
        this.audioCache[cacheKey] = audioUrl;
        this.pruneCache();
      }
      
      this.isPlaying = true;
      await this.audioElement.play();
      return true;
    } catch (error) {
      console.error('Error pronouncing word:', error);
      return false;
    }
  }
  
  /**
   * Play audio from the cache
   * @param {string} cacheKey - The cache key
   * @returns {Promise<boolean>} - True if played successfully
   */
  async playFromCache(cacheKey) {
    try {
      const cachedAudio = this.audioCache[cacheKey];
      this.audioElement.src = cachedAudio;
      this.isPlaying = true;
      await this.audioElement.play();
      return true;
    } catch (error) {
      console.error('Error playing from cache:', error);
      return false;
    }
  }
  
  /**
   * Get audio URL for a word in a specific language
   * @param {string} word - The word to get audio for
   * @param {string} language - The language 
   * @returns {Promise<string|null>} - Audio URL or null if not available
   */
  async getAudioUrl(word, language) {
    // First try external TTS API if enabled
    if (this.config.useExternalTTS) {
      try {
        const url = await this.getExternalTTSUrl(word, language);
        if (url) return url;
      } catch (error) {
        console.warn('External TTS failed, falling back to browser TTS');
      }
    }
    
    // Fallback to browser's TTS
    return this.getBrowserTTSAudio(word, language);
  }
  
  /**
   * Get audio URL from external TTS API
   * @param {string} word - The word to get audio for
   * @param {string} language - The language
   * @returns {Promise<string|null>} - Audio URL or null if not available
   */
  async getExternalTTSUrl(word, language) {
    // For the MVP, we'll use a free TTS API
    // In a production extension, you would use a more reliable service
    
    // This uses VoiceRSS API (limited free tier) - you would need to sign up for an API key
    // For demo purposes, we'll return a mock URL
    
    // Map language to appropriate language code for the API
    const languageCode = this.config.voices[language]?.lang || 'en-us';
    
    // In a real implementation, you would make an API call here
    // For now, we'll just simulate returning a URL after a short delay
    return new Promise(resolve => {
      setTimeout(() => {
        // Simulate an API response with a dummy URL
        // In a real implementation, this would be a URL to an audio file
        const mockUrl = `https://api.example.com/tts?text=${encodeURIComponent(word)}&lang=${languageCode}`;
        resolve(mockUrl);
      }, 100);
    });
  }
  
  /**
   * Get audio from browser's TTS engine
   * @param {string} word - The word to get audio for
   * @param {string} language - The language
   * @returns {Promise<string|null>} - Data URL with audio or null if not available
   */
  async getBrowserTTSAudio(word, language) {
    // Check if Speech Synthesis API is available
    if (!('speechSynthesis' in window)) {
      console.warn('Browser TTS not available');
      return null;
    }
    
    // Get appropriate voice
    const langCode = this.config.voices[language]?.lang || 'en-US';
    const voices = window.speechSynthesis.getVoices();
    
    // Filter voices by language code
    const matchingVoices = voices.filter(voice => 
      voice.lang.toLowerCase().includes(langCode.toLowerCase())
    );
    
    // If no matching voice, try to find a voice with the language code prefix
    let selectedVoice = matchingVoices[0];
    if (!selectedVoice) {
      // Try to find a voice with just the language part (e.g., 'es' instead of 'es-ES')
      const langPrefix = langCode.split('-')[0].toLowerCase();
      selectedVoice = voices.find(voice => 
        voice.lang.toLowerCase().startsWith(langPrefix)
      );
    }
    
    // If still no voice, use the default voice
    if (!selectedVoice && voices.length > 0) {
      selectedVoice = voices[0];
    }
    
    // If no voices available at all, can't proceed
    if (!selectedVoice) {
      console.warn('No voices available for TTS');
      return null;
    }
    
    // Note: Unfortunately, we can't convert Speech Synthesis API output directly to a data URL
    // In a full implementation, we would need to use a more complex approach, like:
    // 1. Use the Web Audio API to capture the output
    // 2. Convert it to a data URL
    // For now, we'll return null and rely on directly playing the audio
    
    // For demonstration purposes only: we'll create a simple data URL with no actual audio
    return `data:audio/mp3;base64,MOCK_AUDIO_DATA_FOR_${language}_${word}`;
  }
  
  /**
   * Prune the audio cache if it gets too large
   */
  pruneCache() {
    const cacheKeys = Object.keys(this.audioCache);
    if (cacheKeys.length > this.config.maxCacheEntries) {
      // Remove the oldest entries (first 20% of entries)
      const removeCount = Math.ceil(this.config.maxCacheEntries * 0.2);
      cacheKeys.slice(0, removeCount).forEach(key => {
        delete this.audioCache[key];
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
   * Clear the audio cache
   */
  clearCache() {
    this.audioCache = {};
  }
  
  /**
   * Check if audio is available for a language
   * @param {string} language - The language to check
   * @returns {boolean} - True if audio is available
   */
  isLanguageSupported(language) {
    return language.toLowerCase() in this.config.voices;
  }
}

// Create singleton instance
const audioService = new AudioService();

// Make it globally available
window.audioService = audioService;
