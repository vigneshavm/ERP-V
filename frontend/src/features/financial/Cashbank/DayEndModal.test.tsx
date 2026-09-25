import React from 'react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { Provider } from 'react-redux';
import { configureStore } from '@reduxjs/toolkit';

const get = vi.fn();
const post = vi.fn();
vi.mock('@/services/api', () => ({ default: { get: (...a: unknown[]) => get(...a), post: (...a: unknown[]) => post(...a) } }));

import financeReducer from '@/redux/slices/financeSlice';
import DayEndModal from './DayEndModal';

afterEach(() => { cleanup(); get.mockReset(); post.mockReset(); });

const summary = { openingCash: 5000, cashSales: 12000, cashExpenses: 2000, expectedCash: 15000, pendingCheques: [], supplierAlerts: [] };

const renderModal = (onClose = vi.fn()) => {
    const store = configureStore({ reducer: { auth: () => ({ user: { token: 't' } }), finance: financeReducer } });
    render(<Provider store={store}><DayEndModal onClose={onClose} /></Provider>);
    return onClose;
};

const countCash = (amount: string) =>
    fireEvent.change(screen.getByPlaceholderText('Enter counted cash...'), { target: { value: amount } });

describe('DayEndModal', () => {
    it('loads the summary from /api/day-end and saves the closing there', async () => {
        get.mockResolvedValue({ data: summary });
        post.mockResolvedValue({ data: {} });
        const onClose = renderModal();

        await waitFor(() => expect(screen.getByText('₹15,000.00')).toBeTruthy());
        expect(get.mock.calls[0][0]).toBe('/api/day-end/summary');

        countCash('14800');
        fireEvent.click(screen.getByRole('button', { name: /Close Day/ }));

        await waitFor(() => expect(onClose).toHaveBeenCalled());
        expect(post.mock.calls[0][0]).toBe('/api/day-end/save');
        expect(post.mock.calls[0][1]).toMatchObject({ openingCash: 5000, expectedCash: 15000, physicalCash: 14800, variance: -200 });
    });

    it('stays open and shows the reason when the save fails', async () => {
        get.mockResolvedValue({ data: summary });
        post.mockRejectedValue({ response: { data: { message: 'Transaction numbers are only allowed on a replica set member' } } });
        const onClose = renderModal();

        await waitFor(() => expect(screen.getByText('₹15,000.00')).toBeTruthy());
        countCash('15000');
        fireEvent.click(screen.getByRole('button', { name: /Close Day/ }));

        expect((await screen.findByRole('alert')).textContent).toMatch(/replica set/);
        expect(onClose).not.toHaveBeenCalled();
    });
});
