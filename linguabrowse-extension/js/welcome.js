// JavaScript for LinguaBrowse welcome page

document.addEventListener('DOMContentLoaded', () => {
  initButtonListeners();
  animateElementsOnScroll();
});

/**
 * Initialize all button listeners on the welcome page
 */
function initButtonListeners() {
  // Main CTA button
  const mainCtaButton = document.querySelector('.cta-container .primary-cta');
  if (mainCtaButton) {
    mainCtaButton.addEventListener('click', () => {
      // In a real implementation, this would navigate to the subscription page
      // or initiate the onboarding process
      chrome.runtime.sendMessage({ action: 'startOnboarding' });
      window.close(); // Close the welcome page and go back to the extension popup
    });
  }

  // Plan buttons
  const upgradeButtons = document.querySelectorAll('.plan-cta button');
  upgradeButtons.forEach(button => {
    button.addEventListener('click', (e) => {
      const plan = e.target.closest('.plan-card').classList.contains('premium') ? 'premium' : 
                   e.target.closest('.plan-card').classList.contains('core') ? 'core' : 'free';
      
      // In a real implementation, this would navigate to the subscription page for the specific plan
      chrome.runtime.sendMessage({ 
        action: 'selectPlan', 
        plan: plan 
      });
    });
  });

  // Create demo interaction for the quiz overlay
  setupQuizDemo();
}

/**
 * Set up the interactive demo of the quiz functionality
 */
function setupQuizDemo() {
  const options = document.querySelectorAll('.quiz-options .option');
  const feedback = document.querySelector('.quiz-feedback');
  const nextButton = document.querySelector('.quiz-next-button');
  
  // Initially hide the feedback section
  if (feedback) {
    feedback.style.display = 'none';
  }
  
  // Add click handlers to each option
  options.forEach(option => {
    option.addEventListener('click', () => {
      // Reset all options
      options.forEach(opt => {
        opt.classList.remove('selected');
        // Note: We keep the 'correct' class for the demo
      });
      
      // Mark this option as selected
      option.classList.add('selected');
      
      // Show feedback
      if (feedback) {
        feedback.style.display = 'flex';
      }
    });
  });
  
  // Next button click handler
  if (nextButton) {
    nextButton.addEventListener('click', () => {
      // In a real implementation, this would load the next question
      // For the demo, we just hide the feedback
      if (feedback) {
        feedback.style.display = 'none';
      }
      
      // Reset selected options
      options.forEach(opt => {
        opt.classList.remove('selected');
      });
    });
  }
}

/**
 * Animate elements as they scroll into view
 */
function animateElementsOnScroll() {
  // Simple animation for cards as they scroll into view
  const animateOnScroll = (entries, observer) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.style.opacity = '1';
        entry.target.style.transform = 'translateY(0)';
        // Stop observing after animation
        observer.unobserve(entry.target);
      }
    });
  };

  // Create observer
  const observer = new IntersectionObserver(animateOnScroll, {
    root: null,
    threshold: 0.1,
    rootMargin: '0px 0px -50px 0px'
  });

  // Target elements to animate
  const elements = [
    ...document.querySelectorAll('.feature-card'),
    ...document.querySelectorAll('.step-card'),
    ...document.querySelectorAll('.plan-card'),
    document.querySelector('.technology-explainer'),
    document.querySelector('.quiz-demo')
  ];

  // Set initial state and observe
  elements.forEach(el => {
    if (el) {
      el.style.opacity = '0';
      el.style.transform = 'translateY(20px)';
      el.style.transition = 'opacity 0.5s ease, transform 0.5s ease';
      observer.observe(el);
    }
  });
}
