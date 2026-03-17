import { IDataAdapter } from './IDataAdapter';
import { ApiAdapter } from './ApiAdapter';

/**
 * Single contact point for the data layer.
 * Set to ApiAdapter for real API calls (including backend mocks).
 * Set to MockAdapter for pure client-side simulation.
 */

export const dataAdapter: IDataAdapter = ApiAdapter;

export * from './types';
export * from './IDataAdapter';
export * from './utils/mapping';
