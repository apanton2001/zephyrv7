# LinguaBrowse Extension Testing Guide

This document explains how to test the LinguaBrowse extension features, particularly the enhanced features (audio pronunciation, spaced repetition, and enhanced dictionary).

## Test Files

There are two main test files available:

1. `test-with-mocks.html` - Original test page that attempts to load extension modules
2. `standalone-test.html` - **Preferred test file** with self-contained mocks and demonstrations

## Using standalone-test.html

The standalone test page provides a complete testing environment for all features without requiring the extension to be loaded. It includes:

- Sample article content with highlighted words
- Interactive test controls for each feature
- Mock implementations of all services
- Visual demonstration of the quiz results UI

### Features to Test

The standalone test page provides buttons to test each of the following features:

#### 1. Audio Service

Tests the pronunciation capabilities by:
- Playing English words using the audio service
- Looking up Spanish translations
- Playing the Spanish translations

The audio service simulates audio playback with console logs (in a real extension, actual audio would play).

#### 2. Spaced Repetition

Tests the spaced repetition scheduling algorithm by:
- Processing review results for sample words with different performance levels
- Prioritizing words based on their learning status
- Retrieving words due for review

The logs show how words are scheduled based on performance and how the algorithm prioritizes which words to show next.

#### 3. Dictionary Service

Tests the dictionary lookup capabilities by:
- Looking up words in the dictionary
- Retrieving translations, parts of speech, and other metadata
- Handling unknown words gracefully

The dictionary contains sample data for common words and falls back to defaults for unknown words.

#### 4. Results Screen

Shows a sample quiz results screen with:
- Score display (3/5 correct)
- Result message based on score
- List of words covered with their translations
- Audio buttons for each word (which trigger the audio service)

You can close this screen using either the X button or the "Continue Browsing" button.

## Browser-Compatible Service Files

To support direct browser testing without extension APIs, browser-compatible versions of each service have been created:

- `js/services/audioService-browser.js`
- `js/services/spacedRepetition-browser.js`
- `js/services/dictionaryService-browser.js`

These files export their services to the global window object rather than using ES6 modules.

## Mock Implementation Notes

The mock implementations simulate the core functionality of each service:

- **Audio Service**: Simulates playing pronunciation with console logs
- **Spaced Repetition**: Implements a simplified version of the SM-2 algorithm
- **Dictionary Service**: Includes a small sample dictionary with common words

## Usage in Extension Development

Use these test files to:
1. Verify service functionality without loading the full extension
2. Test UI components in isolation
3. Debug issues with specific features
4. Demonstrate functionality to users or team members

When all features function correctly in the standalone test, they should also work in the actual extension.
