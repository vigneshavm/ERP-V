import { z } from 'zod';

export const productSchema = z.object({
  sku: z.string(),
  name: z.string(),
  description: z.string().optional(),
  price: z.number().nonnegative(),
  currency: z.string().default('USD'),
  available: z.boolean().default(true),
  categories: z.array(z.string()).optional(),
});

export const productsSchema = z.array(productSchema);

export type Product = z.infer<typeof productSchema>;
