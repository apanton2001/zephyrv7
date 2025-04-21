# LinguaBrowse Chrome Extension

LinguaBrowse is a Chrome extension that transforms everyday web browsing into language learning sessions by overlaying context-relevant quiz questions.

## Features

### Core Features
- **Real-time Content Analysis**: Analyzes page content to identify words for learning
- **Contextual Micro-Quizzes**: Displays quizzes based on the content you're reading
- **Streaks & Gamification**: Tracks daily usage and correct answers
- **Multi-Language Support**: Learn Spanish, French, German, Mandarin, and more

### Enhanced Features (New!)
- **Audio Pronunciation**: Hear words spoken in both your native and target languages
- **Spaced Repetition**: Optimizes learning schedule based on your performance
- **Enhanced Dictionary**: Provides rich word information with examples and context

## Installation (Development Mode)

1. Clone this repository
2. Open Chrome and navigate to `chrome://extensions/`
3. Enable "Developer mode" (toggle in the top-right corner)
4. Click "Load unpacked" and select the extension directory
5. The extension should now be installed and active

## Usage

1. Browse any website as you normally would
2. LinguaBrowse will periodically display quizzes related to the content you're reading
3. Answer the questions to earn points and maintain your streak
4. Track your progress in the popup dashboard

## Testing

The extension includes comprehensive testing tools to verify functionality:

1. **Standalone Test Page**: Open `standalone-test.html` in your browser to test all features without installing the extension
2. **Testing Documentation**: Refer to `TESTING.md` for detailed testing instructions

## Project Structure

- `manifest.json`: Chrome extension configuration
- `background.js`: Background service worker
- `content.js`: Content script that runs on web pages
- `popup.html/js`: Extension popup interface
- `js/services/`: Core service modules
  - `audioService.js`: Audio pronunciation service
  - `spacedRepetition.js`: Learning optimization algorithm
  - `dictionaryService.js`: Translation and word information
- `styles/`: CSS files
- `data/dictionaries/`: Dictionary data files

## License

MIT
