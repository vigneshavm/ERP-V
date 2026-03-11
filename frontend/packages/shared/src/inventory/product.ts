import { Product } from './index';
export type { Product };
export interface InventoryState {
    products: Product[];
    categories: string[];
    isHydrating: boolean;
    lastSync?: number;
}
