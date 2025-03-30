const LicenseManager = require('./license-manager');
const manager = new LicenseManager();

// Generate and save license
const license = manager.generateLicense();
manager.saveLicense(license);

// Verify license
console.log('License Valid:', manager.verifyLicense()); 