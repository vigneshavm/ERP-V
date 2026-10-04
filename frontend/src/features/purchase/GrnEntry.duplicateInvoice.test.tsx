import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';

// GRN entry: when the server says this supplier's invoice is already entered (409 DUPLICATE_INVOICE),
// the screen explains it and only saves again when the user confirms it's a different bill.

vi.mock('../../services/api', () => ({ default: { get: vi.fn(), post: vi.fn() } }));
vi.mock('../../components/shared/Layout/PageHeader', () => ({
    default: ({ title }: { title: string }) => <h1>{title}</h1>,
}));
import api from '../../services/api';
import GrnEntry from './GrnEntry';

const OPTIONS = {
    companies: [{ name: 'SSS', grnPrefix: 'VJ' }],
    warehouses: ['MAIN'],
    suppliers: [{ name: 'RAMRAJ', city: 'TIRUPUR' }],
    agents: [],
    products: [{ code: '12', name: 'PANT', unit: 'PCS', group: 'MENS', gstGroup: 'GST5', hsnCode: '6203', company: 'SSS' }],
    gstGroups: [{ name: 'GST5', slabs: [{ from: 0, to: 0, gst: 5 }] }],
};
const DUP = 'Invoice INV-101 of RAMRAJ is already entered as GRN VJ100 on 2026-09-12. Save again only if this is a different bill.';
const dupError = () =>
    Promise.reject(Object.assign(new Error('409'), { response: { status: 409, data: { code: 'DUPLICATE_INVOICE', message: DUP } } }));

async function fillForm() {
    render(<GrnEntry />);
    const product = await screen.findByRole('option', { name: /12 · PANT/ });
    fireEvent.change(product.closest('select')!, { target: { value: '12' } });
    fireEvent.change(screen.getByPlaceholderText('Type to search'), { target: { value: 'RAMRAJ' } });
    const invoice = screen.getByText('Invoice no. *').parentElement!.querySelector('input')!;
    fireEvent.change(invoice, { target: { value: 'INV-101' } });
    return invoice;
}

describe('GrnEntry duplicate supplier invoice', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        (api.get as any).mockImplementation((url: string) =>
            url === '/api/purchase-entry/options'
                ? Promise.resolve({ data: { data: OPTIONS } })
                : Promise.resolve({ data: { data: [] } }),
        );
    });

    it('shows the warning; "save anyway" resends with allowDuplicateInvoice', async () => {
        (api.post as any).mockImplementationOnce(dupError).mockResolvedValueOnce({
            data: { data: { grnNo: 'VJ101', date: '30/09/2026', lines: [], totals: { qty: 0, amount: 0, gst: 0, net: 0 } } },
        });
        await fillForm();
        fireEvent.click(screen.getByText(/Save purchase/));
        expect(await screen.findByRole('alert')).toHaveTextContent('already entered as GRN VJ100');
        expect((api.post as any).mock.calls[0][1]).not.toHaveProperty('allowDuplicateInvoice');

        fireEvent.click(screen.getByText(/save anyway/));
        await waitFor(() => expect(api.post).toHaveBeenCalledTimes(2));
        expect((api.post as any).mock.calls[1][1]).toMatchObject({ invoiceNo: 'INV-101', allowDuplicateInvoice: true });
    });

    it('changing the invoice number removes the warning (confirmation never carries over)', async () => {
        (api.post as any).mockImplementationOnce(dupError);
        const invoice = await fillForm();
        fireEvent.click(screen.getByText(/Save purchase/));
        await screen.findByRole('alert');
        fireEvent.change(invoice, { target: { value: 'INV-102' } });
        expect(screen.queryByRole('alert')).toBeNull();
    });
});
