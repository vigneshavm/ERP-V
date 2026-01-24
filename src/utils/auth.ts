import * as bcrypt from 'bcryptjs';
import * as CryptoJS from 'crypto-js';

// Configuration
const AUTH_MODE = import.meta.env.VITE_AUTH_MODE === 'ENCRYPTION' ? 'ENCRYPTION' : 'HASH'; // Default to HASH if not set
const SECRET_KEY = import.meta.env.VITE_APP_SECRET || 'default-insecure-secret-key-change-me';
const SALT_ROUNDS = Number(import.meta.env.VITE_BCRYPT_SALT_ROUNDS) || 10;

console.log(`[Auth] Initialized in ${AUTH_MODE} mode.`);

/**
 * Secures a password using the currently configured mode (Hash or Encryption).
 */
export const securePassword = async (plainText: string): Promise<string> => {
    if (AUTH_MODE === 'ENCRYPTION') {
        return new Promise((resolve) => {
            const encrypted = CryptoJS.AES.encrypt(plainText, SECRET_KEY).toString();
            resolve(`enc_${encrypted}`);
        });
    } else {
        // HASH mode (default)
        return bcrypt.hash(plainText, SALT_ROUNDS);
    }
};

/**
 * Smartly compares a plain text password against a stored value.
 * Auto-detects if the stored value is:
 * 1. AES Encrypted (starts with 'enc_')
 * 2. Bcrypt Hash (starts with '$2a$')
 * 3. Plain Text (Legacy)
 */
export const comparePassword = async (plainText: string, storedValue: string): Promise<boolean> => {
    if (!storedValue) return false;

    // 1. Check for Encryption
    if (storedValue.startsWith('enc_')) {
        try {
            const encrypted = storedValue.replace('enc_', '');
            const bytes = CryptoJS.AES.decrypt(encrypted, SECRET_KEY);
            const originalText = bytes.toString(CryptoJS.enc.Utf8);
            return originalText === plainText;
        } catch (e) {
            console.error("Decryption failed", e);
            return false;
        }
    }

    // 2. Check for Bcrypt Hash
    if (storedValue.startsWith('$2a$') || storedValue.startsWith('$2b$')) {
        return bcrypt.compare(plainText, storedValue);
    }

    // 3. Fallback to Plain Text
    return plainText === storedValue;
};

/**
 * Checks if the stored value matches the CURRENT configured security mode.
 * Used to determine if a user needs migration.
 */
export const isSecuredIdeally = (value: string): boolean => {
    if (!value) return false;
    if (AUTH_MODE === 'ENCRYPTION') {
        return value.startsWith('enc_');
    } else {
        // HASH mode
        return value.startsWith('$2a$') || value.startsWith('$2b$');
    }
};

// Legacy exports for compatibility during refactor, though we should move to securePassword
export const encryptPassword = securePassword;
export const hashPassword = securePassword;
export const isEncrypted = (val: string) => val.startsWith('enc_');
export const isHash = (val: string) => val.startsWith('$2a$') || val.startsWith('$2b$');
