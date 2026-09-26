import React from 'react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';

const get = vi.fn();
const post = vi.fn();
vi.mock('@/services/api', () => ({ default: { get: (...a: unknown[]) => get(...a), post: (...a: unknown[]) => post(...a) } }));
vi.mock('../../services/api', () => ({ default: { get: (...a: unknown[]) => get(...a), post: (...a: unknown[]) => post(...a) } }));
vi.mock('../../../services/api', () => ({ default: { get: (...a: unknown[]) => get(...a), post: (...a: unknown[]) => post(...a) } }));
vi.mock('react-toastify', () => ({ toast: { success: vi.fn(), error: vi.fn(), warning: vi.fn() } }));
vi.mock('react-redux', () => ({ useSelector: (f: (s: unknown) => unknown) => f({ auth: { user: { name: 'Vikki' } } }), useDispatch: () => vi.fn() }));

import PaymentOut from './PaymentOut';
import PaymentInCreator from '../sales/payments/PaymentInCreator';

afterEach(() => { cleanup(); get.mockReset(); post.mockReset(); });

const bank = { _id: 'bank1', bankName: 'SBI Current', accountType: 'Current', status: 'active' };

describe('PaymentOut', () => {
    it('lists the supplier\'s real unpaid bills and posts the payment to the API', async () => {
        get.mockImplementation((url: string) => Promise.resolve({ data:
            url === '/api/purchases/suppliers' ? { success: true, data: [{ _id: 'sup1', businessName: 'Ramraj Cotton' }] }
            : url === '/api/cashbank/accounts' ? [bank]
            : url === '/api/bills' ? [{ _id: 'bill1', vendorInvoiceNo: 'RC-778', date: '2026-09-02T00:00:00Z', dueDate: '2026-10-02T00:00:00Z', amount: 48000, paidAmount: 8000, discountReceived: 0, status: 'approved' }]
            : [] }));
        post.mockResolvedValue({ data: { success: true } });
        render(<MemoryRouter><PaymentOut /></MemoryRouter>);
        await waitFor(() => expect(screen.getByRole('option', { name: 'Ramraj Cotton' })).toBeTruthy());
        fireEvent.change(screen.getAllByRole('combobox')[0], { target: { value: 'sup1' } });
        await waitFor(() => expect(screen.getByText('RC-778')).toBeTruthy());
        expect(get).toHaveBeenCalledWith('/api/bills', { params: { supplier: 'sup1', paymentStatus: 'unpaid,partial' } });
        expect(screen.queryByText(/Mock Vendor|BILL-1001/)).toBeNull();
        fireEvent.click(screen.getByRole('checkbox'));
        fireEvent.click(screen.getByRole('button', { name: /Complete Payment/ }));
        await waitFor(() => expect(post).toHaveBeenCalled());
        const [url, body] = post.mock.calls[0] as [string, Record<string, unknown>];
        expect(url).toBe('/api/purchase-payments');
        expect(body).toMatchObject({ supplierId: 'sup1', amount: 40000, paymentMode: 'Bank Transfer', bankAccountId: 'bank1', allocations: [{ billId: 'bill1', amount: 40000, discount: 0 }] });
    });
});

describe('PaymentInCreator', () => {
    it('allocates against the customer\'s real invoices and posts the receipt', async () => {
        get.mockImplementation((url: string) => Promise.resolve({ data:
            url === '/api/customers' ? [{ _id: 'cus1', name: 'Meena Stores', phone: '9876543210', dues: 12500 }]
            : url === '/api/cashbank/accounts' ? [bank]
            : url === '/api/payment-in/customer/cus1/invoices' ? [{ _id: 'inv1', invoiceNo: 'INV-00341', date: '2026-09-10T00:00:00Z', total: 12500, balance: 12500 }]
            : [] }));
        post.mockResolvedValue({ data: {} });
        render(<MemoryRouter><PaymentInCreator /></MemoryRouter>);
        fireEvent.focus(screen.getByPlaceholderText(/Search customer/));
        await waitFor(() => expect(screen.getByText('Meena Stores')).toBeTruthy());
        fireEvent.click(screen.getByText('Meena Stores'));
        await waitFor(() => expect(screen.getByText('INV-00341')).toBeTruthy());
        expect(screen.queryByText(/INV\/2026\/0001|HDFC Bank - 1234/)).toBeNull();
        fireEvent.change(screen.getByPlaceholderText('Amount'), { target: { value: '5000' } });
        fireEvent.change(screen.getByPlaceholderText('Allocate'), { target: { value: '5000' } });
        const deposit = screen.getByText('Deposit to').parentElement!;
        fireEvent.change(within(deposit).getByRole('combobox'), { target: { value: 'cash' } });
        fireEvent.click(screen.getByRole('button', { name: /Save Payment/ }));
        await waitFor(() => expect(post).toHaveBeenCalled());
        const [url, body] = post.mock.calls[0] as [string, Record<string, unknown>];
        expect(url).toBe('/api/payment-in');
        expect(body).toMatchObject({ customerId: 'cus1', depositAccount: 'cash', paymentMethods: [{ method: 'cash', amount: 5000 }], allocatedInvoices: [{ invoice: 'inv1', allocatedAmount: 5000 }] });
    });
});
