import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';

vi.mock('../../services/api', () => ({ default: { get: vi.fn() } }));
import api from '../../services/api';
import { mergeSuggestions, useAttributeSuggestions, GRN_ATTRIBUTES } from './useAttributeSuggestions';

// GRN grid autocomplete for size / brand / pattern / colour / design / rack, from
// /api/product-attributes/:attribute (Textilesoft masters + purchase history, most used first).

const reply = (values: string[]) => Promise.resolve({ data: { data: values.map((value) => ({ value, uses: 1 })) } });

describe('mergeSuggestions', () => {
    it("supplier's own values first, then the rest, each once, upper case", () => {
        expect(mergeSuggestions(['xl', 'M'], ['M', 'L', 'XL', 'S'])).toEqual(['XL', 'M', 'L', 'S']);
        expect(mergeSuggestions([], [])).toEqual([]);
    });
});

describe('useAttributeSuggestions', () => {
    beforeEach(() => vi.clearAllMocks());

    it('loads every attribute once without a supplier', async () => {
        (api.get as any).mockImplementation((url: string) => reply(url.endsWith('/size') ? ['M', 'L'] : []));
        const { result } = renderHook(() => useAttributeSuggestions(''));
        await waitFor(() => expect(result.current.size).toEqual(['M', 'L']));
        expect(api.get).toHaveBeenCalledTimes(GRN_ATTRIBUTES.length);
        expect((api.get as any).mock.calls[0][1]).toEqual({ params: { limit: 100 } });
    });

    it("with a supplier, that supplier's values come first", async () => {
        (api.get as any).mockImplementation((url: string, cfg: { params: { supplier?: string } }) => {
            if (!url.endsWith('/brand')) return reply([]);
            return reply(cfg.params.supplier === 'RAMRAJ' ? ['RAMRAJ COTTON'] : ['ZODIAC', 'RAMRAJ COTTON']);
        });
        const { result } = renderHook(() => useAttributeSuggestions('RAMRAJ'));
        await waitFor(() => expect(result.current.brand).toEqual(['RAMRAJ COTTON', 'ZODIAC']));
        expect((api.get as any).mock.calls.some(([, c]: [string, any]) => c.params.supplier === 'RAMRAJ')).toBe(true);
    });

    it('a failing request leaves that attribute empty instead of breaking the grid', async () => {
        (api.get as any).mockImplementation((url: string) =>
            url.endsWith('/color') ? Promise.reject(new Error('503')) : reply(['X']),
        );
        const { result } = renderHook(() => useAttributeSuggestions(''));
        await waitFor(() => expect(result.current.size).toEqual(['X']));
        expect(result.current.color).toEqual([]);
    });
});
