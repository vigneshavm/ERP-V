import { QueryKey, UseQueryOptions, useQuery } from '@tanstack/react-query';
import { fetchPartners } from '../services/partners';
import { Partner } from '../types/partner';
import { B2BApiError } from '../clients/httpClient';

type PartnersQueryOptions = Omit<
  UseQueryOptions<Partner[], B2BApiError, Partner[], QueryKey>,
  'queryKey' | 'queryFn'
>;

export const usePartners = (options?: PartnersQueryOptions) =>
  useQuery<Partner[], B2BApiError>({
    queryKey: ['b2b', 'partners'],
    queryFn: fetchPartners,
    ...options,
  });
