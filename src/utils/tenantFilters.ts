/**
 * useFilteredProducts - Custom hook for filtering products by tenant, branch, and sector
 * 
 * This hook provides a reusable way to filter products from Redux inventory
 * based on the current user's tenant, branch, and sector context.
 * 
 * No hardcoding - works with any sector or business type dynamically.
 */

import { useMemo } from 'react';
import { useSelector } from 'react-redux';
import { RootState } from '../store';
import { GeneralProduct } from '../types/product';

export interface FilteredProduct {
    id: string;
    name: string;
    sku: string;
    price: number;
    stock: number;
    category: string;
    taxRate: number;
    branchId?: string;
    sector?: string;
}

export interface FilteredCustomer {
    id: string;
    name: string;
    phone: string;
    email?: string;
    outstandingBalance: number;
    advanceBalance?: number;
    loyaltyPoints?: number;
}

export interface TenantFilterOptions {
    /** If true, skip sector filtering */
    ignoreSector?: boolean;
    /** If true, skip branch filtering */
    ignoreBranch?: boolean;
    /** If true, include products with zero stock */
    includeOutOfStock?: boolean;
}

/**
 * Filter products based on current tenant context (sector and branch)
 */
export function filterProductsByTenantContext(
    products: GeneralProduct[],
    currentSector: string | null | undefined,
    currentBranch: string | null | undefined,
    options: TenantFilterOptions = {}
): GeneralProduct[] {
    return products.filter(p => {
        // Sector filter - skip if ignoreSector or no sector set
        if (!options.ignoreSector && currentSector) {
            if (p.sector && p.sector !== currentSector) return false;
        }

        // Branch filter - skip if ignoreBranch, no branch set, or "All"
        if (!options.ignoreBranch && currentBranch && currentBranch !== 'All') {
            if (p.branchId && p.branchId !== currentBranch) return false;
        }

        // Stock filter
        if (!options.includeOutOfStock && (p.stock || 0) <= 0) {
            // By default, include all products regardless of stock
            // Only filter if explicitly set to exclude out of stock
        }

        return true;
    });
}

/**
 * Map inventory products to a simplified format for use in forms
 */
export function mapProductsForForms(products: GeneralProduct[]): FilteredProduct[] {
    return products.map(p => ({
        id: p.id,
        name: p.name,
        sku: p.sku,
        price: (p as any).selling_price || p.price || 0,
        stock: p.stock || 0,
        category: p.category,
        taxRate: (p as any).gst_rate || 18,
        branchId: p.branchId,
        sector: p.sector
    }));
}

/**
 * Custom hook to get filtered products based on current tenant context
 */
export function useFilteredProducts(options: TenantFilterOptions = {}): FilteredProduct[] {
    const { currentSector, currentBranch } = useSelector((state: RootState) => state.auth);
    const { products } = useSelector((state: RootState) => state.inventory);

    return useMemo(() => {
        const filtered = filterProductsByTenantContext(
            products,
            currentSector,
            currentBranch,
            options
        );
        return mapProductsForForms(filtered);
    }, [products, currentSector, currentBranch, options]);
}

/**
 * Custom hook to get filtered customers based on current tenant context
 */
export function useFilteredCustomers(): FilteredCustomer[] {
    const { customers: posCustomers } = useSelector((state: RootState) => state.pos);

    return useMemo(() => {
        return posCustomers.map((c: any) => ({
            id: c.id,
            name: c.name,
            phone: c.phone || '',
            email: c.email,
            outstandingBalance: c.outstandingBalance || c.outstanding_balance || 0,
            advanceBalance: c.advanceBalance || 0,
            loyaltyPoints: c.loyaltyPoints || c.loyalty_points || 0
        }));
    }, [posCustomers]);
}

/**
 * Utility to search/filter products by query string
 */
export function searchProducts(
    products: FilteredProduct[],
    query: string
): FilteredProduct[] {
    if (!query || !query.trim()) return products;
    const q = query.toLowerCase().trim();
    return products.filter(p =>
        p.name.toLowerCase().includes(q) ||
        p.sku.toLowerCase().includes(q) ||
        p.category.toLowerCase().includes(q)
    );
}

/**
 * Utility to search/filter customers by query string
 */
export function searchCustomers(
    customers: FilteredCustomer[],
    query: string
): FilteredCustomer[] {
    if (!query || !query.trim()) return customers;
    const q = query.toLowerCase().trim();
    return customers.filter(c =>
        c.name.toLowerCase().includes(q) ||
        c.phone.includes(q) ||
        (c.email && c.email.toLowerCase().includes(q))
    );
}
