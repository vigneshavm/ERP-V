import { describe, test, expect } from 'vitest';
import { renderHook } from '@testing-library/react';
import { usePOSTotals } from './usePOSTotals';

// Regression coverage for the tax bug fixed alongside the B2C billing sync fix: totals used
// `item.gstPercentage || 18`, so a genuinely 0%-GST item (gstPercentage: 0, a falsy number) was
// silently taxed at 18% instead. Fixed to `?? 18`, which only falls back on null/undefined.

function cartItem(overrides: any = {}) {
    return { id: 'I1', name: 'Item', price: 100, qty: 1, unit: 'Pcs', ...overrides };
}

function session(overrides: any = {}) {
    return { taxMode: 'EXCLUSIVE', redeemedPoints: 0, ...overrides };
}

describe('usePOSTotals', () => {
    test('a 0%-GST item contributes zero tax, it does not fall back to 18%', () => {
        const { result } = renderHook(() => usePOSTotals({
            cart: [cartItem({ gstPercentage: 0, price: 200, qty: 2 })],
            activeSession: session({ taxMode: 'EXCLUSIVE' }),
            tenants: [],
        }));

        expect(result.current.taxAmount).toBe(0);
        expect(result.current.cartSubtotal).toBe(400);
        expect(result.current.cartTotal).toBe(400);
    });

    test('an item with no gstPercentage set at all still defaults to 18% (only 0 is special-cased)', () => {
        const { result } = renderHook(() => usePOSTotals({
            cart: [cartItem({ price: 100, qty: 1 })], // gstPercentage omitted -> undefined
            activeSession: session({ taxMode: 'EXCLUSIVE' }),
            tenants: [],
        }));

        expect(result.current.taxAmount).toBeCloseTo(18);
    });

    test('EXCLUSIVE tax mode adds tax on top of the listed price', () => {
        const { result } = renderHook(() => usePOSTotals({
            cart: [cartItem({ price: 100, qty: 1, gstPercentage: 10 })],
            activeSession: session({ taxMode: 'EXCLUSIVE' }),
            tenants: [],
        }));

        expect(result.current.cartSubtotal).toBe(100);
        expect(result.current.taxAmount).toBeCloseTo(10);
        expect(result.current.cartTotal).toBeCloseTo(110);
    });

    test('INCLUSIVE tax mode backs tax out of the listed price instead of adding it', () => {
        const { result } = renderHook(() => usePOSTotals({
            cart: [cartItem({ price: 110, qty: 1, gstPercentage: 10 })],
            activeSession: session({ taxMode: 'INCLUSIVE' }),
            tenants: [],
        }));

        expect(result.current.cartTotal).toBeCloseTo(110);
        expect(result.current.cartSubtotal).toBeCloseTo(100);
        expect(result.current.taxAmount).toBeCloseTo(10);
    });

    test('meter-based items are billed by cut length, not by line count', () => {
        const { result } = renderHook(() => usePOSTotals({
            cart: [cartItem({ unit: 'Meter', price: 50, qty: 1, cutLength: 3, gstPercentage: 0 })],
            activeSession: session({ taxMode: 'EXCLUSIVE' }),
            tenants: [],
        }));

        expect(result.current.cartSubtotal).toBe(150); // 50/metre * 3 metres
    });

    test('redeemed loyalty points reduce the final total but never below zero', () => {
        const { result } = renderHook(() => usePOSTotals({
            cart: [cartItem({ price: 10, qty: 1, gstPercentage: 0 })],
            activeSession: session({ taxMode: 'EXCLUSIVE', redeemedPoints: 500 }),
            tenants: [{ id: 'T1', loyaltyConfig: { redemptionValue: 1 } } as any],
            userId: 'T1',
        }));

        expect(result.current.redemptionAmount).toBe(500);
        expect(result.current.finalTotal).toBe(0); // clamped, not negative
    });
});
