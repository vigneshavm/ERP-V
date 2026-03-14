import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { eventBus, EventType } from '@repo/shared';

/**
 * Utility to set/remove cookies in a client-side environment.
 * Next.js middleware needs these cookies to validate requests.
 */
const setCookie = (name: string, value: string, days?: number) => {
  let expires = "";
  if (days) {
    const date = new Date();
    date.setTime(date.now() + days * 24 * 60 * 60 * 1000);
    expires = "; expires=" + date.toUTCString();
  }
  document.cookie = name + "=" + (value || "") + expires + "; path=/; samesite=lax";
};

const removeCookie = (name: string) => {
  document.cookie = name + "=; Path=/; Expires=Thu, 01 Jan 1970 00:00:01 GMT;";
};

interface User {
  id: string;
  username: string;
  email: string;
  name: string;
  role: string;
}

interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  setAuth: (user: User, token: string) => void;
  logout: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      token: null,
      isAuthenticated: false,
      setAuth: (user, token) => {
        set({ user, token, isAuthenticated: true });
        // Legacy support for other MFEs
        localStorage.setItem('user', JSON.stringify(user));
        localStorage.setItem('token', token);
        
        // Sync token to cookie for Shell Middleware
        setCookie('auth_token', token, 7);

        // Broadcast auth change to other MFEs
        eventBus.publish(EventType.AUTH_UPDATED, {
          isAuthenticated: true,
          user,
          token,
        });
      },
      logout: () => {
        set({ user: null, token: null, isAuthenticated: false });
        // Legacy support for other MFEs
        localStorage.removeItem('user');
        localStorage.removeItem('token');
        
        // Clear cookie for Shell Middleware
        removeCookie('auth_token');

        // Broadcast auth change to other MFEs
        eventBus.publish(EventType.AUTH_UPDATED, {
          isAuthenticated: false,
          user: null,
          token: null,
        });
      },
    }),
    {
      name: 'auth-storage',
      storage: createJSONStorage(() => localStorage),
    }
  )
);
