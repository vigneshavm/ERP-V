import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { InventoryVariantSearch } from './InventoryVariantSearch';

// Validates the Inventory Search & Filter requirement's frontend page. The previous version of
// this component fell back to hardcoded demo rows (getFallbackItems()) whenever the API call
// failed, and merged hardcoded default brand/size/color/shelf lists into the filter dropdowns
// unconditionally -- both violate "Don't store this as static frontend data" from the spec, and
// worse, would show an Inventory Manager fabricated stock numbers indistinguishable from real
// ones during an actual outage. These tests lock in the fix: real API-driven data only, and a
// visible error state (never invented rows) when the API fails.

vi.mock('../../services/api', () => ({
    default: {
        get: vi.fn(),
    },
}));

import api from '../../services/api';

function mockApiResponses({ inventory, filters }: { inventory?: any; filters?: any } = {}) {
    (api.get as any).mockImplementation((url: string) => {
        if (url === '/api/inventory/filters') {
            if (filters?.reject) return Promise.reject(filters.reject);
            return Promise.resolve({ data: { success: true, data: filters?.data ?? { brands: [], sizes: [], colors: [], shelves: [] } } });
        }
        if (url === '/api/inventory') {
            if (inventory?.reject) return Promise.reject(inventory.reject);
            return Promise.resolve({ data: { items: inventory?.items ?? [], pagination: { total: (inventory?.items ?? []).length } } });
        }
        return Promise.reject(new Error(`Unexpected URL: ${url}`));
    });
}

describe('InventoryVariantSearch', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('INV-SRCH-FE-001: loads real filter options and inventory from the API on mount, with no hardcoded brand/size/color/shelf defaults', async () => {
        mockApiResponses({
            filters: { data: { brands: ['Peter England'], sizes: ['M'], colors: ['Blue'], shelves: [{ shelfCode: 'A-03', shelfType: 'FULL' }] } },
            inventory: { items: [{ _id: '1', name: 'Cotton Formal Shirt', sku: 'SHIRT-PE-BLU-M', brand: 'Peter England', size: 'M', color: 'Blue', shelfCode: 'A-03', shelfType: 'FULL', stockQty: 24, availableQuantity: 24 }] },
        });

        render(<InventoryVariantSearch embedded />);

        await waitFor(() => expect(screen.getByText('Cotton Formal Shirt')).toBeInTheDocument());
        expect(api.get).toHaveBeenCalledWith('/api/inventory/filters');
        expect(screen.getByRole('option', { name: 'Peter England' })).toBeInTheDocument();
        // Never present unless the server actually returned it as an option
        expect(screen.queryByRole('option', { name: 'Allen Solly' })).not.toBeInTheDocument();
        expect(screen.getByText('24')).toBeInTheDocument();
    });

    it('INV-SRCH-FE-002: an API failure shows a real error state, never fabricated fallback rows', async () => {
        mockApiResponses({
            filters: { data: { brands: [], sizes: [], colors: [], shelves: [] } },
            inventory: { reject: { message: 'Network Error' } },
        });

        render(<InventoryVariantSearch embedded />);

        await waitFor(() => expect(screen.getByText(/Couldn't load inventory/i)).toBeInTheDocument());
        // The old implementation would show "Cotton Formal Shirt" / qty 24 here from getFallbackItems()
        expect(screen.queryByText('Cotton Formal Shirt')).not.toBeInTheDocument();
        expect(screen.queryByText('Peter England')).not.toBeInTheDocument();
    });

    it('INV-SRCH-FE-003: a genuinely empty result set shows "No matching inventory found", not an error', async () => {
        mockApiResponses({ filters: { data: { brands: [], sizes: [], colors: [], shelves: [] } }, inventory: { items: [] } });

        render(<InventoryVariantSearch embedded />);

        await waitFor(() => expect(screen.getByText('No matching inventory found')).toBeInTheDocument());
        expect(screen.queryByText(/Couldn't load inventory/i)).not.toBeInTheDocument();
    });

    it('INV-SRCH-FE-004: submitting the search form sends the selected Brand/Size/Color/Shelf/ShelfType filters to the API', async () => {
        mockApiResponses({
            filters: { data: { brands: ['Peter England', 'Allen Solly'], sizes: ['M'], colors: ['Blue'], shelves: [{ shelfCode: 'A-03', shelfType: 'FULL' }, { shelfCode: 'A-04', shelfType: 'HALF' }] } },
            inventory: { items: [] },
        });

        render(<InventoryVariantSearch embedded />);
        await waitFor(() => expect(api.get).toHaveBeenCalledWith('/api/inventory/filters'));

        fireEvent.change(screen.getByPlaceholderText(/Search by Product Name/i), { target: { value: 'Shirt' } });
        fireEvent.change(screen.getByDisplayValue('All Brands'), { target: { value: 'Peter England' } });
        fireEvent.change(screen.getByDisplayValue('All Shelf Types'), { target: { value: 'HALF' } });
        fireEvent.click(screen.getByRole('button', { name: /Search Stock/i }));

        await waitFor(() => {
            const calls = (api.get as any).mock.calls.filter((c: any[]) => c[0] === '/api/inventory');
            expect(calls.length).toBeGreaterThan(0);
            const lastParams = calls[calls.length - 1][1].params;
            expect(lastParams).toMatchObject({ search: 'Shirt', brand: 'Peter England', shelfType: 'HALF' });
        });
    });

    it('INV-SRCH-FE-005: Clear Filters resets the search box and dropdowns and re-fetches unfiltered inventory', async () => {
        mockApiResponses({
            filters: { data: { brands: ['Peter England'], sizes: [], colors: [], shelves: [] } },
            inventory: { items: [] },
        });

        render(<InventoryVariantSearch embedded />);
        await waitFor(() => expect(api.get).toHaveBeenCalledWith('/api/inventory/filters'));

        const searchInput = screen.getByPlaceholderText(/Search by Product Name/i) as HTMLInputElement;
        fireEvent.change(searchInput, { target: { value: 'Shirt' } });
        fireEvent.change(screen.getByDisplayValue('All Brands'), { target: { value: 'Peter England' } });

        fireEvent.click(screen.getByRole('button', { name: /Clear Filters/i }));

        await waitFor(() => expect(searchInput.value).toBe(''));
        await waitFor(() => {
            const calls = (api.get as any).mock.calls.filter((c: any[]) => c[0] === '/api/inventory');
            const lastParams = calls[calls.length - 1][1].params;
            expect(lastParams.brand).toBeUndefined();
            expect(lastParams.search).toBeUndefined();
        });
    });
});
