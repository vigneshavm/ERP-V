import { useAuthLogin } from '@repo/b2b-services';
import { useAuthStore, AuthState } from '../store/authStore';

export const useLogin = () => {
  const setAuth = useAuthStore((state: AuthState) => state.setAuth);

  return useAuthLogin({
    onSuccess: (data, variables, context) => {
      setAuth(data.user as any, data.token);
    },
  });
};

export const useLogout = () => {
  const logout = useAuthStore((state: AuthState) => state.logout);
  return () => logout();
};
