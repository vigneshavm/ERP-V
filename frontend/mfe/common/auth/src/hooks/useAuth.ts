import { useAuthStore } from '../store/authStore';
import { useLogin, useLogout } from '../api/authApi';

/**
 * Ergonomic hook for authentication logic
 */
export const useAuth = () => {
  const { user, isAuthenticated, token } = useAuthStore();
  const loginMutation = useLogin();
  const logout = useLogout();

  return {
    user,
    isAuthenticated,
    token,
    login: loginMutation.mutate,
    isLoggingIn: loginMutation.isPending,
    loginError: loginMutation.error,
    logout,
  };
};
