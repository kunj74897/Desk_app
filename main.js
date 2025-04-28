// main.js (Electron Main Process)
const { app, BrowserWindow, ipcMain } = require('electron')
const path = require('path')
const Store = require('electron-store')
const verifyLicense = require('./verify-license')
const crypto = require('crypto')

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
    store.set('credentials', DEFAULT_CREDENTIALS)
}

let mainWindow

function createWindow() {
    mainWindow = new BrowserWindow({
        width: 1200,
        height: 800,
        webPreferences: {
            nodeIntegration: true,
            contextIsolation: false
        }
    })

    mainWindow.loadFile('index.html')
}

app.whenReady().then(() => {
    // Verify license before creating window
    if (!verifyLicense()) {
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
    try {
        const storedCredentials = store.get('credentials');
        
        const isUsernameMatch = username === storedCredentials.username;
        const isPasswordMatch = passwordManager.verifyPassword(password, storedCredentials.password);
        
        if (isUsernameMatch && isPasswordMatch) {
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
        
        return { success: false, message: 'Invalid username or password' };
    } catch (error) {
        return { success: false, message: 'An error occurred during login' };
    }
})

// Handle password change
ipcMain.handle('change-password', async (event, { currentPassword, newPassword }) => {
    try {
        const storedCredentials = store.get('credentials');
        
        const isPasswordMatch = passwordManager.verifyPassword(currentPassword, storedCredentials.password);
        
        if (!isPasswordMatch) {
            return { success: false, message: 'Current password is incorrect' };
        }
        
        const newHashedPassword = passwordManager.hashPassword(newPassword);
        
        store.set('credentials', {
            ...storedCredentials,
            password: newHashedPassword
        });
        
        return { success: true, message: 'Password changed successfully' };
    } catch (error) {
        return { success: false, message: 'Failed to change password. Please try again.' };
    }
})

// Handle username change
ipcMain.handle('change-username', async (event, { currentPassword, newUsername }) => {
    try {
        const storedCredentials = store.get('credentials');
        
        const isPasswordMatch = passwordManager.verifyPassword(currentPassword, storedCredentials.password);
        
        if (!isPasswordMatch) {
            return { success: false, message: 'Password is incorrect' };
        }
        
        store.set('credentials', {
            ...storedCredentials,
            username: newUsername
        });
        
        return { success: true, message: 'Username changed successfully' };
    } catch (error) {
        return { success: false, message: 'Failed to change username. Please try again.' };
    }
})