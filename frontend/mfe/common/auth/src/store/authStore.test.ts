import { describe, it, expect, beforeEach } from 'vitest';
import { useAuthStore } from '../store/authStore';

describe('AuthStore', () => {
  beforeEach(() => {
    useAuthStore.getState().logout();
  });

  it('should have initial state', () => {
    const state = useAuthStore.getState();
    expect(state.user).toBeNull();
    expect(state.isAuthenticated).toBe(false);
  });

  it('should login and set user', () => {
    const user = { id: '1', email: 'test@example.com', name: 'Test User', role: 'user' };
    const token = 'test-token';
    
    useAuthStore.getState().setAuth(user, token);
    
    const state = useAuthStore.getState();
    expect(state.user).toEqual(user);
    expect(state.token).toBe(token);
    expect(state.isAuthenticated).toBe(true);
  });

  it('should logout and clear state', () => {
    const user = { id: '1', email: 'test@example.com', name: 'Test User', role: 'user' };
    useAuthStore.getState().setAuth(user, 'token');
    
    useAuthStore.getState().logout();
    
    const state = useAuthStore.getState();
    expect(state.user).toBeNull();
    expect(state.isAuthenticated).toBe(false);
  });
});
