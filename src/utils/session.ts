
import * as CryptoJS from 'crypto-js';

const SESSION_KEY = 'erp_session';
const SECRET_KEY = import.meta.env.VITE_APP_SECRET || 'default-insecure-secret-key-change-me';

export const setSession = (user: any, remember: boolean) => {
    try {
        // 1. Encrypt the User Object to make it opaque to casual scripts/viewing
        const jsonUser = JSON.stringify(user);
        const encrypted = CryptoJS.AES.encrypt(jsonUser, SECRET_KEY).toString();

        // 2. Determine Expiry
        let expires = '';
        if (remember) {
            const date = new Date();
            date.setTime(date.getTime() + (7 * 24 * 60 * 60 * 1000)); // 7 Days
            expires = `; expires=${date.toUTCString()}`;
        }

        // 3. Set Cookie via document.cookie
        // Note: HttpOnly cannot be set from client-side JS. 
        // We set Secure and SameSite=Strict to harden it as much as possible.
        const isSecure = window.location.protocol === 'https:';
        document.cookie = `${SESSION_KEY}=${encodeURIComponent(encrypted)}${expires}; path=/; SameSite=Strict${isSecure ? '; Secure' : ''}`;

        // Clear legacy localStorage if it exists
        localStorage.removeItem('erp_auth_user');
    } catch (e) {
        console.error("Failed to set secure session", e);
    }
};

export const getSession = (): any | null => {
    try {
        const nameEQ = SESSION_KEY + "=";
        const ca = document.cookie.split(';');
        for (let i = 0; i < ca.length; i++) {
            let c = ca[i];
            while (c.charAt(0) === ' ') c = c.substring(1, c.length);
            if (c.indexOf(nameEQ) === 0) {
                const encrypted = decodeURIComponent(c.substring(nameEQ.length, c.length));

                // Decrypt
                const bytes = CryptoJS.AES.decrypt(encrypted, SECRET_KEY);
                const originalText = bytes.toString(CryptoJS.enc.Utf8);

                if (!originalText) return null;
                return JSON.parse(originalText);
            }
        }
    } catch (e) {
        console.error("Failed to restore secure session", e);
    }
    return null;
};

export const clearSession = () => {
    document.cookie = `${SESSION_KEY}=; Path=/; Expires=Thu, 01 Jan 1970 00:00:01 GMT;`;
    localStorage.removeItem('erp_auth_user');
};
