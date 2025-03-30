const { machineIdSync } = require('node-machine-id');
const CryptoJS = require('crypto-js');
const fs = require('fs');
const path = require('path');

class LicenseManager {
    constructor() {
        this.machineId = machineIdSync();
        
        // Handle both Windows and Unix paths
        if (process.platform === 'win32') {
            this.licensePath = path.join(process.env.APPDATA, '.my-electron-app', 'license.dat');
        } else {
            this.licensePath = path.join(process.env.HOME, '.my-electron-app', 'license.dat');
        }
    }

    generateLicense() {
        const licenseData = {
            machineId: this.machineId,
            timestamp: Date.now()
        };
        const encrypted = CryptoJS.AES.encrypt(JSON.stringify(licenseData), 'vraj12345').toString();
        return encrypted;
    }

    saveLicense(license) {
        fs.mkdirSync(path.dirname(this.licensePath), { recursive: true });
        fs.writeFileSync(this.licensePath, license);
    }

    verifyLicense() {
        try {
            if (!fs.existsSync(this.licensePath)) {
                return false;
            }

            const license = fs.readFileSync(this.licensePath, 'utf8');
            const decrypted = CryptoJS.AES.decrypt(license, 'vraj12345').toString(CryptoJS.enc.Utf8);
            const licenseData = JSON.parse(decrypted);

            return licenseData.machineId === this.machineId;
        } catch (error) {
            return false;
        }
    }
}

module.exports = LicenseManager; 