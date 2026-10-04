import type { AppDispatch, RootState } from "../store";
import type { Sale } from "../../types/sales";
import { recordSale } from "../slices/posSlice";
import { deductStock } from "../slices/inventorySlice";
import api from "../../services/api";
import { buildPosInvoicePayload } from "../../services/posInvoiceMapper";

/** SQL counter bills become locally visible only after the server confirms persistence.
 * Failures reject checkout: no offline queue, local financial journal or rewards shadow write.
 */
export const processSale = (sale: Sale) => async (
    dispatch: AppDispatch,
    _getState: () => RootState,
): Promise<string> => {
    if (!navigator.onLine) {
        throw new Error("SQL billing is unavailable offline. Reconnect before saving this bill.");
    }

    const payload = buildPosInvoicePayload(sale);
    const { data } = await api.post("/api/pos/invoice", payload, {
        headers: { "Idempotency-Key": payload.idempotencyKey },
    });
    if (data?.success !== true) {
        throw new Error(data?.message || "The shop database did not confirm this bill. No receipt will be printed.");
    }
    const serverNo = data.invoice?.billNo || data.invoice?.invoiceNo;
    const rawTotal = data.invoice?.totalAmount;
    const savedTotal = Number(rawTotal);
    if (typeof serverNo !== "string" || !serverNo.trim() || rawTotal === undefined || rawTotal === null || rawTotal === "" || !Number.isFinite(savedTotal)) {
        throw new Error("The server confirmation is incomplete. Verify the bill in the shop database before attempting another save.");
    }

    sale.id = serverNo.trim();
    sale.total = savedTotal;
    dispatch(recordSale(sale));
    sale.items.forEach((item, index) => {
        dispatch(deductStock({ id: item.id, qty: payload.items[index].quantity }));
    });
    return sale.id;
};
