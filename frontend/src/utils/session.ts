/**
 * Session management utilities
 */

/**
 * Sets the user session in local storage.
 * @param user The user object to store
 * @param tokenOrPersist Optional token string or boolean flag.
 */
export const setSession = (user: any, tokenOrPersist?: string | boolean) => {
    const userToStore = { ...user };

    if (typeof tokenOrPersist === 'string') {
        userToStore.token = tokenOrPersist;
    }

    localStorage.setItem('user', JSON.stringify(userToStore));

    // Set authenticated flag if we have a valid session setup
    if (tokenOrPersist) {
        localStorage.setItem('isAuthenticated', 'true');
    }

    // Ensure erp_current_tenant is consistent if user has tenantId
    if (userToStore.tenantId) {
        localStorage.setItem('erp_current_tenant', userToStore.tenantId);
    }
};

/**
 * Clears the user session and relevant local storage keys.
 */
export const clearSession = () => {
    localStorage.removeItem('user');
    localStorage.removeItem('returnDraft');
    localStorage.removeItem('erp_current_tenant');
    localStorage.removeItem('isAuthenticated');
};

/**
 * Gets the current user session from local storage.
 */
export const getSession = (): any | null => {
    const userStr = localStorage.getItem('user');
    if (userStr) {
        try {
            return JSON.parse(userStr);
        } catch (e) {
            console.error("Failed to parse user session", e);
            return null;
        }
    }
    return null;
};
