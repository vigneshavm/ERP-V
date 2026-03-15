import { QueryKey, UseQueryOptions, useQuery } from '@tanstack/react-query';
import { fetchProductBySku, fetchProducts } from '../services/catalog';
import { Product } from '../types/catalog';
import { B2BApiError } from '../clients/httpClient';

type ProductsQueryOptions = Omit<
  UseQueryOptions<Product[], B2BApiError, Product[], QueryKey>,
  'queryKey' | 'queryFn'
>;

type ProductQueryOptions = Omit<
  UseQueryOptions<Product, B2BApiError, Product, QueryKey>,
  'queryKey' | 'queryFn' | 'enabled'
>;

export const useProducts = (options?: ProductsQueryOptions) =>
  useQuery<Product[], B2BApiError>({
    queryKey: ['b2b', 'products'],
    queryFn: fetchProducts,
    ...options,
  });

export const useProduct = (sku: string | undefined, options?: ProductQueryOptions) =>
  useQuery<Product, B2BApiError>({
    queryKey: ['b2b', 'products', sku],
    queryFn: () => fetchProductBySku(sku as string),
    enabled: Boolean(sku),
    ...options,
  });
