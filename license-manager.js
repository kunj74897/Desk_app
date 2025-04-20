const crypto = require('crypto');
const fs = require('fs');
const path = require('path');
const os = require('os');

class LicenseManager {
    constructor() {
        this.licensePath = path.join(process.env.APPDATA || process.env.HOME, '.aadhar-app', 'license.dat');
        this.ensureLicenseDirectory();
    }

    ensureLicenseDirectory() {
        const dir = path.dirname(this.licensePath);
        if (!fs.existsSync(dir)) {
            fs.mkdirSync(dir, { recursive: true });
        }
    }

    getHardwareId() {
        const platform = os.platform();
        let hardwareId = '';
        
        if (platform === 'win32') {
            // Get Windows hardware ID
            const wmic = require('child_process').execSync('wmic csproduct get uuid').toString();
            hardwareId = wmic.split('\n')[1].trim();
        } else if (platform === 'darwin') {
            // Get Mac hardware ID
            const ioreg = require('child_process').execSync('ioreg -d2 -c IOPlatformExpertDevice').toString();
            hardwareId = ioreg.match(/"IOPlatformUUID" = "([^"]+)"/)[1];
        } else {
            // Get Linux hardware ID
            const dmidecode = require('child_process').execSync('sudo dmidecode -s system-uuid').toString();
            hardwareId = dmidecode.trim();
        }
        
        return crypto.createHash('sha256').update(hardwareId).digest('hex');
    }

    generateLicense(hardwareId, expirationDate) {
        const licenseData = {
            hardwareId,
            expirationDate,
            timestamp: Date.now()
        };
        
        const signature = this.signLicense(licenseData);
        return {
            ...licenseData,
            signature
        };
    }

    signLicense(licenseData) {
        const privateKey = process.env.LICENSE_PRIVATE_KEY || 'your-secure-private-key';
        const data = JSON.stringify(licenseData);
        return crypto.createHmac('sha256', privateKey).update(data).digest('hex');
    }

    verifyLicense(license) {
        if (!license || !license.signature) return false;
        
        const { signature, ...licenseData } = license;
        const expectedSignature = this.signLicense(licenseData);
        
        if (signature !== expectedSignature) return false;
        if (licenseData.hardwareId !== this.getHardwareId()) return false;
        if (new Date(licenseData.expirationDate) < new Date()) return false;
        
        return true;
    }

    saveLicense(license) {
        const encryptedLicense = this.encryptLicense(license);
        fs.writeFileSync(this.licensePath, encryptedLicense);
    }

    loadLicense() {
        if (!fs.existsSync(this.licensePath)) return null;
        
        const encryptedLicense = fs.readFileSync(this.licensePath, 'utf8');
        return this.decryptLicense(encryptedLicense);
    }

    encryptLicense(license) {
        const key = crypto.scryptSync(process.env.LICENSE_ENCRYPTION_KEY || 'your-encryption-key', 'salt', 32);
        const iv = crypto.randomBytes(16);
        const cipher = crypto.createCipheriv('aes-256-cbc', key, iv);
        
        let encrypted = cipher.update(JSON.stringify(license), 'utf8', 'hex');
        encrypted += cipher.final('hex');
        
        return iv.toString('hex') + ':' + encrypted;
    }

    decryptLicense(encryptedData) {
        try {
            const [ivHex, encrypted] = encryptedData.split(':');
            const key = crypto.scryptSync(process.env.LICENSE_ENCRYPTION_KEY || 'your-encryption-key', 'salt', 32);
            const iv = Buffer.from(ivHex, 'hex');
            
            const decipher = crypto.createDecipheriv('aes-256-cbc', key, iv);
            let decrypted = decipher.update(encrypted, 'hex', 'utf8');
            decrypted += decipher.final('utf8');
            
            return JSON.parse(decrypted);
        } catch (error) {
            return null;
        }
    }
}

module.exports = LicenseManager; 