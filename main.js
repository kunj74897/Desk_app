// main.js (Electron Main Process)
const { app, BrowserWindow, ipcMain } = require('electron')
const path = require('path')
const Store = require('electron-store')
const verifyLicense = require('./verify-license')
const crypto = require('crypto')

// Enable more detailed logging
console.log('Main process starting...');

const store = new Store({
    encryptionKey: 'your-secure-encryption-key'
})

// Secure password management
class PasswordManager {
    constructor() {
        this.salt = 'your-secure-salt' // In production, use a unique salt per user
    }

    hashPassword(password) {
        return crypto.pbkdf2Sync(password, this.salt, 10000, 64, 'sha512').toString('hex')
    }

    verifyPassword(password, hashedPassword) {
        return this.hashPassword(password) === hashedPassword
    }
}

const passwordManager = new PasswordManager()

// Default admin credentials (hashed)
const DEFAULT_CREDENTIALS = {
    username: 'admin',
    password: passwordManager.hashPassword('admin123')
}

// Initialize credentials if not exists
if (!store.get('credentials')) {
    console.log('Setting default credentials');
    store.set('credentials', DEFAULT_CREDENTIALS)
} else {
    console.log('Credentials already exist in store');
}

let mainWindow

function createWindow() {
    console.log('Creating main window');
    mainWindow = new BrowserWindow({
        width: 1200,
        height: 800,
        webPreferences: {
            nodeIntegration: true,
            contextIsolation: false
        }
    })

    mainWindow.loadFile('index.html')
    
    // Open DevTools for debugging
    mainWindow.webContents.openDevTools();
    
    // Log navigation events
    mainWindow.webContents.on('did-navigate', (event, url) => {
        console.log('Window navigated to:', url);
    });
}

app.whenReady().then(() => {
    console.log('App is ready');
    // Verify license before creating window
    if (!verifyLicense()) {
        console.log('License verification failed, quitting');
        app.quit()
        return
    }

    createWindow()

    app.on('activate', () => {
        if (BrowserWindow.getAllWindows().length === 0) {
            createWindow()
        }
    })
})

app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') {
        app.quit()
    }
})

// Handle login
ipcMain.handle('login', async (event, { username, password }) => {
    console.log('Login attempt:', username);
    
    try {
        const storedCredentials = store.get('credentials');
        console.log('Stored username:', storedCredentials.username);
        
        const isUsernameMatch = username === storedCredentials.username;
        const isPasswordMatch = passwordManager.verifyPassword(password, storedCredentials.password);
        
        console.log('Username match:', isUsernameMatch);
        console.log('Password match:', isPasswordMatch);
        
        if (isUsernameMatch && isPasswordMatch) {
            console.log('Login successful, redirecting to form page');
            
            // Return success first, then load the form page
            const result = { success: true, message: 'Login successful' };
            
            // Use timeout to allow the renderer to process the result first
            setTimeout(() => {
                if (mainWindow) {
                    mainWindow.loadFile('index.html', {
                        query: { page: 'form' }
                    });
                }
            }, 500);
            
            return result;
        }
        
        console.log('Login failed: invalid credentials');
        return { success: false, message: 'Invalid username or password' };
    } catch (error) {
        console.error('Login error:', error);
        return { success: false, message: 'An error occurred during login' };
    }
})

// Handle password change
ipcMain.handle('change-password', async (event, { currentPassword, newPassword }) => {
    console.log('Password change attempt');
    
    try {
        const storedCredentials = store.get('credentials');
        
        const isPasswordMatch = passwordManager.verifyPassword(currentPassword, storedCredentials.password);
        console.log('Current password match:', isPasswordMatch);
        
        if (!isPasswordMatch) {
            console.log('Password change failed: current password incorrect');
            return { success: false, message: 'Current password is incorrect' };
        }
        
        const newHashedPassword = passwordManager.hashPassword(newPassword);
        console.log('Updating password in store');
        
        store.set('credentials', {
            ...storedCredentials,
            password: newHashedPassword
        });
        
        console.log('Password changed successfully');
        return { success: true, message: 'Password changed successfully' };
    } catch (error) {
        console.error('Error changing password:', error);
        return { success: false, message: 'Failed to change password. Please try again.' };
    }
})