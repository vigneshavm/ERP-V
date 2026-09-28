import { describe, it, expect, vi, beforeEach } from 'vitest';

const get = vi.fn();
vi.mock('./api', () => ({ default: { get: (...a: unknown[]) => get(...a) } }));

import { getTable } from './dataSource';

beforeEach(() => get.mockReset());

describe('getTable', () => {
    it('reads the { items } shape the paginated inventory list returns', async () => {
        // GET /api/inventory -> { items, pagination }; this used to come back as [], so the POS
        // never received any products.
        get.mockResolvedValue({ data: { items: [{ _id: 'i1', name: 'Shirt' }], pagination: { page: 1 } } });
        expect(await getTable('products')).toEqual([{ _id: 'i1', name: 'Shirt' }]);
        expect(get).toHaveBeenCalledWith('/api/inventory', expect.anything());
    });

    it('still reads { success, data } and plain arrays', async () => {
        get.mockResolvedValueOnce({ data: { success: true, data: [{ id: 1 }] } });
        expect(await getTable('products')).toEqual([{ id: 1 }]);
        get.mockResolvedValueOnce({ data: [{ id: 2 }] });
        expect(await getTable('products')).toEqual([{ id: 2 }]);
    });
});
