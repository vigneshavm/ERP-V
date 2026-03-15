import { endpoints } from '../config/endpoints';
import { httpClient } from '../clients/httpClient';
import { Partner, partnerSchema, partnersSchema } from '../types/partner';

export const fetchPartners = async (): Promise<Partner[]> => {
  const data = await httpClient.get<unknown>(endpoints.partners);
  return partnersSchema.parse(data);
};

export const fetchPartnerById = async (id: string): Promise<Partner> => {
  const data = await httpClient.get<unknown>(endpoints.partner(id));
  return partnerSchema.parse(data);
};
