import { useAuthLogin } from '@repo/b2b-services';
import { useAuthStore } from '../store/authStore';

export const useLogin = () => {
  const setAuth = useAuthStore((state) => state.setAuth);

  return useAuthLogin({
    onSuccess: (data, variables, context) => {
      setAuth(data.user as any, data.token);
    },
  });
};

export const useLogout = () => {
  const logout = useAuthStore((state) => state.logout);
  return () => logout();
};
