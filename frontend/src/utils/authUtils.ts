/**
 * Centralized authentication utilities
 */

/**
 * Validates password strength based on BizzAI criteria:
 * - Minimum 8 characters
 * - Uppercase letter
 * - Lowercase letter
 * - Number
 * - Special symbol
 */
export const isStrongPassword = (password: string): boolean => {
    if (!password || password.length < 8) return false;
    const hasUpper = /[A-Z]/.test(password);
    const hasLower = /[a-z]/.test(password);
    const hasNumber = /\d/.test(password);
    const hasSymbol = /[^A-Za-z0-9]/.test(password);
    return hasUpper && hasLower && hasNumber && hasSymbol;
};

/**
 * Validates if the phone number is exactly 10 digits
 */
export const isValidPhone = (value: string): boolean => /^\d{10}$/.test(value);

/**
 * Formats phone input to only allow digits and limit to 10 characters
 */
export const formatPhoneInput = (value: string): string => {
    return value.replace(/\D/g, "").slice(0, 10);
};
