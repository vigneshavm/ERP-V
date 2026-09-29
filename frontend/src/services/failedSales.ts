import { db, OfflineSale } from './db';

/**
 * Bills the server REJECTED (as opposed to bills it couldn't be reached for). Retrying those unchanged
 * can never succeed, so instead of looping in the offline queue forever they are marked `failed` and
 * listed on the POS screen ("Failed bills") for someone to retry after fixing the cause, or dismiss.
 */

/** Fired on window whenever the failed-bills list may have changed, so the POS badge can refresh. */
export const FAILED_SALES_EVENT = 'pos:failed-sales-changed';

export const notifyFailedSalesChanged = (): void => {
    window.dispatchEvent(new Event(FAILED_SALES_EVENT));
};

/**
 * True when the server answered and refused the bill (bad data: 400/404/422 and similar, or a 2xx
 * with success=false). Network errors, 5xx, and auth/rate-limit answers (401/403/408/429) are
 * temporary, so those bills stay in the normal retry queue.
 */
export function isPermanentRejection(err: any): boolean {
    if (err?.serverRefused) return true;
    const status: number | undefined = err?.response?.status;
    if (!status) return false;
    if ([401, 403, 408, 429].includes(status)) return false;
    return status >= 400 && status < 500;
}

/** The server's own explanation when there is one (e.g. "Insufficient stock for SHIRT ..."). */
export function rejectionMessage(err: any): string {
    return err?.response?.data?.message || err?.message || 'The server rejected this bill';
}

/** Error thrown when the server replies 2xx but says it did not save the bill. */
export function serverRefusedError(message?: string): Error {
    const e = new Error(message || 'Server did not confirm the sale was saved') as Error & { serverRefused: boolean };
    e.serverRefused = true;
    return e;
}

export async function listFailedSales(): Promise<OfflineSale[]> {
    const rows = await db.offlineSales.filter(s => !s.synced && !!s.failed).toArray();
    return rows.sort((a, b) => (a.date < b.date ? 1 : -1));
}

/** Puts a failed bill back into the normal queue (call SyncManager.syncOfflineSales() afterwards). */
export async function requeueFailedSale(localId: number): Promise<void> {
    await db.offlineSales.update(localId, { failed: false, error: undefined, failedAt: undefined, retryCount: 0 });
    notifyFailedSalesChanged();
}

/** Removes a failed bill from this device for good (it was never saved on the server). */
export async function dismissFailedSale(localId: number): Promise<void> {
    await db.offlineSales.delete(localId);
    notifyFailedSalesChanged();
}
