import { endpoints } from '../config/endpoints';
import { httpClient } from '../clients/httpClient';
import { Order, orderSchema, ordersSchema } from '../types/order';
import { z } from 'zod';

const createOrderPayloadSchema = z.object({
  partnerId: z.string(),
  items: z.array(
    z.object({
      sku: z.string(),
      quantity: z.number().int().positive(),
      price: z.number().nonnegative(),
      currency: z.string().optional(),
    })
  ),
  notes: z.string().optional(),
});

export type CreateOrderPayload = z.infer<typeof createOrderPayloadSchema>;

export const fetchOrders = async (): Promise<Order[]> => {
  const data = await httpClient.get<unknown>(endpoints.orders);
  return ordersSchema.parse(data);
};

export const fetchOrderById = async (id: string): Promise<Order> => {
  const data = await httpClient.get<unknown>(endpoints.order(id));
  return orderSchema.parse(data);
};

export const createOrder = async (payload: CreateOrderPayload): Promise<Order> => {
  const parsed = createOrderPayloadSchema.parse(payload);
  const data = await httpClient.post<unknown>(endpoints.orders, parsed);
  return orderSchema.parse(data);
};
