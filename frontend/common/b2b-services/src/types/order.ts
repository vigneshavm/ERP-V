import { z } from 'zod';

export const orderItemSchema = z.object({
  sku: z.string(),
  name: z.string(),
  quantity: z.number().int().positive(),
  price: z.number().nonnegative(),
  currency: z.string().default('USD'),
});

export const orderSchema = z.object({
  id: z.string(),
  partnerId: z.string(),
  status: z.enum(['draft', 'confirmed', 'shipped', 'cancelled']),
  total: z.number().nonnegative(),
  currency: z.string().default('USD'),
  createdAt: z.string(),
  updatedAt: z.string(),
  items: z.array(orderItemSchema),
});

export const ordersSchema = z.array(orderSchema);

export type Order = z.infer<typeof orderSchema>;
export type OrderItem = z.infer<typeof orderItemSchema>;
