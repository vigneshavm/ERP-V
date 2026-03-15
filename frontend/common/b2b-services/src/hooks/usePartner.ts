import { QueryKey, UseQueryOptions, useQuery } from '@tanstack/react-query';
import { fetchPartnerById } from '../services/partners';
import { Partner } from '../types/partner';
import { B2BApiError } from '../clients/httpClient';

type PartnerQueryOptions = Omit<
  UseQueryOptions<Partner, B2BApiError, Partner, QueryKey>,
  'queryKey' | 'queryFn' | 'enabled'
>;

export const usePartner = (id: string | undefined, options?: PartnerQueryOptions) =>
  useQuery<Partner, B2BApiError>({
    queryKey: ['b2b', 'partner', id],
    queryFn: () => fetchPartnerById(id as string),
    enabled: Boolean(id),
    ...options,
  });
