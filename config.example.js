// Google Sheets Configuration - Example File
// Copy this to config.js and update with your actual values
// To use this with your Google Sheet:
// 1. Go to Google Cloud Console (console.cloud.google.com)
// 2. Create a new project or select existing one
// 3. Enable the Google Sheets API
// 4. Create credentials (API Key for public sheets, or OAuth for private sheets)
// 5. Make your Google Sheet publicly viewable (for API key method)
// 6. Copy your sheet ID from the URL: https://docs.google.com/spreadsheets/d/SHEET_ID/edit
// 7. Update the configuration below

const GOOGLE_SHEETS_CONFIG = {
    // Replace with your Google Sheet ID
    SHEET_ID: 'YOUR_SHEET_ID_HERE',
    
    // Replace with your Google Sheets API key
    API_KEY: 'YOUR_API_KEY_HERE',
    
    // Sheet name and range (adjust as needed)
    SHEET_NAME: 'General',
    RANGE: 'A:J', // Reads all columns from A to J
    
    // Whether to use sample data instead of Google Sheets
    USE_SAMPLE_DATA: false
};

// Export configuration
if (typeof module !== 'undefined' && module.exports) {
    module.exports = GOOGLE_SHEETS_CONFIG;
} else {
    window.GOOGLE_SHEETS_CONFIG = GOOGLE_SHEETS_CONFIG;
}