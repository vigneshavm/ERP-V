import { endpoints } from '../config/endpoints';
import { httpClient } from '../clients/httpClient';
import { AuthResponse, authResponseSchema } from '../types/auth';
import { z } from 'zod';

const loginPayloadSchema = z
  .object({
    username: z.string().optional(),
    identity: z.string().optional(),
    tenantId: z.string().optional(),
    password: z.string(),
  })
  .refine((val) => Boolean(val.username || val.identity), {
    message: 'username or identity is required',
    path: ['username'],
  });

export type LoginPayload = z.infer<typeof loginPayloadSchema>;

export const login = async (payload: LoginPayload): Promise<AuthResponse> => {
  const validated = loginPayloadSchema.parse(payload);
  const backendPayload = {
    email: validated.username || validated.identity,
    password: validated.password,
    tenantId: validated.tenantId,
  };
  const data = await httpClient.post<any>(endpoints.auth.login, backendPayload);

  // Transform flat backend response to nested frontend structure
  const transformedData = {
    token: data.token,
    user: {
      id: data._id,
      username: data.email, // Use email as username if missing
      email: data.email,
      name: data.name,
      role: data.role,
    },
  };

  return authResponseSchema.parse(transformedData);
};
