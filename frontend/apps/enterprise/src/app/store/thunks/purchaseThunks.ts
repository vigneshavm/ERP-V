import { AppDispatch, RootState } from "../store";
import { PurchaseOrder } from "@repo/shared-kernel";
import { approveOrder } from '../slices/purchaseSlice';
import { addStockBulk } from '../slices/inventorySlice';
import { TransactionType } from "@repo/shared-kernel";
import { addTransaction } from '../slices/financeSlice';
// import { recordVendorTransaction } from '../vendorSlice'; // Missing

export const processPurchaseApproval = (order: PurchaseOrder) => (dispatch: AppDispatch, getState: () => RootState) => {
    dispatch(approveOrder(order.id));
    dispatch(addStockBulk(order.items.map(i => ({
        sku: i.sku || 'UNKNOWN',
        qty: i.quantity,
        cost: i.rate,
        price: undefined,
        name: i.product_name,
        category: 'Uncategorized', // Default
        productType: 'General', // Default
        sector: 'Retail', // Default/Inferred (PurchaseOrder doesn't verify Sector type well sometimes)
        branch: order.branch_id
    }))));
    dispatch(addTransaction({
        id: Math.random().toString(36).substr(2, 9),
        type: TransactionType.EXPENSE,
        category: 'Inventory Restock',
        amount: order.total_amount,
        date: new Date().toISOString(),
        description: `Invoice Payment - ${order.vendor_name} (${order.branch_id})`,
        sector: 'Retail', // Default
        branchId: order.branch_id,
        paymentMethod: 'Cash' // Default required field
    }));

    // Record Vendor Transaction if vendorId exists
    if (order.vendor_id) {
        // dispatch(recordVendorTransaction(
        //     order.vendor_id,
        //     'PURCHASE',
        //     order.total_amount,
        //     `Purchase Bill #${order.id}`,
        //     order.id
        // ));
    }
};
