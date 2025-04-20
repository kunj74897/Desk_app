const LicenseManager = require('./license-manager');
const readline = require('readline');

const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
});

async function setupLicense() {
    const licenseManager = new LicenseManager();
    
    console.log('Aadhar App License Setup');
    console.log('=======================');
    
    // Get hardware ID
    const hardwareId = licenseManager.getHardwareId();
    console.log(`Hardware ID: ${hardwareId}`);
    
    // Get expiration date
    const expirationDate = await new Promise((resolve) => {
        rl.question('Enter license expiration date (YYYY-MM-DD): ', (answer) => {
            resolve(answer);
        });
    });
    
    // Generate license
    const license = licenseManager.generateLicense(hardwareId, expirationDate);
    licenseManager.saveLicense(license);
    
    console.log('\nLicense generated and installed successfully!');
    console.log(`Expiration Date: ${expirationDate}`);
    
    rl.close();
}

setupLicense().catch(console.error); 