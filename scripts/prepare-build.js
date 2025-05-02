const fs = require('fs-extra');
const path = require('path');

// Clean up previous build artifacts
console.log('Cleaning up previous build artifacts...');

// We don't need to clean python_api anymore since we're using the PyInstaller output directly

console.log('Build preparation completed');