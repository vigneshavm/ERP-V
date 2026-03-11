import { useMutation } from '@tanstack/react-query';
import { useAuthStore } from '../store/authStore';

const loginApi = async (credentials: any) => {
  const response = await fetch('/api/auth/login', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ email: credentials.username, password: credentials.password }),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.message || 'Invalid credentials');
  }

  const data = await response.json();
  return {
    user: data,
    token: data.token,
  };
};

export const useLogin = () => {
  const setAuth = useAuthStore((state) => state.setAuth);

  return useMutation({
    mutationFn: loginApi,
    onSuccess: (data) => {
      setAuth(data.user, data.token);
    },
  });
};

export const useLogout = () => {
  const logout = useAuthStore((state) => state.logout);
  return () => logout();
};
