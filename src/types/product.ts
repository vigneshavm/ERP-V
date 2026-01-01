export * from './product/index';
// Re-export specific types if needed for backward compatibility
import { Product } from './product/index';
export type { Product };
export interface InventoryState {
    products: Product[];
}
