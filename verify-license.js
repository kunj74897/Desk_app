const LicenseManager = require('./license-manager');
const manager = new LicenseManager();

console.log('License Path:', manager.licensePath);
console.log('License exists:', require('fs').existsSync(manager.licensePath));
console.log('License valid:', manager.verifyLicense()); 