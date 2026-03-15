import { UseMutationOptions, useMutation } from '@tanstack/react-query';
import { B2BApiError } from '../clients/httpClient';
import { login, LoginPayload } from '../services/auth';
import { AuthResponse } from '../types/auth';

type LoginOptions = Omit<UseMutationOptions<AuthResponse, B2BApiError, LoginPayload, unknown>, 'mutationFn'>;

export const useAuthLogin = (options?: LoginOptions) =>
  useMutation<AuthResponse, B2BApiError, LoginPayload>({
    mutationFn: login,
    ...options,
  });
