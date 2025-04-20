const LicenseManager = require('./license-manager');

function verifyLicense() {
    const licenseManager = new LicenseManager();
    const license = licenseManager.loadLicense();
    
    if (!license) {
        console.error('No license found. Please install a valid license.');
        process.exit(1);
    }
    
    const isValid = licenseManager.verifyLicense(license);
    
    if (!isValid) {
        console.error('Invalid or expired license. Please contact support.');
        process.exit(1);
    }
    
    console.log('License verified successfully!');
    return true;
}

module.exports = verifyLicense; 