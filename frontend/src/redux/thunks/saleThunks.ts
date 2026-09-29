import { AppDispatch, RootState } from "../store";
import { Sale } from "../../types/sales";
import { calculateLoyaltyPoints } from "../../utils/loyalty";
import { updateCustomerPoints } from '../slices/posSlice';
import { recordSale } from '../slices/posSlice';
import { deductStock } from '../slices/inventorySlice';
import { TransactionType, Sector } from "../../types/common";
import { addTransaction } from '../slices/financeSlice';
import api from "../../services/api";
import { buildPosInvoicePayload } from "../../services/posInvoiceMapper";
import { db } from "../../services/db";
import { toast } from "react-toastify";
import { isPermanentRejection, notifyFailedSalesChanged, rejectionMessage, serverRefusedError } from "../../services/failedSales";

/**
 * Records a finished sale. Online, the server is asked first so the bill carries the server's number
 * (e.g. "A96" from the shop database, or "INV-2026-00017"): `sale.id` is replaced with it before the
 * sale is recorded locally, and the caller prints after this resolves. If the server can't be reached
 * the provisional counter number is kept and the sale is queued, as before.
 * Resolves to the bill number that ended up on the sale.
 */
export const processSale = (sale: Sale) => async (dispatch: AppDispatch, getState: () => RootState): Promise<string> => {
    const state = getState();
    const { user } = state.auth;
    const currentTenant = state.tenant.tenants.find((t: any) => t.id === user?.tenantId);

    // 0. Calculate Loyalty Points (if not already calculated)
    if (currentTenant && sale.customerId && !sale.loyaltyPointsEarned) {
        const earned = calculateLoyaltyPoints(sale.items, currentTenant);
        if (earned > 0) {
            sale.loyaltyPointsEarned = earned;
            dispatch(updateCustomerPoints({ id: sale.customerId, points: earned }));
        }
    } else if (sale.loyaltyPointsEarned && sale.customerId) {
        // Points already calculated (e.g. from POSLogic), just update local state
        dispatch(updateCustomerPoints({ id: sale.customerId, points: sale.loyaltyPointsEarned }));
    }

    // 0.1 Deduct Redemption Points
    if (sale.redeemedPoints && sale.customerId) {
        dispatch(updateCustomerPoints({ id: sale.customerId, points: -sale.redeemedPoints }));
    }

    // 1. Push to Backend API if Online
    // This is the endpoint that actually persists the invoice AND reduces stock in the DB
    // (backend/src/modules/sales/controllers/PosController.ts::createInvoice) — the previous
    // `/sales-invoice/sync` target didn't exist as a route, so every sale was silently lost
    // server-side while looking successful on screen (Redux state + printed receipt only).
    if (navigator.onLine) {
        try {
            const { data } = await api.post('/api/pos/invoice', buildPosInvoicePayload(sale));
            if (!data?.success) {
                throw serverRefusedError(data?.message);
            }
            // Use the server's bill number from here on (receipt, Last Bill, lookup).
            const serverNo = data?.invoice?.billNo || data?.invoice?.invoiceNo;
            if (serverNo) sale.id = String(serverNo);
        } catch (err) {
            console.error('Failed to sync sale to backend:', err);
            const rejected = isPermanentRejection(err);
            if (rejected) {
                // The server refused this bill (e.g. insufficient stock, unknown item): retrying the same
                // data would fail forever, so keep it in the "Failed bills" list with the reason instead.
                const reason = rejectionMessage(err);
                await db.offlineSales.add({
                    ...sale,
                    synced: false,
                    retryCount: 1,
                    failed: true,
                    error: reason,
                    failedAt: new Date().toISOString()
                });
                notifyFailedSalesChanged();
                toast.error(`Sale #${sale.id} printed but the server REJECTED it: ${reason}. It is listed under "Failed bills" on the POS screen.`, {
                    position: 'top-center',
                    autoClose: false,
                    closeOnClick: true,
                    draggable: true,
                });
            } else {
                // Server unreachable / temporary error: queue for retry via SyncManager.syncOfflineSales().
                await db.offlineSales.add({
                    ...sale,
                    synced: false,
                    retryCount: 0
                });
                toast.error(`Sale #${sale.id} printed but did NOT save to the server. It has been queued and will retry automatically.`, {
                    position: 'top-center',
                    autoClose: 6000,
                    hideProgressBar: false,
                    closeOnClick: true,
                    pauseOnHover: true,
                    draggable: true,
                });
            }
        }
    } else {
        // Fully offline — queue immediately, SyncManager picks it up when connectivity returns.
        await db.offlineSales.add({
            ...sale,
            synced: false,
            retryCount: 0
        });
    }

    // 2. Update Local Redux State
    dispatch(recordSale(sale));
    sale.items.forEach(item => {
        const deductionQty = item.unit === 'Meter' ? (item.cutLength || 1) * item.qty : item.qty;
        dispatch(deductStock({ id: item.id, qty: deductionQty }));
    });

    // 3. Record Financial Transaction (Local)
    let branchName: string | undefined = sale.branchId;

    if (!branchName) {
        const tenantBranches = (state.tenant.tenants || []).flatMap((t: any) => (t.locations || []).flatMap((l: any) => l.branches || []));
        if (tenantBranches.length === 1) branchName = tenantBranches[0].name;
    }

    if (!branchName) {
        const dbBranch = (state.tenant.branches || []).find((b: any) => b.id === sale.branchId || b.name === sale.branchId);
        if (dbBranch) branchName = dbBranch.name;
    }

    const descBranch = branchName || 'Unknown Branch';

    dispatch(addTransaction({
        id: Math.random().toString(36).substr(2, 9),
        type: TransactionType.INCOME,
        category: 'Sales',
        amount: sale.total,
        date: sale.date,
        description: `Sale #${sale.id} - ${descBranch} (${sale.counterName || 'Counter'}) (${sale.paymentMethod})`,
        paymentMethod: sale.paymentMethod || 'CASH',
        sector: sale.sector as Sector,
        branchId: sale.branchId
    }));

    return sale.id;
};
