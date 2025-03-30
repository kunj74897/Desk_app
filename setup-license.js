const LicenseManager = require('./license-manager');
const fs = require('fs');
const manager = new LicenseManager();

try {
    console.log('Creating license for Machine ID:', manager.machineId);
    console.log('License will be saved to:', manager.licensePath);
    
    const license = manager.generateLicense();
    manager.saveLicense(license);
    
    // Verify the file was created
    const exists = fs.existsSync(manager.licensePath);
    console.log('License file created:', exists);
    
    if (exists) {
        const content = fs.readFileSync(manager.licensePath, 'utf8');
        console.log('License content exists:', content.length > 0);
    }
    
    console.log('Verifying license:', manager.verifyLicense());
} catch (error) {
    console.error('Error:', error.message);
    console.error(error.stack);
} 