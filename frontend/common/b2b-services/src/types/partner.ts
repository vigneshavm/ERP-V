import { z } from 'zod';

export const partnerSchema = z.object({
  id: z.string(),
  name: z.string(),
  status: z.enum(['active', 'inactive']),
  contactEmail: z.string().email().optional(),
  contactPhone: z.string().optional(),
  createdAt: z.string(),
  updatedAt: z.string(),
});

export const partnersSchema = z.array(partnerSchema);

export type Partner = z.infer<typeof partnerSchema>;
