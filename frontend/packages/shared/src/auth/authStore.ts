import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { eventBus, EventType } from '../events';

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

export interface User {
  id: string;
  username: string;
  email: string;
  name: string;
  role: string;
  [key: string]: any; // Allow extensibility across different modules
}

export interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  setAuth: (user: User, token: string) => void;
  updateUser: (updates: Partial<User>) => void;
  logout: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      token: null,
      isAuthenticated: false,
      setAuth: (user, token) => {
        set({ user, token, isAuthenticated: true });
        
        // Legacy support for older apps expecting plain localStorage items
        if (typeof window !== 'undefined') {
          localStorage.setItem('user', JSON.stringify(user));
          localStorage.setItem('token', token);
          setCookie('auth_token', token, 7);
        }

        // Broadcast auth change to other MFEs
        eventBus.publish(EventType.AUTH_UPDATED, {
          isAuthenticated: true,
          user,
          token,
        });
      },
      updateUser: (updates) => {
        const currentUser = get().user;
        if (currentUser) {
          const updatedUser = { ...currentUser, ...updates };
          set({ user: updatedUser });
          
          if (typeof window !== 'undefined') {
            localStorage.setItem('user', JSON.stringify(updatedUser));
          }
        }
      },
      logout: () => {
        set({ user: null, token: null, isAuthenticated: false });
        
        if (typeof window !== 'undefined') {
          // Legacy support removal
          localStorage.removeItem('user');
          localStorage.removeItem('token');
          removeCookie('auth_token');
        }

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
      // Ensure we only use localStorage if window is defined (SSR safety)
      storage: createJSONStorage(() => typeof window !== 'undefined' ? localStorage : {
        getItem: () => null,
        setItem: () => {},
        removeItem: () => {},
      } as any),
    }
  )
);
