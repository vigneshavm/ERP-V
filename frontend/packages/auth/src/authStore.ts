import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { eventBus } from '../events/eventBus';
import { EventType } from '../events/eventTypes';

/**
 * Utility to set/remove cookies in a client-side environment.
 * Next.js middleware needs these cookies to validate requests.
 */
const setCookie = (name: string, value: string, days?: number) => {
  if (typeof document === 'undefined') return;
  let expires = "";
  if (days) {
    const date = new Date();
    date.setTime(Date.now() + days * 24 * 60 * 60 * 1000);

    expires = "; expires=" + date.toUTCString();
  }
  document.cookie = name + "=" + (value || "") + expires + "; path=/; samesite=lax";
};

const removeCookie = (name: string) => {
  if (typeof document === 'undefined') return;
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
  role: string | null;
  currentSector: string | null;
  currentBranch: string | null;
  theme: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  isSuccess: boolean;
  isError: string | null;
  message: string | null;
  setAuth: (user: User, token: string) => void;
  updateUser: (updates: Partial<User>) => void;
  setContext: (sector: string, branch: string) => void;
  logout: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      token: null,
      role: null,
      currentSector: 'Retail',
      currentBranch: 'All',
      theme: 'light',
      isAuthenticated: false,
      isLoading: false,
      isSuccess: false,
      isError: null,
      message: null,
      setAuth: (user, token) => {
        set({ user, token, role: user.role, isAuthenticated: true });
        
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
          set({ user: updatedUser, role: updatedUser.role });
          
          if (typeof window !== 'undefined') {
            localStorage.setItem('user', JSON.stringify(updatedUser));
          }
        }
      },
      setContext: (sector, branch) => {
        set({ currentSector: sector, currentBranch: branch });
      },
      logout: () => {
        set({ user: null, token: null, role: null, isAuthenticated: false, currentSector: 'Retail', currentBranch: 'All', theme: 'light' });
        
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
      onRehydrateStorage: () => (state) => {
        // Subscribe to auth updates once hydrated
        const unsub = eventBus.subscribe(EventType.AUTH_UPDATED, (payload: any) => {
          if (payload.isAuthenticated !== state?.isAuthenticated) {

            // Update local state if it differs from broadcast
            // We use set() indirectly here via the store instance
            useAuthStore.setState({ 
              isAuthenticated: payload.isAuthenticated, 
              user: payload.user, 
              token: payload.token 
            });
          }
        });
        return unsub;
      },
      // Ensure we only use localStorage if window is defined (SSR safety)

      storage: createJSONStorage(() => typeof window !== 'undefined' ? localStorage : {
        getItem: () => null,
        setItem: () => {},
        removeItem: () => {},
      } as any),
    }
  )
);
