import { z } from 'zod';

export const authUserSchema = z.object({
  id: z.string().optional(),
  username: z.string(),
  email: z.string().email(),
  name: z.string().optional(),
  role: z.string().optional(),
});

export const authResponseSchema = z.object({
  token: z.string(),
  user: authUserSchema,
});

export type AuthUser = z.infer<typeof authUserSchema>;
export type AuthResponse = z.infer<typeof authResponseSchema>;
