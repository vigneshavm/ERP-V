import { UseMutationOptions, useMutation, useQueryClient } from '@tanstack/react-query';
import { B2BApiError } from '../clients/httpClient';
import { createOrder, CreateOrderPayload } from '../services/orders';
import { Order } from '../types/order';

type CreateOrderOptions = Omit<
  UseMutationOptions<Order, B2BApiError, CreateOrderPayload, unknown>,
  'mutationFn'
>;

export const useCreateOrder = (options?: CreateOrderOptions) => {
  const queryClient = useQueryClient();

  return useMutation<Order, B2BApiError, CreateOrderPayload>({
    mutationFn: createOrder,
    onSuccess: async (...args) => {
      await queryClient.invalidateQueries({ queryKey: ['b2b', 'orders'] });
      options?.onSuccess?.(...args);
    },
    ...options,
  });
};
