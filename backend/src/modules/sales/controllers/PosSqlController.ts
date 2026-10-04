import { Response } from "express";
import { createHash } from "node:crypto";
import { AppError } from "../../../utils/AppError.js";
import { error } from "../../../config/logger.js";
import { AuthenticatedRequest } from "../../../middlewares/authMiddleware.js";
import { findByKeyDirect } from "../../../integrations/textilesoft/sqlItemSource.js";
import { getSqlUser } from "../../../integrations/textilesoft/sqlAuth.js";
import {
  sqlCounters,
  writePosBillToSql,
  listReturnSources,
  SqlPosError,
  type SqlPosLine,
} from "../../../integrations/textilesoft/sqlPosWriter.js";
import { priceApprovalReason } from "../../../integrations/textilesoft/sqlPosRules.js";
import { unknownEmployeeCodes } from "../../../integrations/textilesoft/sqlEmployees.js";
import { getBillingLimits } from "../../../integrations/textilesoft/sqlBillingLimits.js";

/**
 * SQL-only POS controller (no MongoDB). Counter bills go to Textilesoft's sales tables through
 * sqlPosWriter; items are identified by barcode (the item id the SQL item source hands out).
 * Customers, loyalty points and cash-book side effects are deferred (see the billing plan).
 */

/** Decode the ERP id of a Textilesoft user (sqlAuth.erpIdForSqlUser) back to dbo.newuser.NewUser_ID. */
function sqlUserIdFromErpId(id: unknown): number | null {
  const m = /^ffffffff([0-9a-f]{16})$/i.exec(String(id ?? ""));
  if (!m) return null;
  const n = parseInt(m[1], 16);
  return Number.isSafeInteger(n) ? n : null;
}

/** A manager's OK (price above MRP / zero price / discount over the user's limit) must come from an owner login. */
async function isOwnerApprover(approverId: unknown): Promise<boolean> {
  const sqlId = sqlUserIdFromErpId(approverId);
  if (sqlId === null) return false;
  const user = await getSqlUser(sqlId);
  return user?.role === "owner";
}

/** GET /api/pos/return-sources?item=<barcode> - bills a returned item was sold on, with what was paid per piece. */
export const getReturnSources = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  const barcode = String(req.query.item ?? req.query.barcode ?? "").trim();
  if (!barcode) throw new AppError("This item has no barcode, so it can't be returned.", 404);
  res.status(200).json({ success: true, data: await listReturnSources(barcode) });
};

/** Billing counters (Textilesoft dbo.countername). */
export const getPosCounters = async (_req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    res.status(200).json({ success: true, source: "sql", writes: true, counters: await sqlCounters() });
  } catch (err) {
    error(`[sql-pos] counters failed - ${(err as Error).message}`);
    res.status(503).json({ success: false, message: "The shop database could not be reached to load the billing counters." });
  }
};

/** Textilesoft per-user/counter discount caps; UI hints only, the writer revalidates on submit. */
export const getPosBillingLimits = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  const userId = String((req.user as { username?: string } | undefined)?.username || "");
  const counter = String(req.query.counter || "");
  res.status(200).json({ success: true, data: await getBillingLimits(userId, counter) });
};

// Duplicate-request guard that needs no database table (erp.sales_idempotency does not exist in SSS_copy).
// In-memory, so it only covers this running server: a double click / retry of the SAME checkout (same
// Idempotency-Key) while the first is still saving waits for it, and after it saved returns the same bill
// instead of writing a second one. It is lost on a server restart.
const billInflight = new Map<string, Promise<any>>();
const billDone = new Map<string, { hash: string; result: any; at: number }>();
async function dedupeBill<T>(previewOnly: boolean, scope: string, hash: string, run: () => Promise<T>): Promise<T> {
  if (previewOnly) return run();
  const now = Date.now();
  for (const [k, v] of billDone) if (now - v.at > 6 * 3600_000) billDone.delete(k);
  const prior = billDone.get(scope);
  if (prior) {
    if (prior.hash !== hash) throw new AppError("This Idempotency-Key was already used for a different bill request.", 409);
    return prior.result as T;
  }
  const running = billInflight.get(scope);
  if (running) return (await running) as T;
  const p = run();
  billInflight.set(scope, p);
  try {
    const result = await p;
    billDone.set(scope, { hash, result, at: Date.now() });
    return result;
  } finally {
    billInflight.delete(scope);
  }
}

async function createInvoiceInSql(
  req: AuthenticatedRequest,
  res: Response,
  previewOnly = false,
): Promise<void> {
  try {
    const {
      items,
      discount = 0,
      billLess = 0,
      paymentMethod,
      paidAmount = 0,
      splitPaymentDetails,
      counterName,
      // Customer, loyalty, and points are deliberately deferred for the first SQL billing scope.
      // These values may still be present in old offline queue entries and are ignored here.
      discountApprovedBy,
      priceApprovedBy,
      taxMode,
      salesmanCode: billSalesmanInput,
    } = req.body;
    // Lines whose price needs a manager's OK (₹0, or above MRP) -- checked after the lines are built.
    const priceIssues: string[] = [];
    if (!Array.isArray(items) || items.length === 0)
      throw new AppError("Cart is empty", 400);
    const inclusive =
      String(taxMode || "INCLUSIVE").toUpperCase() !== "EXCLUSIVE";

    const lines: SqlPosLine[] = [];
    for (const it of items) {
      const qty = Number(it.quantity);
      const price = Number(it.price);
      const gst = Number(it.tax) || 0;
      // Negative quantity = an item coming back (POS Return mode): an exchange line. Its refund price and GST
      // come from the barcode's sale (sqlPosWriter.returnLine), not from the till.
      const isReturn = qty < 0;
      if (!Number.isFinite(qty) || qty === 0)
        throw new AppError(
          `Quantity for ${it.name || "an item"} must not be zero`,
          400,
        );
      // The existing writer stores base quantity to two decimal places. Direct API
      // callers must not bypass the checkout's loss-of-precision validation.
      const scaledQty = qty * 100;
      if (Math.round(scaledQty) === 0 || !Number.isSafeInteger(Math.round(scaledQty)) || Math.abs(scaledQty - Math.round(scaledQty)) > 1e-8)
        throw new AppError(
          `Quantity for ${it.name || "an item"} exceeds the existing billing precision of two decimal places`,
          400,
        );
      if (!(price >= 0))
        throw new AppError(
          `Price for ${it.name || "an item"} is not valid`,
          400,
        );
      // Product discount % on the line (Textilesoft's "product discount" box).
      const pdisPct = it.discountPercent === undefined || it.discountPercent === null || it.discountPercent === "" ? 0 : Number(it.discountPercent);
      if (!Number.isFinite(pdisPct) || pdisPct < 0 || pdisPct >= 100)
        throw new AppError(`Discount % for ${it.name || "an item"} must be from 0 to under 100`, 400);
      if (pdisPct > 0 && isReturn)
        throw new AppError(`A returned item (${it.name || "item"}) is refunded at what was paid, without a discount`, 400);
      const salesmanCode = String(it.salesmanCode ?? it.salesman ?? "").trim();
      const unitPriceIncl = inclusive ? price : price * (1 + gst / 100);
      // GST-exclusive till: the writer adds the product's own GST to this (not the till's rate).
      const unitPriceExcl = inclusive ? undefined : price;
      const isQuickEntry =
        it.isQuickEntry === true ||
        String(it.item ?? it._id ?? "").startsWith("QE-");
      if (isQuickEntry) {
        const name = String(it.name ?? "").trim();
        if (!name)
          throw new AppError("Quick Entry line needs a product type", 400);
        if (isReturn)
          throw new AppError(
            `Scan the barcode of the returned ${name} -- returns are matched to their sale by barcode.`,
            400,
          );
        const why = priceApprovalReason(name, unitPriceIncl);
        if (why) priceIssues.push(why);
        lines.push({
          barcode: "",
          name,
          gstRate: gst,
          qty,
          unitPriceIncl,
          unitPriceExcl,
          pdisPct: pdisPct || undefined,
          salesmanCode: salesmanCode || undefined,
          group: name,
        });
        continue;
      }
      // SQL billing resolves the transaction key directly in the shop database.
      const barcode = String(it.barcode || "").trim();
      const product = barcode ? await findByKeyDirect({ barcode }) : undefined;
      if (!product) throw new AppError(`Item not found: ${it.name}`, 404);
      const p = product as unknown as {
        name?: string;
        barcode?: string;
        hsnCode?: string;
        category?: string;
        unit?: string;
        /** The purchase line's MRP in SQL mode (mapping: sellingPrice = mrp). */
        sellingPrice?: number;
      };
      const why = isReturn
        ? null // refund price is set by the server from the sale
        : priceApprovalReason(
            String(p.name || it.name),
            unitPriceIncl,
            Number(p.sellingPrice) || undefined,
          );
      if (why) priceIssues.push(why);
      if (!p.barcode) throw new AppError(`Item ${p.name || it.name} has no SQL barcode`, 400);
      lines.push({
        barcode: String(p.barcode),
        name: String(p.name || it.name),
        hsn: p.hsnCode,
        group: p.category,
        unit: p.unit,
        gstRate: gst,
        qty,
        unitPriceIncl,
        unitPriceExcl,
        pdisPct: pdisPct || undefined,
        salesmanCode: salesmanCode || undefined,
        returnFromBill:
          isReturn && typeof it.returnFromBill === "string"
            ? it.returnFromBill.trim() || undefined
            : undefined,
        returnFromLine:
          isReturn && Number.isSafeInteger(Number(it.returnFromLine))
            ? Number(it.returnFromLine)
            : undefined,
      });
    }

    // Salesperson: Textilesoft stores the employee's code (dbo.newemployee.code) on every bill line (sls_man).
    // The bill-level choice is the default for lines that name none; Textilesoft's own default is "1".
    const billSalesman = String(billSalesmanInput ?? "").trim() || "1";
    if (billSalesman !== "1" || lines.some((l) => l.salesmanCode)) {
      const unknown = await unknownEmployeeCodes([billSalesman, ...lines.map((l) => l.salesmanCode ?? "")].filter((c) => c !== "1"));
      if (unknown.length)
        throw new AppError(`Salesperson ${unknown.join(", ")} is not in the staff list.`, 400);
    }

    // ₹0 lines and prices above MRP need a manager (same approver roles as a large discount).
    if (priceIssues.length) {
      const approverId = priceApprovedBy || discountApprovedBy;
      if (!(await isOwnerApprover(approverId)))
        throw new AppError(
          `Manager approval needed: ${priceIssues.join("; ")}.`,
          400,
        );
    }

    // Discount limits. Textilesoft's own per-user limits (dbo.specialcondion: bill discount %, bill less,
    // product discount %) decide; the writer refuses a bill over them. A manager's approval lifts them.
    // With no specialcondion row for the user, the MIS Controls cap below applies as before.
    // Discount cap is on the new items (returned items don't take the bill discount).
    const billDiscount = Number(discount) || 0;
    const hasLineDiscount = lines.some((l) => (l.pdisPct ?? 0) > 0);
    const sqlLimits = await getBillingLimits(
      // The Textilesoft login name (dbo.newuser.user_id), set on req.user by the SQL auth (toErpUser).
      String((req.user as { username?: string } | undefined)?.username || ""),
      String(counterName || ""),
    );
    let limitsForBill = sqlLimits ?? undefined;
    if (sqlLimits && (billDiscount > 0 || hasLineDiscount)) {
      if (await isOwnerApprover(discountApprovedBy)) limitsForBill = undefined;
    }
    // No dbo.specialcondion row for this user: Textilesoft applies no cap, so neither does the ERP.

    const effectiveBillDiscount = billDiscount;

    const idempotencyKey = previewOnly ? "" : String(req.get("Idempotency-Key") || req.body.idempotencyKey || "").trim();
    if (!previewOnly && (!idempotencyKey || idempotencyKey.length > 200))
      throw new AppError("A valid Idempotency-Key is required to save a counter bill.", 400);
    const expectedTotal = previewOnly ? undefined : Number(req.body.expectedTotal);
    if (!previewOnly && (req.body.expectedTotal === undefined || !Number.isFinite(expectedTotal)))
      throw new AppError("Preview this bill and confirm the server total before saving it.", 400);

    // This first counter-bill scope is cash/card/UPI only; customer credit is deferred. A negative total
    // is settled as a refund by the writer using the original sale-line amount.
    const hasCustomer = false;
    const tenders = {
      paymentMethod,
      paidAmount,
      splitPaymentDetails,
      hasCustomer,
      // The POS sends paidAmount = its own total when paid in full (posInvoiceMapper).
      paidInFull:
        !(Array.isArray(splitPaymentDetails) && splitPaymentDetails.length) &&
        ["cash", "card", "upi", "gpay", "google pay", "phonepe", "paytm"].includes(String(paymentMethod || "cash").toLowerCase()),
    };

    const billScope = `${String(req.user?._id ?? req.user?.id ?? "")}:${String(counterName || "")}:${idempotencyKey}`;
    const billHash = createHash("sha256")
        .update(JSON.stringify({ ...req.body, idempotencyKey: undefined }))
        .digest("hex");
    const result = await dedupeBill(previewOnly, billScope, billHash, () => writePosBillToSql({
      counter: String(counterName || ""),
      userId: (process.env.TEXTILESOFT_POS_USERID || "ERP").slice(0, 20),
      lines,
      salesmanCode: billSalesman,
      billDiscount: effectiveBillDiscount,
      billLess: Number(billLess) || 0,
      limits: limitsForBill,
      tenders,
      idempotencyKey,
      idempotencyScope: `${String(req.user?._id ?? req.user?.id ?? "")}:${String(counterName || "")}`,
      requestHash: createHash("sha256")
        .update(JSON.stringify({ ...req.body, idempotencyKey: undefined }))
        .digest("hex"),
      previewOnly,
      expectedTotal,
    }));

    if (previewOnly) {
      if (!result.preview) throw new SqlPosError("The server could not calculate a checkout preview.", 500);
      res.status(200).json({ success: true, preview: result.preview });
      return;
    }

    res.status(201).json({
      success: true,
      message: "Bill saved to the shop database",
      invoice: {
        _id: `sql:${result.sysidandbill}`,
        invoiceNo: result.billNo,
        billNo: result.billNo,
        counterName: result.counter,
        totalAmount: result.total,
        createdAt: result.datetime,
        source: "sql",
      },
    });
  } catch (err) {
    const status =
      err instanceof SqlPosError
        ? err.statusCode
        : (err as { statusCode?: number }).statusCode || 500;
    error(`Create Invoice (SQL) Failed: ${(err as Error).message}`);
    res
      .status(status)
      .json({ success: false, message: (err as Error).message });
  }
}

export const previewInvoice = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  await createInvoiceInSql(req, res, true);
};

export const createInvoice = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  await createInvoiceInSql(req, res);
};

export default { getReturnSources, getPosCounters, getPosBillingLimits, previewInvoice, createInvoice };
