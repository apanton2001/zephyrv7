// LinguaBrowse - Popup Script

// Initialize the popup
document.addEventListener('DOMContentLoaded', init);

// Global state for the popup
const state = {
  settings: null,
  stats: null
};

// Initialize the popup interface
async function init() {
  // Load user data from storage
  loadUserData();
  
  // Set up tab switching
  setupTabs();
  
  // Set up form handlers
  setupSettingsForm();
  
  // Set up subscription buttons
  setupSubscriptionButtons();
  
  // Set up other UI interactions
  document.getElementById('upgrade-button').addEventListener('click', () => {
    // Show subscription tab
    switchTab('subscription');
  });
}

// Load user data and populate the UI
function loadUserData() {
  chrome.runtime.sendMessage({ type: 'getUserData' }, (response) => {
    if (response) {
      state.settings = response.settings;
      state.stats = response.stats;
      
      // Update UI with loaded data
      updateDashboard();
      populateSettingsForm();
      updateSubscriptionUI();
      populateWordsTab();
    }
  });
}

// Set up tab switching
function setupTabs() {
  const tabs = document.querySelectorAll('.nav-tab');
  
  tabs.forEach(tab => {
    tab.addEventListener('click', () => {
      const tabName = tab.getAttribute('data-tab');
      switchTab(tabName);
    });
  });
}

// Switch to a different tab
function switchTab(tabName) {
  // Hide all tabs
  document.querySelectorAll('.tab-content').forEach(content => {
    content.classList.remove('active');
  });
  
  // Deactivate all tab buttons
  document.querySelectorAll('.nav-tab').forEach(tab => {
    tab.classList.remove('active');
  });
  
  // Show the selected tab
  document.getElementById(tabName).classList.add('active');
  
  // Activate the tab button
  document.querySelector(`.nav-tab[data-tab="${tabName}"]`).classList.add('active');
}

// Update dashboard with user stats
function updateDashboard() {
  if (!state.settings || !state.stats) return;
  
  // Update streak
  document.querySelector('.streak-value').textContent = 
    state.settings.streakInfo.currentStreak;
  
  // Update quizzes completed
  document.querySelector('.stats-grid .stat-card:nth-child(1) .stat-value').textContent = 
    state.stats.totalQuizzesAnswered;
  
  // Update words learned
  const wordsLearned = Object.values(state.stats.wordsLearned || {})
    .reduce((count, langWords) => count + Object.keys(langWords).length, 0);
  
  document.querySelector('.stats-grid .stat-card:nth-child(2) .stat-value').textContent = 
    wordsLearned;
  
  // Update daily goal progress
  const goalProgress = document.querySelector('.progress-section:nth-child(3) .progress-value');
  const goalProgressBar = document.querySelector('.progress-section:nth-child(3) .progress-fill');
  
  goalProgress.textContent = `${state.stats.quizzesToday}/${state.settings.dailyGoal} quizzes`;
  const goalPercentage = Math.min(100, (state.stats.quizzesToday / state.settings.dailyGoal) * 100);
  goalProgressBar.style.width = `${goalPercentage}%`;
  
  // Update XP points
  const xpProgress = document.querySelector('.progress-section:nth-child(4) .progress-value');
  const xpProgressBar = document.querySelector('.progress-section:nth-child(4) .progress-fill');
  
  xpProgress.textContent = `${state.stats.xpPoints} XP`;
  // XP percentage is based on level thresholds (simplified for MVP)
  const xpPercentage = Math.min(100, (state.stats.xpPoints % 100) / 100 * 100);
  xpProgressBar.style.width = `${xpPercentage}%`;
  
  // Show/hide subscription banner based on plan
  const subBanner = document.querySelector('#dashboard .subscription-banner');
  if (state.settings.subscription !== 'free') {
    subBanner.style.display = 'none';
    document.getElementById('upgrade-button').style.display = 'none';
  }
}

// Populate the settings form with current settings
function populateSettingsForm() {
  if (!state.settings) return;
  
  document.getElementById('target-language').value = state.settings.targetLanguage;
  document.getElementById('user-level').value = state.settings.userLevel;
  document.getElementById('quiz-frequency').value = state.settings.quizFrequency;
  document.getElementById('daily-goal').value = state.settings.dailyGoal;
}

// Set up settings form submission
function setupSettingsForm() {
  const form = document.getElementById('settings-form');
  
  form.addEventListener('submit', (e) => {
    e.preventDefault();
    
    // Get form values
    const formData = new FormData(form);
    const newSettings = {
      ...state.settings,
      targetLanguage: formData.get('targetLanguage'),
      userLevel: formData.get('userLevel'),
      quizFrequency: formData.get('quizFrequency'),
      dailyGoal: parseInt(formData.get('dailyGoal'), 10)
    };
    
    // Save to storage
    chrome.runtime.sendMessage(
      { type: 'updateSettings', settings: newSettings },
      (response) => {
        if (response && response.success) {
          // Update local state
          state.settings = newSettings;
          
          // Show success indicator
          const submitButton = form.querySelector('button[type="submit"]');
          const originalText = submitButton.textContent;
          submitButton.textContent = 'Saved!';
          submitButton.disabled = true;
          
          // Reset button after 2 seconds
          setTimeout(() => {
            submitButton.textContent = originalText;
            submitButton.disabled = false;
          }, 2000);
        }
      }
    );
  });
}

// Update subscription UI based on current plan
function updateSubscriptionUI() {
  if (!state.settings) return;
  
  const subCards = document.querySelectorAll('.subscription-card');
  
  // Remove active class from all cards
  subCards.forEach(card => {
    card.classList.remove('active');
    
    // Show/hide Current Plan text
    const currentPlanText = card.querySelector('div:not([class])');
    if (currentPlanText && currentPlanText.textContent === 'Current Plan') {
      currentPlanText.style.display = 'none';
    }
    
    // Show/hide Subscribe buttons
    const subscribeButton = card.querySelector('button');
    if (subscribeButton) {
      subscribeButton.style.display = 'block';
    }
  });
  
  // Active card based on subscription
  let activeCardIndex = 0;
  
  switch (state.settings.subscription) {
    case 'free':
      activeCardIndex = 0;
      break;
    case 'core':
      activeCardIndex = 1;
      break;
    case 'premium':
      activeCardIndex = 2;
      break;
  }
  
  const activeCard = subCards[activeCardIndex];
  activeCard.classList.add('active');
  
  // Show Current Plan text for active card
  let currentPlanText = activeCard.querySelector('div:not([class])');
  if (!currentPlanText) {
    currentPlanText = document.createElement('div');
    currentPlanText.textContent = 'Current Plan';
    activeCard.appendChild(currentPlanText);
  } else {
    currentPlanText.style.display = 'block';
  }
  
  // Hide Subscribe button for active card
  const subscribeButton = activeCard.querySelector('button');
  if (subscribeButton) {
    subscribeButton.style.display = 'none';
  }
}

// Set up subscription buttons
function setupSubscriptionButtons() {
  const subButtons = document.querySelectorAll('.subscription-card button');
  
  subButtons.forEach(button => {
    button.addEventListener('click', () => {
      const planType = button.textContent.includes('Core') ? 'core' : 'premium';
      
      // For MVP, we'll just show an alert
      // In a real extension, this would open a payment page
      alert(`This would open a payment page for the ${planType} plan. For this MVP, we'll simulate upgrading.`);
      
      // Simulate upgrading (for MVP only)
      if (state.settings) {
        const newSettings = {
          ...state.settings,
          subscription: planType
        };
        
        // Save to storage
        chrome.runtime.sendMessage(
          { type: 'updateSettings', settings: newSettings },
          (response) => {
            if (response && response.success) {
              // Update local state
              state.settings = newSettings;
              
              // Update UI
              updateSubscriptionUI();
              updateDashboard();
              
              // Show confirmation
              alert(`Successfully upgraded to ${planType} plan!`);
            }
          }
        );
      }
    });
  });
}

// Populate the words tab with learned words
function populateWordsTab() {
  if (!state.settings || !state.stats) return;
  
  const wordsList = document.querySelector('.words-list');
  const subBanner = document.querySelector('#words .subscription-banner');
  
  // Check if there are any words
  const targetLang = state.settings.targetLanguage;
  const langWords = state.stats.wordsLearned[targetLang] || {};
  const hasWords = Object.keys(langWords).length > 0;
  
  if (hasWords) {
    // Clear empty message
    wordsList.classList.remove('words-empty');
    wordsList.innerHTML = '';
    
    // Get words for current language
    let words = Object.entries(langWords).map(([word, data]) => ({
      word,
      ...data
    }));
    
    // Sort by recently seen
    words.sort((a, b) => new Date(b.lastSeen) - new Date(a.lastSeen));
    
    // For free users, limit to 5 most recent words
    if (state.settings.subscription === 'free') {
      words = words.slice(0, 5);
      subBanner.style.display = 'flex';
    } else {
      subBanner.style.display = 'none';
    }
    
    // Create word items
    words.forEach(wordData => {
      const wordItem = document.createElement('div');
      wordItem.className = 'word-item';
      
      const translatedWord = getMockTranslation(wordData.word, targetLang);
      
      wordItem.innerHTML = `
        <div class="word-item-original">${wordData.word}</div>
        <div class="word-item-translation">${translatedWord}</div>
      `;
      
      wordsList.appendChild(wordItem);
    });
  } else {
    // Show empty message
    wordsList.classList.add('words-empty');
    wordsList.innerHTML = "You haven't learned any words yet. Start browsing with LinguaBrowse to build your vocabulary!";
    
    // Hide subscription banner
    subBanner.style.display = 'none';
  }
  
  // Set up search functionality
  setupWordSearch();
}

// Set up word search functionality
function setupWordSearch() {
  const searchInput = document.querySelector('.words-search input');
  
  searchInput.addEventListener('input', (e) => {
    const searchTerm = e.target.value.toLowerCase().trim();
    
    // Get all word items
    const wordItems = document.querySelectorAll('.word-item');
    
    // Skip if no words or in empty state
    if (wordItems.length === 0) return;
    
    // Filter words
    wordItems.forEach(item => {
      const originalWord = item.querySelector('.word-item-original').textContent.toLowerCase();
      const translatedWord = item.querySelector('.word-item-translation').textContent.toLowerCase();
      
      const match = originalWord.includes(searchTerm) || translatedWord.includes(searchTerm);
      
      item.style.display = match ? 'flex' : 'none';
    });
  });
}

// Mock translation function (same as in content.js)
function getMockTranslation(word, targetLanguage) {
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
  
  return translations[targetLanguage]?.[word.toLowerCase()] || word;
}
