import { IDataAdapter } from './IDataAdapter';
import { MockAdapter } from './MockAdapter';

/**
 * Single contact point for the data layer.
 * To swap to a real DB, create a DBAdapter implementing IDataAdapter 
 * and change the export below.
 */

// export const dataAdapter: IDataAdapter = new DBAdapter(); // For production
export const dataAdapter: IDataAdapter = MockAdapter;

export * from './types';
export * from './IDataAdapter';
export * from './utils/mapping';
