import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor, within } from '@testing-library/react';
import ProductMaster from './ProductMaster';

// Product master screen (Textilesoft newproduct via /api/product-master). Covers: loading, the purchased
// lock, search, client-side required fields, create/edit request shapes, and that the server's refusal
// messages (409 "used in salbill ...", 400 "MRP must be a number") reach the user unchanged.

vi.mock('../../services/api', () => ({
    default: { get: vi.fn(), post: vi.fn(), put: vi.fn(), delete: vi.fn() },
}));
vi.mock('../../components/shared/Layout/PageHeader', () => ({
    default: ({ title }: { title: string }) => <h1>{title}</h1>,
}));

import api from '../../services/api';

const product = (over: Record<string, unknown> = {}) => ({
    code: '12', name: 'PANT', nameTamil: '', printNameTamil: '', unit: 'PCS', group: 'MENS',
    subGroup: '', floor: '', gstGroup: 'GST5', hsnCode: '6203', discountPercent: '', commissionPercent: '',
    commissionAmount: '', mrp: '800', retailRate: '', wholesaleRate: '', companies: ['SSS'], racks: [], fashions: [],
    purchased: false,
    printName: (over.name as string) ?? 'PANT', // same as name unless overridden
    ...over,
});
const OPTIONS = {
    units: ['PCS', 'MTR'], groups: ['MENS', 'KIDS'], subGroups: [], floors: [], gstGroups: ['GST5', 'GST12'],
    companies: ['SSS'], racks: ['A1'], fashions: [],
};
const refusal = (message: string) => Object.assign(new Error('409'), { response: { data: { message } } });

function mockLoad(products = [product(), product({ code: '7', name: 'SAREE', group: 'KIDS', purchased: true })]) {
    (api.get as any).mockImplementation((url: string) =>
        url === '/api/product-master/options'
            ? Promise.resolve({ data: { data: OPTIONS } })
            : Promise.resolve({ data: { data: products } }),
    );
}

const field = (label: RegExp) => screen.getByLabelText(label) as HTMLInputElement;

describe('ProductMaster', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('lists products; a purchased product shows the lock instead of Delete', async () => {
        mockLoad();
        render(<ProductMaster />);
        await waitFor(() => expect(screen.getByText('PANT')).toBeInTheDocument());
        const saree = screen.getByText('SAREE').closest('tr')!;
        expect(within(saree).getByTitle(/Already purchased/)).toBeInTheDocument();
        expect(within(saree).queryByTitle('Delete')).toBeNull();
        expect(within(screen.getByText('PANT').closest('tr')!).getByTitle('Delete')).toBeInTheDocument();
        expect(screen.getByText('2 of 2 products')).toBeInTheDocument();
    });

    it('search and group filter', async () => {
        mockLoad();
        render(<ProductMaster />);
        await screen.findByText('PANT');
        fireEvent.change(screen.getByPlaceholderText(/Search name or code/), { target: { value: 'sar' } });
        expect(screen.queryByText('PANT')).toBeNull();
        expect(screen.getByText('SAREE')).toBeInTheDocument();
        fireEvent.change(screen.getByPlaceholderText(/Search name or code/), { target: { value: '' } });
        fireEvent.change(screen.getByDisplayValue('All groups'), { target: { value: 'MENS' } });
        expect(screen.getByText('1 of 2 products')).toBeInTheDocument();
    });

    it('shows the server message when loading fails (no invented rows)', async () => {
        (api.get as any).mockRejectedValue(refusal('Shop database is not reachable.'));
        render(<ProductMaster />);
        expect(await screen.findByText('Shop database is not reachable.')).toBeInTheDocument();
        expect(screen.queryByText('PANT')).toBeNull();
    });

    it('new product: required fields are checked before calling the API; code is left to the server', async () => {
        mockLoad([]);
        (api.post as any).mockResolvedValue({ data: { data: product({ code: '13', name: 'SHIRT' }) } });
        render(<ProductMaster />);
        await screen.findByText('No products match.');
        fireEvent.click(screen.getByText(/New product/));
        fireEvent.click(screen.getByText('Save'));
        expect(screen.getByText('Enter the product name.')).toBeInTheDocument();
        expect(api.post).not.toHaveBeenCalled();

        fireEvent.change(field(/Product name/), { target: { value: 'shirt' } });
        fireEvent.click(screen.getByText('Save'));
        expect(screen.getByText('Select the GST group.')).toBeInTheDocument(); // unit defaults to PCS, 1 company pre-ticked

        fireEvent.change(field(/GST group/), { target: { value: 'GST5' } });
        fireEvent.click(screen.getByText('Save'));
        await waitFor(() => expect(api.post).toHaveBeenCalledTimes(1));
        const [url, body] = (api.post as any).mock.calls[0];
        expect(url).toBe('/api/product-master');
        expect(body).toMatchObject({ name: 'shirt', unit: 'PCS', gstGroup: 'GST5', companies: ['SSS'] });
        expect(body).not.toHaveProperty('code');
        expect(await screen.findByText('SHIRT')).toBeInTheDocument();
    });

    it("edit: PUT to the product's code without the read-only purchased flag; a 400 is shown in the form", async () => {
        mockLoad();
        (api.put as any).mockRejectedValueOnce(refusal('MRP must be a number (got "8oo").'));
        render(<ProductMaster />);
        await screen.findByText('PANT');
        fireEvent.click(within(screen.getByText('PANT').closest('tr')!).getByTitle('Edit'));
        fireEvent.change(field(/^MRP/), { target: { value: '850' } });
        fireEvent.click(screen.getByText('Save'));
        expect(await screen.findByText('MRP must be a number (got "8oo").')).toBeInTheDocument();
        const [url, body] = (api.put as any).mock.calls[0];
        expect(url).toBe('/api/product-master/12');
        expect(body).toMatchObject({ name: 'PANT', mrp: '850' });
        expect(body).not.toHaveProperty('purchased');
        expect(body).not.toHaveProperty('code');
    });

    it('delete: a refusal (product used in bills) is shown and the product stays; success removes it', async () => {
        mockLoad();
        (api.delete as any).mockRejectedValueOnce(refusal('This product is used in salbill, so it can\'t be deleted.'));
        render(<ProductMaster />);
        await screen.findByText('PANT');
        fireEvent.click(within(screen.getByText('PANT').closest('tr')!).getByTitle('Delete'));
        fireEvent.click(screen.getByText('Delete'));
        expect(await screen.findByText(/used in salbill/)).toBeInTheDocument();
        expect(api.delete).toHaveBeenCalledWith('/api/product-master/12');

        (api.delete as any).mockResolvedValueOnce({});
        fireEvent.click(screen.getByText('Delete'));
        await waitFor(() => expect(screen.queryByText('PANT')).toBeNull());
        expect(screen.getByText('1 of 1 products')).toBeInTheDocument();
    });
});
