import { AppDispatch, RootState } from '../types';
import { PurchaseOrder } from '../../types/purchase';
import { approveOrder } from '../purchaseSlice';
import { addStockBulk } from '../inventorySlice';
import { TransactionType } from '../../types/common';
import { addTransaction } from '../financeSlice';
import { recordVendorTransaction } from '../vendorSlice';

export const processPurchaseApproval = (order: PurchaseOrder) => (dispatch: AppDispatch, getState: () => RootState) => {
    dispatch(approveOrder(order.id));
    dispatch(addStockBulk(order.items.map(i => ({
        sku: i.sku || 'UNKNOWN',
        qty: i.qty,
        cost: i.cost,
        price: undefined,
        name: i.name,
        category: 'Uncategorized', // Default
        productType: 'General', // Default
        sector: order.sector,
        branch: order.branchId
    }))));
    dispatch(addTransaction({
        id: Math.random().toString(36).substr(2, 9),
        type: TransactionType.EXPENSE,
        category: 'Inventory Restock',
        amount: order.total,
        date: new Date().toISOString(),
        description: `Invoice Payment - ${order.vendor} (${order.branchId})`,
        sector: order.sector,
        branchId: order.branchId
    }));

    // Record Vendor Transaction if vendorId exists
    if (order.vendorId) {
        dispatch(recordVendorTransaction(
            order.vendorId,
            'PURCHASE',
            order.total,
            `Purchase Bill #${order.id}`,
            order.id
        ));
    }
};
