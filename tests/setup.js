// Test setup file
const fs = require('fs');
const path = require('path');

// Clean up test data files before each test suite
beforeEach(() => {
    const testDataPath = path.join(__dirname, '..', 'lib', 'data.json');
    if (fs.existsSync(testDataPath)) {
        try {
            fs.unlinkSync(testDataPath);
        } catch (error) {
            // Ignore errors if file doesn't exist or can't be deleted
        }
    }
});

// Global test timeout
jest.setTimeout(10000);
