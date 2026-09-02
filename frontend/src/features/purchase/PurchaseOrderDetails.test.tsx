import React from 'react';
import { describe, test, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';

// This is the UI-level end-to-end test for the E2E-001 PO/GRN implementation: it renders the
// REAL PurchaseOrderDetails.tsx together with the REAL (unmocked) ReceiveGoodsModal.tsx and the
// REAL purchaseSlice.ts action creators, mocking only the boundary a browser test can't cross -
// react-redux's store wiring, react-router-dom, and the grnService HTTP call. This is the same
// "mock only the I/O boundary, run everything else for real" strategy used for the backend
// E2E-001 test and the two rounds of pure-function unit tests already written this session.

let fakeState: any;
const mockDispatch = vi.fn();
const mockNavigate = vi.fn();

vi.mock('react-redux', () => ({
    useSelector: (selector: any) => selector(fakeState),
    useDispatch: () => mockDispatch,
}));

vi.mock('react-router-dom', () => ({
    useParams: () => ({ id: undefined }),
    useNavigate: () => mockNavigate,
}));

// Out of scope for E2E-001 (billing) - stubbed so its own dependencies don't need to resolve.
vi.mock('./Modals/CreateBillModal', () => ({ default: () => null }));

const mockCreateGRN = vi.fn();
vi.mock('../../services/grnService', () => ({
    createGRN: (...args: any[]) => mockCreateGRN(...args),
    mapGrnToFrontendGRN: (grn: any, fallback?: any) => ({
        id: grn._id,
        poId: grn.purchaseId,
        poNumber: fallback?.poNumber,
        vendorName: fallback?.vendorName,
        status: grn.status,
        items: grn.items,
    }),
}));

import PurchaseOrderDetails from './PurchaseOrderDetails';

const makeOrder = (overrides: any = {}) => ({
    id: 'PO_1',
    po_number: 'PUR-20260820-001',
    vendor_name: 'Acme Textiles',
    vendor_id: 'VEND_1',
    po_date: '2026-08-20',
    items: [
        { product_id: 'ITEM_1', product_name: 'Cotton Roll', quantity: 100, rate: 50, tax_percent: 5, discount_amount: 0, line_total: 5000, received_quantity: 0 },
    ],
    total_amount: 5250,
    status: 'DRAFT',
    created_at: '2026-08-20T10:00:00.000Z',
    ...overrides,
});

const setState = (role: string = 'Owner') => {
    fakeState = {
        auth: { role },
        purchase: { selectedOrder: null, isProcessing: false },
    };
};

beforeEach(() => {
    mockDispatch.mockClear();
    mockNavigate.mockClear();
    mockCreateGRN.mockReset();
    setState('Owner');
});

describe('PurchaseOrderDetails - lifecycle button gating (matches backend Purchase.status enum)', () => {
    test('DRAFT order shows Submit and nothing else', () => {
        render(<PurchaseOrderDetails order={makeOrder({ status: 'DRAFT' })} />);
        expect(screen.getByText(/Submit Protocol/i)).toBeInTheDocument();
        expect(screen.queryByText(/Authorize Node/i)).not.toBeInTheDocument();
        expect(screen.queryByText(/Send to Vendor/i)).not.toBeInTheDocument();
        expect(screen.queryByText(/Initialize Receipt/i)).not.toBeInTheDocument();
        expect(screen.queryByText(/Generate Invoice/i)).not.toBeInTheDocument();
    });

    test('SUBMITTED order shows Approve/Reject to an Owner', () => {
        render(<PurchaseOrderDetails order={makeOrder({ status: 'SUBMITTED' })} />);
        expect(screen.getByText(/Authorize Node/i)).toBeInTheDocument();
        expect(screen.getByText(/Reject Node/i)).toBeInTheDocument();
    });

    test('SUBMITTED order hides Approve/Reject from a non-Owner', () => {
        setState('Staff');
        render(<PurchaseOrderDetails order={makeOrder({ status: 'SUBMITTED' })} />);
        expect(screen.queryByText(/Authorize Node/i)).not.toBeInTheDocument();
        expect(screen.queryByText(/Reject Node/i)).not.toBeInTheDocument();
    });

    test('APPROVED order shows Send to Vendor, which reports SENT_TO_VENDOR via onUpdateStatus', () => {
        const onUpdateStatus = vi.fn();
        const order = makeOrder({ status: 'APPROVED' });
        render(<PurchaseOrderDetails order={order} onUpdateStatus={onUpdateStatus} />);
        const btn = screen.getByText(/Send to Vendor/i);
        expect(btn).toBeInTheDocument();
        fireEvent.click(btn);
        expect(onUpdateStatus).toHaveBeenCalledWith('PO_1', 'SENT_TO_VENDOR');
    });

    test('SENT_TO_VENDOR order shows Initialize Receipt but not Send to Vendor', () => {
        render(<PurchaseOrderDetails order={makeOrder({ status: 'SENT_TO_VENDOR' })} />);
        expect(screen.getByText(/Initialize Receipt/i)).toBeInTheDocument();
        expect(screen.queryByText(/Send to Vendor/i)).not.toBeInTheDocument();
    });

    test('PARTIALLY_RECEIVED order can both receive more AND bill (matches backend PARTIALLY_RECEIVED semantics)', () => {
        render(<PurchaseOrderDetails order={makeOrder({ status: 'PARTIALLY_RECEIVED' })} />);
        expect(screen.getByText(/Initialize Receipt/i)).toBeInTheDocument();
        expect(screen.getByText(/Generate Invoice/i)).toBeInTheDocument();
    });

    test('COMPLETED order can bill but can no longer receive', () => {
        render(<PurchaseOrderDetails order={makeOrder({ status: 'COMPLETED' })} />);
        expect(screen.getByText(/Generate Invoice/i)).toBeInTheDocument();
        expect(screen.queryByText(/Initialize Receipt/i)).not.toBeInTheDocument();
    });

    test('CANCELLED order shows no lifecycle action buttons', () => {
        render(<PurchaseOrderDetails order={makeOrder({ status: 'CANCELLED' })} />);
        for (const label of [/Submit Protocol/i, /Authorize Node/i, /Send to Vendor/i, /Initialize Receipt/i, /Generate Invoice/i]) {
            expect(screen.queryByText(label)).not.toBeInTheDocument();
        }
    });
});

describe('PurchaseOrderDetails + ReceiveGoodsModal - real receive-goods integration (POST /api/grn)', () => {
    test('confirming a receipt calls createGRN with the right payload, dispatches a real addGRN action, and re-fetches the PO', async () => {
        const order = makeOrder({
            status: 'SENT_TO_VENDOR',
            items: [{ product_id: 'ITEM_1', product_name: 'Cotton Roll', quantity: 100, rate: 50, tax_percent: 5, discount_amount: 0, line_total: 5000, received_quantity: 0 }],
        });
        mockCreateGRN.mockResolvedValueOnce({
            grn: {
                _id: 'GRN_1',
                purchaseId: 'PO_1',
                status: 'PARTIAL',
                items: [{ productId: 'ITEM_1', productName: 'Cotton Roll', orderedQty: 100, receivedQty: 95, acceptedQty: 90, rejectedQty: 5 }],
            },
        });
        const onAfterReceive = vi.fn();
        render(<PurchaseOrderDetails order={order} onAfterReceive={onAfterReceive} />);

        fireEvent.click(screen.getByText(/Initialize Receipt/i));
        expect(screen.getByText(/Receive Goods/i)).toBeInTheDocument();
        expect(screen.getByText(/PO #PUR-20260820-001/i)).toBeInTheDocument();

        // Real ReceiveGoodsModal renders one <input type="number"> pair (received, rejected)
        // per line item - defaults received to the full outstanding quantity (100).
        const spinbuttons = screen.getAllByRole('spinbutton');
        expect(spinbuttons).toHaveLength(2);
        fireEvent.change(spinbuttons[0], { target: { value: '95' } }); // received now
        fireEvent.change(spinbuttons[1], { target: { value: '5' } }); // damaged/rejected

        fireEvent.click(screen.getByText(/Confirm Receipt/i));

        await waitFor(() => expect(mockCreateGRN).toHaveBeenCalledTimes(1));
        expect(mockCreateGRN).toHaveBeenCalledWith({
            purchaseId: 'PO_1',
            items: [{ productId: 'ITEM_1', productName: 'Cotton Roll', receivedQty: 95, rejectedQty: 5 }],
        });

        // dispatch(addGRN(...)) uses the REAL purchaseSlice action creator - assert the actual
        // action shape it produces, not a stand-in.
        await waitFor(() => expect(mockDispatch).toHaveBeenCalledWith(expect.objectContaining({
            type: 'purchase/addGRN',
            payload: expect.objectContaining({ id: 'GRN_1', poId: 'PO_1' }),
        })));

        // The caller is told to re-fetch the authoritative PO state (status/received quantities
        // are recalculated server-side, not derivable purely on the client).
        expect(onAfterReceive).toHaveBeenCalledWith('PO_1');

        // Modal closes on success.
        await waitFor(() => expect(screen.queryByText(/Receive Goods/i)).not.toBeInTheDocument());
    });

    test('only sends line items with a non-zero received quantity to createGRN', async () => {
        const order = makeOrder({
            status: 'SENT_TO_VENDOR',
            items: [
                { product_id: 'ITEM_1', product_name: 'Cotton Roll', quantity: 100, rate: 50, tax_percent: 5, discount_amount: 0, line_total: 5000, received_quantity: 95 }, // 5 outstanding
                { product_id: 'ITEM_2', product_name: 'Steel Rod', quantity: 10, rate: 200, tax_percent: 5, discount_amount: 0, line_total: 2000, received_quantity: 10 }, // fully received already
            ],
        });
        mockCreateGRN.mockResolvedValueOnce({ grn: { _id: 'GRN_2', purchaseId: 'PO_1', status: 'ACCEPTED', items: [] } });

        render(<PurchaseOrderDetails order={order} />);
        fireEvent.click(screen.getByText(/Initialize Receipt/i));
        fireEvent.click(screen.getByText(/Confirm Receipt/i));

        await waitFor(() => expect(mockCreateGRN).toHaveBeenCalledTimes(1));
        expect(mockCreateGRN).toHaveBeenCalledWith({
            purchaseId: 'PO_1',
            items: [{ productId: 'ITEM_1', productName: 'Cotton Roll', receivedQty: 5, rejectedQty: 0 }],
        });
    });

    test('confirming a receipt where every item is already fully received closes the modal without calling createGRN', async () => {
        const order = makeOrder({
            status: 'SENT_TO_VENDOR',
            items: [{ product_id: 'ITEM_1', product_name: 'Cotton Roll', quantity: 100, rate: 50, tax_percent: 5, discount_amount: 0, line_total: 5000, received_quantity: 100 }],
        });
        render(<PurchaseOrderDetails order={order} />);
        fireEvent.click(screen.getByText(/Initialize Receipt/i));
        fireEvent.click(screen.getByText(/Confirm Receipt/i));

        await waitFor(() => expect(screen.queryByText(/Receive Goods/i)).not.toBeInTheDocument());
        expect(mockCreateGRN).not.toHaveBeenCalled();
    });

    test('a failed createGRN call surfaces the error inside the modal, leaves it open, and never calls onAfterReceive', async () => {
        const order = makeOrder({
            status: 'SENT_TO_VENDOR',
            items: [{ product_id: 'ITEM_1', product_name: 'Cotton Roll', quantity: 10, rate: 50, tax_percent: 5, discount_amount: 0, line_total: 500, received_quantity: 0 }],
        });
        mockCreateGRN.mockRejectedValueOnce({ response: { data: { message: 'Insufficient stock ledger' } } });
        const onAfterReceive = vi.fn();

        render(<PurchaseOrderDetails order={order} onAfterReceive={onAfterReceive} />);
        fireEvent.click(screen.getByText(/Initialize Receipt/i));
        fireEvent.click(screen.getByText(/Confirm Receipt/i));

        await waitFor(() => expect(screen.getByText('Insufficient stock ledger')).toBeInTheDocument());
        expect(screen.getByText(/Receive Goods/i)).toBeInTheDocument(); // still open
        expect(onAfterReceive).not.toHaveBeenCalled();
        expect(mockDispatch).not.toHaveBeenCalledWith(expect.objectContaining({ type: 'purchase/addGRN' }));
    });

    test('falls back to a generic message when the failed response carries no message', async () => {
        const order = makeOrder({
            status: 'SENT_TO_VENDOR',
            items: [{ product_id: 'ITEM_1', product_name: 'Cotton Roll', quantity: 10, rate: 50, tax_percent: 5, discount_amount: 0, line_total: 500, received_quantity: 0 }],
        });
        mockCreateGRN.mockRejectedValueOnce(new Error('Network Error'));

        render(<PurchaseOrderDetails order={order} />);
        fireEvent.click(screen.getByText(/Initialize Receipt/i));
        fireEvent.click(screen.getByText(/Confirm Receipt/i));

        await waitFor(() => expect(screen.getByText('Network Error')).toBeInTheDocument());
    });
});
