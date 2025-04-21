// Background script for LinguaBrowse extension - runs as a service worker

// Initialize state on installation
chrome.runtime.onInstalled.addListener((details) => {
  // Default settings
  const defaultSettings = {
    targetLanguage: 'spanish', // Default to Spanish
    userLevel: 'beginner',     // Default to beginner
    quizFrequency: 'medium',   // Medium frequency of quizzes (1-3 per page)
    dailyGoal: 5,              // 5 quizzes per day
    subscription: 'free',      // Free tier by default
    streakInfo: {
      currentStreak: 0,        // Days in a row
      lastQuizDate: null,      // Last date a quiz was answered
      freezesAvailable: 0      // Streak freezes (premium feature)
    },
    firstInstall: true         // Track if this is the first time installing
  };

  // Initialize storage with default settings
  chrome.storage.sync.set({ 
    settings: defaultSettings,
    stats: {
      totalQuizzesAnswered: 0,
      correctAnswers: 0,
      quizzesToday: 0,
      wordsLearned: {},        // Object to track learned words and their status
      xpPoints: 0
    },
    quizState: {
      currentSequence: [],      // Array to hold the 5 questions for current sequence
      currentQuestionIndex: 0,  // Current position in the sequence (0-4)
      sequenceActive: false,    // Whether a sequence is currently in progress
      correctAnswers: 0,        // Number of correct answers in current sequence
      completedSequences: 0     // Number of completed 5-question sequences
    }
  });
  
  // Show welcome page on first install
  if (details.reason === 'install') {
    chrome.tabs.create({ url: 'welcome.html' });
  }
  
  // Create an alarm for daily stats reset at midnight
  chrome.alarms.create('dailyReset', {
    periodInMinutes: 60 * 24,  // Daily
    when: getNextMidnight()
  });
});

// Handle streak maintenance
chrome.alarms.onAlarm.addListener((alarm) => {
  if (alarm.name === 'dailyReset') {
    updateStreak();
    resetDailyStats();
  }
});

// Get timestamp for next midnight
function getNextMidnight() {
  const now = new Date();
  const midnight = new Date(
    now.getFullYear(),
    now.getMonth(),
    now.getDate() + 1, // Tomorrow
    0, 0, 0, 0 // Midnight (00:00:00)
  );
  return midnight.getTime();
}

// Update user's streak based on activity
function updateStreak() {
  chrome.storage.sync.get(['settings', 'stats'], (data) => {
    const { settings, stats } = data;
    const today = new Date().toDateString();
    
    // If user completed quizzes today
    if (stats.quizzesToday > 0) {
      // Update last active date to today
      settings.streakInfo.lastQuizDate = today;
    } else {
      // No quizzes done today - check if streak is broken
      if (settings.streakInfo.lastQuizDate) {
        const lastQuizDate = new Date(settings.streakInfo.lastQuizDate);
        const yesterday = new Date();
        yesterday.setDate(yesterday.getDate() - 1);
        
        // If last quiz was before yesterday, streak is broken
        // Unless they have a streak freeze available (premium)
        if (lastQuizDate < yesterday.setHours(0,0,0,0)) {
          if (settings.subscription === 'premium' && settings.streakInfo.freezesAvailable > 0) {
            // Use a streak freeze
            settings.streakInfo.freezesAvailable--;
          } else {
            // Streak broken
            settings.streakInfo.currentStreak = 0;
          }
        }
      }
    }
    
    // Save updated settings
    chrome.storage.sync.set({ settings });
  });
}

// Reset daily stats for a new day
function resetDailyStats() {
  chrome.storage.sync.get('stats', (data) => {
    const stats = data.stats;
    stats.quizzesToday = 0;
    chrome.storage.sync.set({ stats });
  });
}

// Handle welcome page actions
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.action === 'startOnboarding') {
    // Handle onboarding process start
    chrome.storage.sync.get('settings', (data) => {
      const settings = data.settings;
      settings.firstInstall = false;
      chrome.storage.sync.set({ settings });
    });
    sendResponse({success: true});
    return true;
  }
  
  if (message.action === 'selectPlan') {
    // Handle subscription plan selection
    const plan = message.plan;
    chrome.storage.sync.get('settings', (data) => {
      const settings = data.settings;
      settings.subscription = plan;
      chrome.storage.sync.set({ settings });
    });
    sendResponse({success: true});
    return true;
  }
  
  // Quiz sequence management
  if (message.action === 'initializeQuizSequence') {
    initializeQuizSequence(message.words);
    sendResponse({success: true});
    return true;
  }
  
  if (message.action === 'submitAnswer') {
    const result = handleQuizAnswer(message.answer, message.isCorrect);
    sendResponse(result);
    return true;
  }
  
  if (message.action === 'requestNextQuestion') {
    const nextQuestion = advanceToNextQuestion();
    sendResponse(nextQuestion);
    return true;
  }

  // Handle quiz completion
  if (message.type === 'quizCompleted') {
    updateStats(message.correct, message.word, message.language);
    sendResponse({success: true});
    return true; // Keep the messaging channel open for async response
  }
  
  // Handle request for user data/settings
  if (message.type === 'getUserData') {
    chrome.storage.sync.get(['settings', 'stats', 'quizState'], (data) => {
      sendResponse(data);
    });
    return true; // Keep the messaging channel open for async response
  }
  
  // Handle settings update
  if (message.type === 'updateSettings') {
    chrome.storage.sync.set({ settings: message.settings }, () => {
      sendResponse({success: true});
    });
    return true; // Keep the messaging channel open for async response
  }
});

// Initialize a new quiz sequence with 5 questions
function initializeQuizSequence(extractedWords) {
  // Generate 5 unique questions from the extracted words
  const uniqueWords = [...new Set(extractedWords)];
  const selectedWords = uniqueWords
    .sort(() => 0.5 - Math.random()) // Shuffle array
    .slice(0, Math.min(5, uniqueWords.length)); // Take up to 5 words
  
  // Create question objects
  const questions = selectedWords.map(word => ({
    word: word,
    options: generateOptions(word, extractedWords),
    correctAnswer: getTranslation(word) // This would call a function to get the translation
  }));
  
  // Initialize the quiz state
  chrome.storage.sync.get('quizState', (data) => {
    const quizState = data.quizState;
    quizState.currentSequence = questions;
    quizState.currentQuestionIndex = 0;
    quizState.sequenceActive = true;
    quizState.correctAnswers = 0;
    
    chrome.storage.sync.set({ quizState });
  });
  
  // Return the first question
  return {
    question: questions[0],
    questionIndex: 0,
    totalQuestions: questions.length
  };
}

// Handle a submitted answer
function handleQuizAnswer(answer, isCorrect) {
  return chrome.storage.sync.get(['quizState', 'stats', 'settings'], (data) => {
    const quizState = data.quizState;
    const currentQuestion = quizState.currentSequence[quizState.currentQuestionIndex];
    
    // Update stats for this answer
    if (isCorrect) {
      quizState.correctAnswers++;
      updateStats(true, currentQuestion.word, data.settings.targetLanguage);
    } else {
      updateStats(false, currentQuestion.word, data.settings.targetLanguage);
    }
    
    return {
      isCorrect: isCorrect,
      correctAnswer: currentQuestion.correctAnswer,
      explanation: getExplanation(currentQuestion.word, currentQuestion.correctAnswer),
      questionNumber: quizState.currentQuestionIndex + 1,
      totalQuestions: quizState.currentSequence.length
    };
  });
}

// Advance to the next question in the sequence
function advanceToNextQuestion() {
  return chrome.storage.sync.get('quizState', (data) => {
    const quizState = data.quizState;
    
    // Increment the question index
    quizState.currentQuestionIndex++;
    
    // Check if we've reached the end of the sequence
    if (quizState.currentQuestionIndex >= quizState.currentSequence.length) {
      // Sequence is complete
      quizState.sequenceActive = false;
      quizState.completedSequences++;
      
      chrome.storage.sync.set({ quizState });
      
      return {
        sequenceComplete: true,
        results: {
          correctAnswers: quizState.correctAnswers,
          totalQuestions: quizState.currentSequence.length,
          scorePercentage: Math.round((quizState.correctAnswers / quizState.currentSequence.length) * 100)
        }
      };
    }
    
    // Return the next question
    chrome.storage.sync.set({ quizState });
    return {
      sequenceComplete: false,
      question: quizState.currentSequence[quizState.currentQuestionIndex],
      questionNumber: quizState.currentQuestionIndex + 1,
      totalQuestions: quizState.currentSequence.length
    };
  });
}

// Helper function to generate multiple choice options
function generateOptions(correctWord, allWords) {
  // Start with the correct answer
  const options = [getTranslation(correctWord)];
  
  // Add some incorrect options (other translations or dummy options)
  const otherWords = allWords.filter(word => word !== correctWord);
  
  // If we don't have enough other words, add some predefined wrong answers
  if (otherWords.length < 3) {
    const dummyOptions = ['dummy1', 'dummy2', 'dummy3', 'dummy4', 'dummy5'];
    while (options.length < 4 && dummyOptions.length > 0) {
      options.push(dummyOptions.pop());
    }
  } else {
    // Add translations of other words as incorrect options
    while (options.length < 4 && otherWords.length > 0) {
      const randomIndex = Math.floor(Math.random() * otherWords.length);
      const wrongWord = otherWords.splice(randomIndex, 1)[0];
      options.push(getTranslation(wrongWord));
    }
  }
  
  // Shuffle the options
  return options.sort(() => 0.5 - Math.random());
}

// Helper function to get translation (this would be replaced with actual translation logic)
function getTranslation(word) {
  // This is a placeholder. In a real implementation, this would:
  // 1. Look up a local dictionary
  // 2. Or call a translation API
  // 3. Or use a predefined set of translations
  
  // Simple placeholder implementation with Spanish translations for common words
  const translations = {
    'language': 'idioma',
    'book': 'libro',
    'house': 'casa',
    'car': 'coche',
    'water': 'agua',
    'food': 'comida',
    'friend': 'amigo',
    'work': 'trabajo',
    'time': 'tiempo',
    'day': 'día',
    'night': 'noche',
    'man': 'hombre',
    'woman': 'mujer',
    'child': 'niño',
    'city': 'ciudad',
    'person': 'persona',
    'brain': 'cerebro',
    'computer': 'ordenador'
  };
  
  return translations[word.toLowerCase()] || `[${word}]`;
}

// Helper function to get explanation for an answer
function getExplanation(word, translation) {
  return `"${translation}" is the correct translation of "${word}".`;
}

// Update user statistics when a quiz is completed
function updateStats(correct, word, language) {
  chrome.storage.sync.get(['settings', 'stats'], (data) => {
    const { settings, stats } = data;
    
    // Update general stats
    stats.totalQuizzesAnswered++;
    stats.quizzesToday++;
    
    // Update XP points (1-5 points per quiz depending on difficulty)
    const pointsEarned = correct ? 
      (settings.userLevel === 'beginner' ? 1 : 
       settings.userLevel === 'intermediate' ? 3 : 5) : 0;
    stats.xpPoints += pointsEarned;
    
    if (correct) {
      stats.correctAnswers++;
      
      // Track the word as learned or reinforce if already seen
      if (!stats.wordsLearned[language]) {
        stats.wordsLearned[language] = {};
      }
      
      if (!stats.wordsLearned[language][word]) {
        stats.wordsLearned[language][word] = {
          timesCorrect: 1,
          lastSeen: new Date().toISOString(),
          mastered: false
        };
      } else {
        stats.wordsLearned[language][word].timesCorrect++;
        stats.wordsLearned[language][word].lastSeen = new Date().toISOString();
        
        // Mark as mastered if answered correctly 5+ times
        if (stats.wordsLearned[language][word].timesCorrect >= 5) {
          stats.wordsLearned[language][word].mastered = true;
        }
      }
    }
    
    // If this was their first quiz of the day and they had a streak going
    const today = new Date().toDateString();
    if (stats.quizzesToday === 1 && 
        settings.streakInfo.lastQuizDate !== today) {
      
      // Check if they're continuing a streak
      const lastDate = settings.streakInfo.lastQuizDate ? 
        new Date(settings.streakInfo.lastQuizDate) : null;
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      
      if (!lastDate || 
          lastDate.toDateString() === yesterday.toDateString()) {
        // Streak continues or first day
        settings.streakInfo.currentStreak++;
        settings.streakInfo.lastQuizDate = today;
      }
    }
    
    // Save updated stats and settings
    chrome.storage.sync.set({ stats, settings });
  });
}
