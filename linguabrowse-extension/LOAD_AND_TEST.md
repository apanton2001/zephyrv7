# Loading and Testing LinguaBrowse Extension

## Loading the Extension in Chrome

1. Open Chrome and navigate to `chrome://extensions/`
2. Enable "Developer mode" by toggling the switch in the top-right corner
3. Click "Load unpacked" and select the `linguabrowse-extension` directory
4. The LinguaBrowse extension should now appear in your extensions list
5. Click the extension icon in the Chrome toolbar to open the popup interface

## Testing the Extension

### Basic Functionality Tests

1. **Test the popup interface**:
   - Click the LinguaBrowse icon in your toolbar
   - Navigate through the different tabs (Dashboard, Settings, Subscription, My Words)
   - Verify that the UI displays correctly

2. **Test the quiz overlay**:
   - Open the included test page:
     - Navigate to `file:///C:/Users/panto/Desktop/nextjs-app/linguabrowse-extension/test-page.html`
     - Or simply drag the test-page.html file into Chrome
   - Wait for a quiz to appear (this should happen automatically within a minute)
   - Test interaction with the quiz overlay
   - Click the "Simulate Scroll Event" button to potentially trigger another quiz

3. **Test streak counting**:
   - Answer at least one quiz 
   - Check the Dashboard to see if the streak counter has updated

### Advanced Testing

1. **Settings changes**:
   - In the Settings tab, change your target language 
   - Change the quiz frequency
   - Save the settings and verify they're applied

2. **Subscription simulation**:
   - Test the upgrade process by clicking "Upgrade Now" on the Dashboard
   - Choose a subscription tier and test the subscription flow

## Troubleshooting

If you encounter any issues:

1. Check the **Console** in Chrome Developer Tools (F12) for error messages
2. Ensure that all required files are present in the correct directories
3. Verify that the manifest.json is correctly formatted
4. Try reloading the extension: click the refresh icon on the extension card in chrome://extensions

## Extension Structure

- `manifest.json`: Extension configuration
- `background.js`: Background service worker script
- `content.js`: Content script injected into webpages
- `popup.html` & `js/popup.js`: Extension popup interface
- `styles/overlay.css`: Styling for quiz overlays
- `images/`: Directory containing icon files
- `test-page.html`: Sample page for testing
