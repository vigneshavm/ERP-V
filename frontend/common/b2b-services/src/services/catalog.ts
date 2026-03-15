import { endpoints } from '../config/endpoints';
import { httpClient } from '../clients/httpClient';
import { Product, productSchema, productsSchema } from '../types/catalog';

export const fetchProducts = async (): Promise<Product[]> => {
  const data = await httpClient.get<unknown>(endpoints.catalog);
  return productsSchema.parse(data);
};

export const fetchProductBySku = async (sku: string): Promise<Product> => {
  const data = await httpClient.get<unknown>(endpoints.product(sku));
  return productSchema.parse(data);
};
