import { QueryKey, UseQueryOptions, useQuery } from '@tanstack/react-query';
import { fetchOrderById, fetchOrders } from '../services/orders';
import { Order } from '../types/order';
import { B2BApiError } from '../clients/httpClient';

type OrdersQueryOptions = Omit<
  UseQueryOptions<Order[], B2BApiError, Order[], QueryKey>,
  'queryKey' | 'queryFn'
>;

type OrderQueryOptions = Omit<
  UseQueryOptions<Order, B2BApiError, Order, QueryKey>,
  'queryKey' | 'queryFn' | 'enabled'
>;

export const useOrders = (options?: OrdersQueryOptions) =>
  useQuery<Order[], B2BApiError>({
    queryKey: ['b2b', 'orders'],
    queryFn: fetchOrders,
    ...options,
  });

export const useOrder = (id: string | undefined, options?: OrderQueryOptions) =>
  useQuery<Order, B2BApiError>({
    queryKey: ['b2b', 'orders', id],
    queryFn: () => fetchOrderById(id as string),
    enabled: Boolean(id),
    ...options,
  });
