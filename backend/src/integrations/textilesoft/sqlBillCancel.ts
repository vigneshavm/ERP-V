import { SqlWriteError, withSqlTransaction, type Row, type SqlTx } from "./sqlWrite.js";
import { SQL_ID_PREFIX } from "./sqlSales.js";

/**
 * Cancel a finished bill, copying Textilesoft's PendingCancelCashBillView.aspx:
 *   1. only a live bill (sales2.status = '0') whose cash has NOT been collected yet -- bills listed in
 *      dbo.cash_collection_2 (cash_barcode = sysidandbill) are refused, exactly as the old screen never offers them;
 *   2. UPDATE sales2 SET status='1', cancel_bilno=..., date1=<today> WHERE sysidandbill=<id>;
 *   3. UPDATE salsntry SET status='1' for the bill's lines (systemidbill = sysidandbill).
 * Like the old program it does NOT touch customer points, credit or payments, and stock needs no update because
 * stock is computed from salsntry (cancelled lines are ignored). Everything runs in one transaction.
 *
 * cancel_bilno: the only cancelled bill inspected carried 1, so the same marker is written; the old program's
 * numbering rule is not in the recovered SQL (see docs/audits/LEGACY_SQL_FINDINGS_2026-10-02.md).
 */
export interface CancelBillResult {
  billNo: string;
  sysId: string;
  linesCancelled: number;
}

const keyOf = (id: string): string => {
  const raw = id.startsWith(SQL_ID_PREFIX) ? id.slice(SQL_ID_PREFIX.length) : id;
  if (!/^[A-Za-z0-9_-]{1,40}$/.test(raw)) throw new SqlWriteError("Invoice not found.", 404);
  return raw;
};

/** Refuses a bill whose cash was already collected (day closed) -- shared by cancel and edit. */
export async function assertCashNotCollected(tx: SqlTx, key: string, verb: string): Promise<void> {
  // Safe-fail: if the cash-collection table can't be found we cannot prove the day is still open.
  const [exists] = await tx.query("SELECT OBJECT_ID('dbo.cash_collection_2') AS id");
  if (!exists?.id)
    throw new SqlWriteError(`Cannot confirm whether this bill's cash was collected (cash collection table not found). Nothing was ${verb}.`, 503);
  const collected = await tx.query("SELECT TOP 1 1 AS x FROM dbo.[cash_collection_2] WHERE [cash_barcode] = @k", { k: key });
  if (collected.length)
    throw new SqlWriteError(`This bill's cash has already been collected (day closed), so it can no longer be ${verb}.`, 409, "CASH_COLLECTED");
}

export async function cancelSqlBill(id: string): Promise<CancelBillResult> {
  const key = keyOf(String(id ?? ""));
  return withSqlTransaction("Bill cancel", async (tx) => {
    const [head] = await tx.query(
      "SELECT TOP 1 [mode], [status], [date] FROM dbo.[sales2] WITH (UPDLOCK, ROWLOCK) WHERE [sysidandbill] = @k ORDER BY [No] DESC",
      { k: key },
    );
    if (!head) throw new SqlWriteError("Invoice not found.", 404);
    if (String(head.status ?? "").trim() === "1")
      throw new SqlWriteError("This bill is already cancelled.", 409, "ALREADY_CANCELLED");
    if (String(head.status ?? "").trim() !== "0")
      throw new SqlWriteError("Only a live bill can be cancelled.", 409, "NOT_LIVE_BILL");

    await assertCashNotCollected(tx, key, "cancelled");

    const cancelled = await tx.update("sales2", { status: "1", cancel_bilno: "1" }, { sysidandbill: key });
    if (cancelled !== 1) throw new SqlWriteError(`Expected to cancel one bill, found ${cancelled}. Nothing was changed.`, 409);
    // date1 is set separately as a real date (the legacy page wrote the current date/time into it).
    await tx.query("UPDATE dbo.[sales2] SET [date1] = CAST(GETDATE() AS date) WHERE [sysidandbill] = @k", { k: key });

    const [n] = await tx.query(
      "UPDATE dbo.[salsntry] SET [status] = '1' WHERE [systemidbill] = @k; SELECT @@ROWCOUNT AS n",
      { k: key },
    );
    return { billNo: String((head as Row).mode ?? ""), sysId: key, linesCancelled: Number(n?.n ?? 0) };
  });
}

