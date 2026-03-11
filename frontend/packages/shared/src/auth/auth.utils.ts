/**
 * Utility functions for authentication state management across the monorepo.
 * These read from the 'auth-storage' key in localStorage, which is managed by the Auth MFE (zustand/persist).
 */

export interface AuthUser {
  id: string;
  username: string;
  email: string;
  name: string;
  role: string;
}

export interface AuthSession {
  state: {
    user: AuthUser | null;
    token: string | null;
    isAuthenticated: boolean;
  };
  version: number;
}

const AUTH_STORAGE_KEY = 'auth-storage';

/**
 * Retrieves the current authentication session from localStorage.
 */
export const getAuthSession = (): AuthSession | null => {
  if (typeof window === 'undefined') return null;

  try {
    const stored = localStorage.getItem(AUTH_STORAGE_KEY);
    if (!stored) return null;
    return JSON.parse(stored) as AuthSession;
  } catch (error) {
    console.error('Failed to parse auth session from localStorage:', error);
    return null;
  }
};

/**
 * Checks if the user is currently authenticated based on the stored session.
 */
export const isAuthenticated = (): boolean => {
  const session = getAuthSession();
  return !!(session?.state?.isAuthenticated && session?.state?.token);
};

/**
 * Returns the current authenticated user if available.
 */
export const getAuthenticatedUser = (): AuthUser | null => {
  const session = getAuthSession();
  return session?.state?.user || null;
};
