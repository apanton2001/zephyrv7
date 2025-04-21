// LinguaBrowse - Content Script
// This script is injected into web pages and handles the quiz overlay and text analysis

// Import services (note: in a Chrome extension, imports need special handling in manifest.json)
// For this MVP implementation, we'll assume these are loaded via script tags in the manifest
// In production, you would use a proper build system with import/export
// const audioService = chrome.extension.getBackgroundPage().audioService;
// const spacedRepetition = chrome.extension.getBackgroundPage().spacedRepetition;
// const dictionaryService = chrome.extension.getBackgroundPage().dictionaryService;

// For now, we'll create mock implementations to demonstrate integration
const mockServices = {
  audioService: {
    pronounceWord: (word, language) => {
      console.log(`[Mock Audio] Playing pronunciation for '${word}' in ${language}`);
      return Promise.resolve(true);
    },
    isLanguageSupported: (language) => {
      return ['spanish', 'french', 'german', 'mandarin', 'english'].includes(language.toLowerCase());
    }
  },
  
  spacedRepetition: {
    processReview: (word, language, performance) => {
      console.log(`[Mock SRS] Processing review for '${word}' with performance ${performance}`);
      return { interval: 1 + Math.floor(performance) };
    },
    prioritizeWords: (words, language, count) => {
      console.log(`[Mock SRS] Prioritizing ${count} words from ${words.length} candidates`);
      // Simulate prioritization by taking random selection
      return words.sort(() => 0.5 - Math.random()).slice(0, count);
    },
    getDueWords: (language, limit) => {
      console.log(`[Mock SRS] Getting ${limit} due words for ${language}`);
      return []; // In a real implementation, this would return words due for review
    }
  },
  
  dictionaryService: {
    getWordData: (word, language) => {
      console.log(`[Mock Dictionary] Looking up '${word}' in ${language}`);
      // Simulate dictionary response
      return Promise.resolve({
        translations: [word], // Mock translation
        partOfSpeech: "unknown",
        difficulty: "beginner",
        examples: []
      });
    },
    getTranslations: (word, fromLanguage, toLanguage) => {
      console.log(`[Mock Dictionary] Translating '${word}' from ${fromLanguage} to ${toLanguage}`);
      return Promise.resolve([word]); // Mock translation
    }
  }
};

// Use our mock services
const audioService = mockServices.audioService;
const spacedRepetition = mockServices.spacedRepetition;
const dictionaryService = mockServices.dictionaryService;

// Global state
const state = {
  settings: null,           // User settings from storage
  stats: null,              // User statistics from storage 
  quizState: null,          // Quiz sequence state from storage
  pageLanguage: null,       // Detected language of the current page
  quizScheduled: false,     // Flag to prevent multiple quiz scheduling
  quizActive: false,        // Whether a quiz is currently displayed
  dailyQuizLimitReached: false, // Flag for free tier users
  paragraphsAnalyzed: [],   // Keep track of analyzed text to prevent repeats
  quizCount: 0,             // Number of quizzes shown on this page
  pageText: [],             // Collection of text segments from the page
  quizQueue: [],            // Queue of prepared quiz items for this page
  currentSequence: [],      // Current 5-question sequence
  currentQuestionIndex: 0,  // Current position in sequence
  sequenceActive: false,    // Whether a sequence is in progress
  sequenceCorrectAnswers: 0 // Number of correct answers in current sequence
};

// Initialize when the content script is injected
init();

async function init() {
  // Request user data from background script
  chrome.runtime.sendMessage(
    { type: 'getUserData' },
    (response) => {
      if (response) {
        state.settings = response.settings;
        state.stats = response.stats;
        state.quizState = response.quizState;
        
        // Check if daily quiz limit reached for free tier
        if (state.settings.subscription === 'free' && 
            state.stats.quizzesToday >= state.settings.dailyGoal) {
          state.dailyQuizLimitReached = true;
        }
        
        // Begin content analysis if not in dailyQuizLimitReached state
        if (!state.dailyQuizLimitReached) {
          analyzePageContent();
        }
      }
    }
  );
  
  // Set up listener for scroll events to potentially trigger quizzes
  window.addEventListener('scroll', handleScroll);
}

// Analyze the page content to find potential quiz material
function analyzePageContent() {
  // Don't run on sensitive sites (banking, email, etc.)
  if (isSensitiveSite()) {
    return;
  }
  
  // Wait for page to be fully loaded
  if (document.readyState !== 'complete') {
    window.addEventListener('load', analyzePageContent);
    return;
  }
  
  // Detect page language
  detectPageLanguage();
  
  // Extract text content from the page
  extractPageText();
  
  // Prepare quiz items from extracted text
  prepareQuizzes();
  
  // Schedule the first quiz based on user settings
  scheduleNextQuiz();
}

// Check if the current site is in the sensitive list (banking, email, etc.)
function isSensitiveSite() {
  const sensitivePatterns = [
    /bank/, /login/, /signin/, /account/, /gmail/, /mail/, /outlook/,
    /password/, /secure/, /pay/, /checkout/, /wallet/
  ];
  
  return sensitivePatterns.some(pattern => 
    pattern.test(window.location.hostname.toLowerCase()));
}

// Simple language detection based on common words
function detectPageLanguage() {
  // In a real implementation, we'd use a proper language detection library
  // For this MVP, we'll use a simple approach based on the lang attribute or common words
  
  // First, check html lang attribute
  const htmlLang = document.documentElement.lang || '';
  
  if (htmlLang.startsWith('en')) {
    state.pageLanguage = 'english';
  } else if (htmlLang.startsWith('es')) {
    state.pageLanguage = 'spanish';
  } else if (htmlLang.startsWith('fr')) {
    state.pageLanguage = 'french';
  } else if (htmlLang.startsWith('de')) {
    state.pageLanguage = 'german';
  } else if (htmlLang.startsWith('zh')) {
    state.pageLanguage = 'mandarin';
  } else {
    // Default to English if we can't detect
    state.pageLanguage = 'english';
  }
}

// Extract readable text from the page
function extractPageText() {
  // Find all paragraphs and headings
  const textElements = document.querySelectorAll('p, h1, h2, h3, h4, h5, h6, li');
  
  textElements.forEach(element => {
    // Skip very short text or already analyzed elements
    if (element.textContent.length < 20 || 
        state.paragraphsAnalyzed.includes(element)) {
      return;
    }
    
    // Skip hidden elements
    if (isHidden(element)) {
      return;
    }
    
    // Add to analyzed elements
    state.paragraphsAnalyzed.push(element);
    
    // Store text with reference to its element (for positioning quizzes later)
    state.pageText.push({
      element: element,
      text: element.textContent.trim()
    });
  });
}

// Check if an element is hidden
function isHidden(element) {
  const style = window.getComputedStyle(element);
  return style.display === 'none' || 
         style.visibility === 'hidden' || 
         style.opacity === '0' ||
         element.offsetParent === null;
}

// Prepare quiz items from extracted text
function prepareQuizzes() {
  if (state.pageText.length === 0) return;
  
  state.pageText.forEach(item => {
    // Skip if there's not enough text
    if (item.text.length < 20) return;
    
    // Split into sentences
    const sentences = item.text.match(/[^.!?]+[.!?]+/g) || [item.text];
    
    sentences.forEach(sentence => {
      // Skip very short sentences
      if (sentence.length < 15) return;
      
      // Get potential quiz words
      const words = extractQuizWords(sentence);
      
      words.forEach(word => {
        // This would be where we check if the word is appropriate for the user's level
        // For the MVP, we'll just take all words
        if (word.length > 3) {
          state.quizQueue.push({
            sourceElement: item.element,
            sourceSentence: sentence,
            word: word,
            translatedWord: mockTranslate(word, state.settings.targetLanguage)
          });
        }
      });
    });
  });
  
  // Shuffle the quiz queue for variety
  state.quizQueue = shuffleArray(state.quizQueue);
}

// Extract potential quiz words from a sentence
function extractQuizWords(sentence) {
  // Remove punctuation and split into words
  const words = sentence
    .replace(/[^\w\s]|_/g, "")
    .replace(/\s+/g, " ")
    .split(" ");
  
  // Remove common words (would be a more comprehensive list in production)
  const commonWords = [
    'the', 'and', 'a', 'an', 'in', 'on', 'at', 'to', 'for', 'of', 'with',
    'by', 'as', 'is', 'are', 'was', 'were', 'be', 'been', 'being',
    'have', 'has', 'had', 'do', 'does', 'did', 'will', 'would', 'shall',
    'should', 'can', 'could', 'may', 'might', 'must', 'that', 'this',
    'these', 'those', 'they', 'them', 'their', 'it', 'its'
  ];
  
  return words.filter(word => 
    word.length > 3 && 
    !commonWords.includes(word.toLowerCase())
  );
}

// Mock translation function - would be replaced with actual API call
function mockTranslate(word, targetLanguage) {
  // In a real extension, this would call a translation API
  const translations = {
    spanish: {
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
      'phone': 'teléfono'
    },
    french: {
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
      'phone': 'téléphone'
    },
    german: {
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
      'phone': 'telefon'
    },
    mandarin: {
      'hello': '你好 (nǐ hǎo)',
      'world': '世界 (shì jiè)',
      'language': '语言 (yǔ yán)',
      'learn': '学习 (xué xí)',
      'book': '书 (shū)',
      'read': '读 (dú)',
      'write': '写 (xiě)',
      'understand': '理解 (lǐ jiě)',
      'speak': '说话 (shuō huà)',
      'listen': '听 (tīng)',
      'friend': '朋友 (péng yǒu)',
      'family': '家庭 (jiā tíng)',
      'house': '房子 (fáng zi)',
      'food': '食物 (shí wù)',
      'water': '水 (shuǐ)',
      'time': '时间 (shí jiān)',
      'day': '日 (rì)',
      'night': '夜 (yè)',
      'work': '工作 (gōng zuò)',
      'play': '玩 (wán)',
      'computer': '电脑 (diàn nǎo)',
      'phone': '电话 (diàn huà)'
    }
  };
  
  // Default translation if not in our mock dictionary
  return translations[targetLanguage]?.[word.toLowerCase()] || word;
}

// Schedule the next quiz based on user settings
function scheduleNextQuiz() {
  if (state.quizScheduled || state.quizActive || state.dailyQuizLimitReached) {
    return;
  }
  
  // Mark as scheduled to prevent multiple schedulings
  state.quizScheduled = true;
  
  // Determine delay based on frequency setting
  let delay;
  switch (state.settings.quizFrequency) {
    case 'low':
      delay = 60000 + Math.random() * 60000; // 1-2 minutes
      break;
    case 'medium':
      delay = 30000 + Math.random() * 30000; // 30-60 seconds
      break;
    case 'high':
      delay = 15000 + Math.random() * 15000; // 15-30 seconds
      break;
    default:
      delay = 45000 + Math.random() * 15000; // Default: 45-60 seconds
  }
  
  // Schedule next quiz
  setTimeout(() => {
    // Initialize a new quiz sequence
    initializeQuizSequence();
    
    // Reset scheduled flag for future quizzes
    state.quizScheduled = false;
    
    // If still under max quizzes for this page, schedule another
    if (state.quizCount < getMaxQuizzesPerPage()) {
      scheduleNextQuiz();
    }
  }, delay);
}

// Get maximum number of quizzes to show per page based on settings
function getMaxQuizzesPerPage() {
  switch (state.settings.quizFrequency) {
    case 'low': return 2;
    case 'medium': return 5;
    case 'high': return 8;
    default: return 3;
  }
}

// Handle scroll events to potentially trigger quizzes
function handleScroll() {
  // Trigger quiz scheduling on any scroll when idle
  if (!state.quizActive && !state.quizScheduled && 
      state.quizCount < getMaxQuizzesPerPage() && !state.dailyQuizLimitReached) {
    scheduleNextQuiz();
  }
}

// Initialize or continue a quiz sequence
function initializeQuizSequence() {
  // If we already have an active sequence, just continue it
  if (state.sequenceActive) {
    showNextQuestionInSequence();
    return;
  }
  
  // Make sure we have enough words to create a sequence
  if (state.quizQueue.length < 5) {
    // If we don't have enough words, analyze more content
    analyzePageContent();
    
    // If we still don't have enough, use what we have
    if (state.quizQueue.length === 0) {
      return; // Can't create a sequence with no words
    }
  }
  
  // Take the next 5 items from the queue (or fewer if we don't have 5)
  state.currentSequence = state.quizQueue.splice(0, Math.min(5, state.quizQueue.length));
  state.currentQuestionIndex = 0;
  state.sequenceActive = true;
  state.sequenceCorrectAnswers = 0;
  
  // Show the first question
  showNextQuestionInSequence();
}

// Show the next question in the current sequence
function showNextQuestionInSequence() {
  if (!state.sequenceActive || state.currentQuestionIndex >= state.currentSequence.length) {
    // Either not in a sequence or we've reached the end
    return;
  }
  
  // Get the current question from the sequence
  const quizItem = state.currentSequence[state.currentQuestionIndex];
  showQuiz(quizItem);
}

// Show a quiz overlay on the page
function showQuiz(quizItem) {
  if (state.quizActive) {
    return;
  }
  
  // Set active flag
  state.quizActive = true;
  state.quizCount++;
  
  // Calculate progress
  const currentQuestion = state.currentQuestionIndex + 1;
  const totalQuestions = state.currentSequence.length;
  
  // Create quiz overlay
  const quizOverlay = document.createElement('div');
  quizOverlay.className = 'linguabrowse-quiz-overlay';
  quizOverlay.innerHTML = `
    <div class="linguabrowse-quiz-container">
      <div class="linguabrowse-quiz-header">
        <div class="linguabrowse-logo">LinguaBrowse</div>
        <div class="linguabrowse-quiz-progress">Question ${currentQuestion}/${totalQuestions}</div>
        <div class="linguabrowse-close">×</div>
      </div>
      <div class="linguabrowse-quiz-content">
        <div class="linguabrowse-quiz-question">
          How do you say <strong>"${quizItem.word}"</strong> in ${state.settings.targetLanguage}?
        </div>
        <div class="linguabrowse-quiz-options">
          ${generateQuizOptions(quizItem.translatedWord)}
        </div>
        <div class="linguabrowse-quiz-feedback" style="display: none;"></div>
      </div>
    </div>
  `;
  
  // Add the overlay to the page
  document.body.appendChild(quizOverlay);
  
  // Position it near the source element
  positionQuizOverlay(quizOverlay, quizItem.sourceElement);
  
  // Set up event listeners
  setupQuizInteractions(quizOverlay, quizItem);
}

// Show results screen after completing a sequence
function showQuizResults() {
  if (state.quizActive) {
    return;
  }
  
  // Set active flag
  state.quizActive = true;
  
  // Calculate score percentage
  const scorePercentage = Math.round((state.sequenceCorrectAnswers / state.currentSequence.length) * 100);
  
  // Create results content
  let resultsMessage;
  if (scorePercentage >= 80) {
    resultsMessage = "Great job! You're making excellent progress.";
  } else if (scorePercentage >= 60) {
    resultsMessage = "Good work! Keep practicing to improve.";
  } else {
    resultsMessage = "Practice makes perfect. Keep going!";
  }
  
  // Create word list HTML
  const wordsListHTML = state.currentSequence.map(item => `
    <div class="linguabrowse-word-pair">
      <span class="linguabrowse-word-original">
        ${item.word}
        <button class="linguabrowse-audio-button" data-word="${item.word}" data-language="${state.pageLanguage}">
          <i class="linguabrowse-audio-icon">🔊</i>
        </button>
      </span>
      <span class="linguabrowse-word-translation">
        ${item.translatedWord}
        <button class="linguabrowse-audio-button" data-word="${item.translatedWord}" data-language="${state.settings.targetLanguage}">
          <i class="linguabrowse-audio-icon">🔊</i>
        </button>
      </span>
    </div>
  `).join('');
  
  // Create quiz overlay
  const quizOverlay = document.createElement('div');
  quizOverlay.className = 'linguabrowse-quiz-overlay';
  quizOverlay.innerHTML = `
    <div class="linguabrowse-quiz-container">
      <div class="linguabrowse-quiz-header">
        <div class="linguabrowse-logo">LinguaBrowse</div>
        <div class="linguabrowse-close">×</div>
      </div>
      <div class="linguabrowse-quiz-content">
        <div class="linguabrowse-results-container">
          <div class="linguabrowse-results-title">Quiz Complete!</div>
          <div class="linguabrowse-results-score">${state.sequenceCorrectAnswers}/${state.currentSequence.length}</div>
          <div class="linguabrowse-results-message">${resultsMessage}</div>
          
          <div class="linguabrowse-results-title">Words Covered:</div>
          <div class="linguabrowse-results-words">
            ${wordsListHTML}
          </div>
          
          <button class="linguabrowse-next-button">Continue Browsing</button>
        </div>
      </div>
    </div>
  `;
  
  // Add the overlay to the page
  document.body.appendChild(quizOverlay);
  
  // Position it in the center of the viewport
  const overlay = quizOverlay;
  overlay.style.position = 'fixed';
  overlay.style.left = '50%';
  overlay.style.top = '50%';
  overlay.style.transform = 'translate(-50%, -50%)';
  overlay.style.zIndex = '9999';
  
  // Set up event listeners
  const closeButton = overlay.querySelector('.linguabrowse-close');
  const continueButton = overlay.querySelector('.linguabrowse-next-button');
  const audioButtons = overlay.querySelectorAll('.linguabrowse-audio-button');
  
  // Close button handler
  closeButton.addEventListener('click', () => {
    document.body.removeChild(overlay);
    state.quizActive = false;
    state.sequenceActive = false;
  });
  
  // Continue button handler
  continueButton.addEventListener('click', () => {
    document.body.removeChild(overlay);
    state.quizActive = false;
    state.sequenceActive = false;
    
    // Schedule the next quiz sequence after a delay
    setTimeout(() => {
      scheduleNextQuiz();
    }, 60000); // Wait a minute before potentially starting a new sequence
  });
  
  // Set up audio button handlers
  audioButtons.forEach(button => {
    button.addEventListener('click', async (event) => {
      event.stopPropagation(); // Prevent event bubbling
      
      const word = button.getAttribute('data-word');
      const language = button.getAttribute('data-language');
      
      // Add playing class for animation
      button.classList.add('playing');
      
      try {
        // Use our audio service to play the pronunciation
        await audioService.pronounceWord(word, language);
        
        // Process spaced repetition data
        if (language === state.settings.targetLanguage) {
          // If the user is listening to the translation, count as a review
          spacedRepetition.processReview(word, language, 3); // Medium performance score
        }
        
        // Remove playing class after a delay
        setTimeout(() => {
          button.classList.remove('playing');
        }, 1000);
      } catch (error) {
        console.error('Error playing pronunciation:', error);
        button.classList.remove('playing');
      }
    });
  });
}

// Generate multiple-choice options for the quiz
function generateQuizOptions(correctAnswer) {
  // We'll create 4 options including the correct one
  const options = [correctAnswer];
  
  // Add incorrect options from our mock translations
  // In a real extension, these would be smartly chosen
  const availableTranslations = {
    spanish: ['casa', 'tiempo', 'hombre', 'mujer', 'ciudad', 'país', 'escuela', 'universidad'],
    french: ['maison', 'temps', 'homme', 'femme', 'ville', 'pays', 'école', 'université'],
    german: ['haus', 'zeit', 'mann', 'frau', 'stadt', 'land', 'schule', 'universität'],
    mandarin: ['房子 (fáng zi)', '时间 (shí jiān)', '男人 (nán rén)', '女人 (nǚ rén)', '城市 (chéng shì)']
  };
  
  // Get wrong options for the current language
  const wrongOptions = availableTranslations[state.settings.targetLanguage] || [];
  
  // Shuffle and take the first 3, making sure not to include the correct answer
  shuffleArray(wrongOptions)
    .filter(option => option !== correctAnswer)
    .slice(0, 3)
    .forEach(option => options.push(option));
  
  // Shuffle all options
  shuffleArray(options);
  
  // Create HTML for options
  return options.map(option => 
    `<button class="linguabrowse-quiz-option" data-value="${option}">${option}</button>`
  ).join('');
}

// Position the quiz overlay near the source element
function positionQuizOverlay(overlay, sourceElement) {
  const rect = sourceElement.getBoundingClientRect();
  const overlayRect = overlay.getBoundingClientRect();
  
  // Calculate position to place overlay on the right side of the content
  let left = rect.right + 20;
  let top = rect.top + window.scrollY;
  
  // If not enough space on right, try left
  if (left + overlayRect.width > window.innerWidth) {
    left = rect.left - overlayRect.width - 20;
    
    // If not enough space on left either, place it below
    if (left < 0) {
      left = Math.max(10, rect.left);
      top = rect.bottom + window.scrollY + 10;
    }
  }
  
  // Ensure it's not positioned off-screen
  left = Math.max(10, Math.min(left, window.innerWidth - overlayRect.width - 10));
  top = Math.max(10, Math.min(top, document.body.scrollHeight - overlayRect.height - 10));
  
  // Apply position
  overlay.style.position = 'absolute';
  overlay.style.left = `${left}px`;
  overlay.style.top = `${top}px`;
  overlay.style.zIndex = '9999';
}

// Set up event listeners for quiz interaction
function setupQuizInteractions(overlay, quizItem) {
  // Get elements
  const closeButton = overlay.querySelector('.linguabrowse-close');
  const options = overlay.querySelectorAll('.linguabrowse-quiz-option');
  const feedbackArea = overlay.querySelector('.linguabrowse-quiz-feedback');
  
  // Close button handler
  closeButton.addEventListener('click', () => {
    document.body.removeChild(overlay);
    state.quizActive = false;
  });
  
  // Option button handlers
  options.forEach(option => {
    option.addEventListener('click', () => {
      // Disable further clicks
      options.forEach(opt => opt.disabled = true);
      
      const selectedValue = option.getAttribute('data-value');
      const isCorrect = selectedValue === quizItem.translatedWord;
      
      // Highlight correct/incorrect
      options.forEach(opt => {
        if (opt.getAttribute('data-value') === quizItem.translatedWord) {
          opt.classList.add('linguabrowse-correct');
        } else if (opt === option && !isCorrect) {
          opt.classList.add('linguabrowse-incorrect');
        }
      });
      
      // Update sequence stats
      if (isCorrect) {
        state.sequenceCorrectAnswers++;
      }
      
      // Create feedback content
      const feedbackIcon = isCorrect ? 
        `<div class="linguabrowse-feedback-icon correct">✓</div>` : 
        `<div class="linguabrowse-feedback-icon incorrect">✗</div>`;
      
      const feedbackMessage = isCorrect ? 
        `<div class="linguabrowse-correct-message">Correct!</div>` : 
        `<div class="linguabrowse-incorrect-message">Incorrect</div>`;
      
      const explanation = `<div class="linguabrowse-feedback-explanation">
        "${quizItem.translatedWord}" is the ${state.settings.targetLanguage} word for "${quizItem.word}".
      </div>`;
      
      // Determine if this is the last question
      const isLastQuestion = state.currentQuestionIndex === state.currentSequence.length - 1;
      const buttonText = isLastQuestion ? 'See Results' : 'Next Question';
      
      // Show feedback
      feedbackArea.innerHTML = `
        ${feedbackIcon}
        ${feedbackMessage}
        ${explanation}
        <button class="linguabrowse-next-button">${buttonText}</button>
      `;
      feedbackArea.style.display = 'flex';
      
      // Add event listener to the next button
      const nextButton = feedbackArea.querySelector('.linguabrowse-next-button');
      nextButton.addEventListener('click', () => {
        // Remove the current quiz overlay
        document.body.removeChild(overlay);
        state.quizActive = false;
        
        // Move to the next question or show results
        state.currentQuestionIndex++;
        
        if (state.currentQuestionIndex < state.currentSequence.length) {
          // Show next question
          showNextQuestionInSequence();
        } else {
          // End of sequence, show results
          state.sequenceActive = false;
          showQuizResults();
        }
      });
      
      // Update stats in background
      chrome.runtime.sendMessage({
        type: 'quizCompleted',
        correct: isCorrect,
        word: quizItem.word,
        language: state.settings.targetLanguage
      });
    });
  });
}

// Shuffle an array (Fisher-Yates algorithm)
function shuffleArray(array) {
  const newArray = [...array];
  for (let i = newArray.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [newArray[i], newArray[j]] = [newArray[j], newArray[i]];
  }
  return newArray;
}
