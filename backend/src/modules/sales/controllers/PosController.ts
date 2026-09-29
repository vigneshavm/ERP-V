import { Response } from "express";
import mongoose from "mongoose";
import { container } from "tsyringe";
import { AppError } from "../../../utils/AppError.js";
import { error } from "../../../config/logger.js";
import Item from "../../inventory/models/Item.js";
import Invoice from "../../sales/models/Invoice.js";
import Customer from "../../crm/models/Customer.js";
import CashbankTransaction from "../../finance/models/CashbankTransaction.js";
import BankAccount from "../../finance/models/BankAccount.js";
import Tenant from "../../core/models/Tenant.js";
import User from "../../core/models/User.js";
import StockLog from "../../inventory/models/StockLog.js";
import { stockReservationManager } from "../../inventory/services/StockReservationService.js";
import { SalesService } from "../services/SalesService.js";
import { AuthenticatedRequest } from '../../../middlewares/authMiddleware.js';
import { isSqlItemSource } from "../../../config/itemDataSource.js";
import { isSqlPosWriteEnabled, sqlCounters, writePosBillToSql, SqlPosError, type SqlPosLine } from "../../../integrations/textilesoft/sqlPosWriter.js";

// Mirrors frontend/src/types/tenant/mis.ts's DEFAULT_MIS_CONFIG for the three fields this
// enforcement check needs -- kept as the fallback so a tenant that has never opened
// Settings -> MIS Controls (tenant.misConfig undefined) is still subject to the same policy
// the Settings UI shows them by default, rather than silently skipping enforcement.
const DEFAULT_DISCOUNT_POLICY = {
    allowDiscountOverride: true,
    maxDiscountPercent: 10,
    requireApprovalForHighDiscount: false
};

// Roles allowed to approve a discount that exceeds the tenant's cap. Mirrors the role
// enum on backend/src/modules/core/models/User.ts.
const DISCOUNT_APPROVER_ROLES = ['owner', 'co-owner', 'manager'];

// Roles allowed to edit a completed POS invoice's quantities/prices/discount. Correcting a
// finished bill (and reversing/reapplying the stock it moved) is sensitive enough that it's
// restricted the same way discount approval is, rather than left open to any logged-in user.
const INVOICE_EDIT_ROLES = ['owner', 'co-owner', 'manager'];

/**
 * @desc    Get all POS products (placeholder)
 * @route   GET /api/pos/products
 * @access  Private
 */
export const getPosProducts = async (_req: AuthenticatedRequest, res: Response): Promise<void> => {
    // TODO: Implement POS product fetching logic
    res.status(200).json({
        success: true,
        message: "Get POS products"
    });
};

/**
 * @swagger
 * /api/pos/summary:
 *   get:
 *     summary: Get POS summary
 *     tags: [Sales - POS]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: POS summary retrieved
 */
export const getPosSummary = async (_req: AuthenticatedRequest, res: Response): Promise<void> => {
    res.status(200).json({ message: 'POS summary endpoint' });
};

/**
 * @swagger
 * /api/pos/sale:
 *   post:
 *     summary: Process a POS sale
 *     tags: [Sales - POS]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       201:
 *         description: POS sale processed
 */
export const processPosSale = async (_req: AuthenticatedRequest, res: Response): Promise<void> => {
    res.status(201).json({ message: 'POS sale processed' });
};

/**
 * @desc    Create a new POS Invoice
 * @route   POST /api/pos/invoice
 * @access  Private
 */
/**
 * @desc    Billing counters for the POS picker. SQL mode: Textilesoft's counters (dbo.countername);
 *          otherwise the ERP's own store counters are used by the client, so this returns source 'erp'.
 * @route   GET /api/pos/counters
 */
export const getPosCounters = async (_req: AuthenticatedRequest, res: Response): Promise<void> => {
    if (!isSqlItemSource()) {
        res.status(200).json({ success: true, source: 'erp', counters: [] });
        return;
    }
    try {
        res.status(200).json({ success: true, source: 'sql', writes: isSqlPosWriteEnabled(), counters: await sqlCounters() });
    } catch (err) {
        error(`[sql-pos] counters failed - ${(err as Error).message}`);
        res.status(503).json({ success: false, message: 'The shop database could not be reached to load the billing counters.' });
    }
};

/**
 * POS bill -> Textilesoft (dbo.sales2 + dbo.salsntry) instead of MongoDB, when ITEM_DATA_SOURCE=sql and
 * TEXTILESOFT_POS_WRITE=on. Stock is not moved separately: Textilesoft (and the ERP's SQL stock read)
 * works stock out from the sale lines themselves. Customers stay in MongoDB (read here for the name/phone
 * printed on the bill); no Invoice, StockLog or cash-book entry is written to MongoDB for these bills.
 */
async function createInvoiceInSql(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
        const { items, discount = 0, paymentMethod, paidAmount = 0, counterName, customerId, customerName, customerPhone, discountApprovedBy, taxMode } = req.body;
        if (!Array.isArray(items) || items.length === 0) throw new AppError('Cart is empty', 400);
        const inclusive = String(taxMode || 'INCLUSIVE').toUpperCase() !== 'EXCLUSIVE';

        const lines: SqlPosLine[] = [];
        for (const it of items) {
            const qty = Number(it.quantity);
            const price = Number(it.price);
            const gst = Number(it.tax) || 0;
            if (!(qty > 0)) throw new AppError(`Quantity for ${it.name || 'an item'} must be greater than zero`, 400);
            if (!(price >= 0)) throw new AppError(`Price for ${it.name || 'an item'} is not valid`, 400);
            const unitPriceIncl = inclusive ? price : price * (1 + gst / 100);
            const isQuickEntry = it.isQuickEntry === true || String(it.item ?? it._id ?? '').startsWith('QE-');
            if (isQuickEntry) {
                const name = String(it.name ?? '').trim();
                if (!name) throw new AppError('Quick Entry line needs a product type', 400);
                lines.push({ barcode: '', name, gstRate: gst, qty, unitPriceIncl, group: name });
                continue;
            }
            // Items are mirrored from the shop DB into MongoDB; the barcode ties the line to its purchase lot.
            const product = await Item.findOne({ _id: it.item || it._id, tenantId: req.tenantId }).lean();
            if (!product) throw new AppError(`Item not found: ${it.name}`, 404);
            const p = product as unknown as { name?: string; barcode?: string; hsnCode?: string; category?: string; unit?: string };
            if (!p.barcode) throw new AppError(`${p.name || it.name} has no barcode, so it can't be billed into the shop database`, 400);
            lines.push({ barcode: String(p.barcode), name: String(p.name || it.name), hsn: p.hsnCode, group: p.category, unit: p.unit, gstRate: gst, qty, unitPriceIncl });
        }

        // Same discount cap as the MongoDB path (MIS Controls).
        const gross = lines.reduce((s, l) => s + l.qty * l.unitPriceIncl, 0);
        const billDiscount = Number(discount) || 0;
        if (billDiscount > 0) {
            const tenant = await Tenant.findById(req.tenantId);
            const mis = { ...DEFAULT_DISCOUNT_POLICY, ...(tenant?.misConfig || {}) };
            const cap = typeof req.user?.maxDiscountPercent === 'number' ? req.user.maxDiscountPercent : mis.maxDiscountPercent;
            const pct = gross > 0 ? (billDiscount / gross) * 100 : 0;
            if (pct > cap) {
                if (!mis.allowDiscountOverride) throw new AppError(`Discount of ${pct.toFixed(1)}% exceeds the allowed maximum of ${cap}%. Discount override is disabled for this store.`, 400);
                if (mis.requireApprovalForHighDiscount) {
                    const approver = discountApprovedBy ? await User.findOne({ _id: discountApprovedBy, tenantId: req.tenantId }) : null;
                    if (!approver || !DISCOUNT_APPROVER_ROLES.includes(approver.role)) {
                        throw new AppError(`Discount of ${pct.toFixed(1)}% exceeds the allowed maximum of ${cap}% and requires manager approval.`, 400);
                    }
                }
            }
        }

        let name = customerName as string | undefined;
        let phone = customerPhone as string | undefined;
        if (customerId && (!name || !phone)) {
            const cust = await Customer.findOne({ _id: customerId, tenantId: req.tenantId }).lean() as { name?: string; phone?: string } | null;
            name = name || cust?.name;
            phone = phone || cust?.phone;
        }

        const total = Math.max(0, gross - billDiscount);
        const method = String(paymentMethod || 'cash').toLowerCase();
        const paid = Math.min(Number(paidAmount) || 0, total);
        const payment = { cash: 0, card: 0, upi: 0, credit: Math.max(0, total - paid) };
        if (method === 'card') payment.card = paid;
        else if (method === 'upi') payment.upi = paid;
        else payment.cash = paid;

        const result = await writePosBillToSql({
            counter: String(counterName || ''),
            userId: (process.env.TEXTILESOFT_POS_USERID || 'ERP').slice(0, 20),
            customerName: name && name !== 'Walk-in Customer' ? name : undefined,
            phone: phone || undefined,
            lines,
            billDiscount,
            payment,
        });

        res.status(201).json({
            success: true,
            message: 'Bill saved to the shop database',
            invoice: {
                _id: `sql:${result.sysidandbill}`,
                invoiceNo: result.billNo,
                billNo: result.billNo,
                counterName: result.counter,
                totalAmount: result.total,
                createdAt: result.datetime,
                source: 'sql',
            },
        });
    } catch (err) {
        const status = err instanceof SqlPosError ? err.statusCode : (err as { statusCode?: number }).statusCode || 500;
        error(`Create Invoice (SQL) Failed: ${(err as Error).message}`);
        res.status(status).json({ success: false, message: (err as Error).message });
    }
}

export const createInvoice = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    // SQL mode with POS writes switched on: the bill goes to the shop database only (see createInvoiceInSql).
    if (isSqlItemSource() && isSqlPosWriteEnabled()) {
        await createInvoiceInSql(req, res);
        return;
    }

    const session = await mongoose.startSession();
    session.startTransaction();

    try {
        // Resolved dynamically (same pattern as PurchaseController) to reduce stock through the
        // same audited, FIFO-batch-aware path the purchase side uses for addStock() — the
        // previous inline `product.stockQty -= item.quantity` skipped batch tracking and never
        // wrote a StockLog entry.
        const { container } = await import('tsyringe');
        const { InventoryService } = await import('../../inventory/services/InventoryService.js');
        const inventoryService = container.resolve(InventoryService);

        const {
            customerId,
            items,
            discount = 0,
            paymentMethod,
            bankAccount,
            paidAmount = 0,
            changeReturned = 0,
            splitPaymentDetails = [],
            creditApplied = 0,
            previousDueAmount = 0,
            // Id of the manager/owner/co-owner who approved a discount above the tenant's
            // cap (POS UI collects this via a lightweight in-app approval prompt rather
            // than a full password re-auth). Optional -- only checked when the discount
            // actually exceeds maxDiscountPercent and requireApprovalForHighDiscount is on.
            discountApprovedBy,
            // Invoice Billing: MRP-Pending flag -- lets a cashier raise this bill at a
            // provisional price before the final MRP for the stock is confirmed. See
            // IInvoice.ts for the full rationale.
            isMrpPending = false,
            mrpPendingNote,
            // Wholesale/Retail (WR) Billing: which track this sale belongs to, and (optionally)
            // the WR counter it was billed from. Defaults to 'RETAIL' so every existing caller
            // (POS checkout) is unaffected. See IInvoice.ts for the full rationale.
            saleChannel = 'RETAIL',
            counterName
        } = req.body;

        // 1. Basic Validation
        if (!items || items.length === 0) {
            throw new AppError("Cart is empty", 400);
        }

        const totalPaid = Number(paidAmount) || 0;
        const totalChange = Number(changeReturned) || 0;
        const actualReceived = totalPaid - totalChange;

        // 2. Process Items & Calculate Totals
        let subtotal = 0;
        let taxTotal = 0;
        let totalItemDiscount = 0;
        const processedItems = [];

        for (const item of items) {
            // POS Quick Entry line (product type + typed price, cart id "QE-..."): there is no stock
            // item or lot behind it, so it is saved as a plain line (name, qty, price, GST) and moves
            // no stock. It used to go through the Item lookup below and fail the whole bill.
            const isQuickEntry = item.isQuickEntry === true || String(item.item ?? item._id ?? '').startsWith('QE-');
            if (isQuickEntry) {
                const qeName = String(item.name ?? '').trim();
                const qeQty = Number(item.quantity);
                const qePrice = Number(item.price);
                if (!qeName) throw new AppError('Quick Entry line needs a product type', 400);
                if (!(qeQty > 0)) throw new AppError(`Quantity for ${qeName} must be greater than zero`, 400);
                if (!(qePrice >= 0)) throw new AppError(`Price for ${qeName} is not valid`, 400);

                const qeTotal = qeQty * qePrice;
                const qeTax = Number(item.tax) || 0;
                subtotal += qeTotal;
                taxTotal += (qeTotal * qeTax) / 100;
                totalItemDiscount += Number(item.discount) || 0;
                processedItems.push({
                    isQuickEntry: true,
                    name: qeName,
                    quantity: qeQty,
                    price: qePrice,
                    total: qeTotal,
                    tax: qeTax,
                    gstRate: qeTax,
                    discount: Number(item.discount) || 0
                });
                continue;
            }

            // Use findById directly for better error handling if needed, but findOne with tenantId is safer
            const product = await Item.findOne({ _id: item.item || item._id, tenantId: req.tenantId }).session(session);

            if (!product) {
                throw new AppError(`Item not found: ${item.name}`, 404);
            }

            const reservedQty = stockReservationManager.getReservedQuantity(req.tenantId.toString(), product._id.toString());
            const availableNetStock = product.stockQty - reservedQty;

            if (availableNetStock < item.quantity) {
                throw new AppError(`Insufficient stock for ${product.name}. Available (Net of Holds): ${availableNetStock}`, 400);
            }

            // Calculate Item Totals
            const itemTotal = item.quantity * item.price;
            subtotal += itemTotal;

            const taxAmount = (itemTotal * (item.tax || 0)) / 100;
            taxTotal += taxAmount;

            totalItemDiscount += Number(item.discount) || 0;

            processedItems.push({
                item: product._id,
                quantity: item.quantity,
                price: item.price,
                total: itemTotal,
                tax: item.tax || 0,
                discount: item.discount || 0
            });

            // 3. Update Stock — FIFO batch consumption + StockLog audit entry, inside this
            // same Mongo transaction (reduceStock accepts a session so this stays atomic).
            // The insufficient-stock check above already accounts for reservation holds; this
            // re-checks against actual persisted stockQty (reduceStock's own safety net).
            await inventoryService.reduceStock(
                product._id.toString(),
                item.quantity,
                req.tenantId,
                req.user,
                'SALES',
                session
            );
        }

        // 2b. Discount Policy Enforcement (MIS Controls -> allowDiscountOverride /
        // maxDiscountPercent / requireApprovalForHighDiscount). Previously these flags
        // were set in Settings but never read by any backend controller -- a client
        // could send any discount value and it would be trusted outright. Both the
        // bill-level `discount` and the sum of per-item discounts count toward the cap,
        // since a cashier could otherwise bypass the bill-level check by discounting
        // each line instead.
        const tenantForPolicy = await Tenant.findById(req.tenantId).session(session);
        const misConfig = { ...DEFAULT_DISCOUNT_POLICY, ...(tenantForPolicy?.misConfig || {}) };

        // Per-user discount permission: a cashier with an explicit User.maxDiscountPercent
        // gets that ceiling instead of the tenant-wide default, letting an owner grant (or
        // restrict) individual staff without touching the shop-wide MIS Controls setting.
        // Undefined/null on the user means "inherit the tenant cap".
        const requestingUserMaxDiscount = req.user?.maxDiscountPercent;
        const effectiveMaxDiscountPercent = typeof requestingUserMaxDiscount === 'number'
            ? requestingUserMaxDiscount
            : misConfig.maxDiscountPercent;

        const totalDiscountAmount = (Number(discount) || 0) + totalItemDiscount;
        const discountPercent = subtotal > 0 ? (totalDiscountAmount / subtotal) * 100 : 0;

        if (totalDiscountAmount > 0 && discountPercent > effectiveMaxDiscountPercent) {
            if (!misConfig.allowDiscountOverride) {
                throw new AppError(
                    `Discount of ${discountPercent.toFixed(1)}% exceeds the allowed maximum of ${effectiveMaxDiscountPercent}%. Discount override is disabled for this store.`,
                    400
                );
            }

            if (misConfig.requireApprovalForHighDiscount) {
                if (!discountApprovedBy) {
                    throw new AppError(
                        `Discount of ${discountPercent.toFixed(1)}% exceeds the allowed maximum of ${effectiveMaxDiscountPercent}% and requires manager approval.`,
                        400
                    );
                }
                const approver = await User.findOne({ _id: discountApprovedBy, tenantId: req.tenantId }).session(session);
                if (!approver || !DISCOUNT_APPROVER_ROLES.includes(approver.role)) {
                    throw new AppError("Discount approval must come from a manager, co-owner, or owner.", 400);
                }
            }
        }

        const {
            customerPhone,
            customerName,
            marketingConsentOptIn = false,
            pointsToRedeem = 0
        } = req.body;

        const finalTotal = subtotal + taxTotal - discount;

        // 4. Create Invoice
        // Wholesale sales get their own "WR-" number series, scanned separately from retail's
        // "INV-" series, so WR Sales Bill View / reports can rely on the prefix alone.
        const isWholesale = saleChannel === 'WHOLESALE';
        const invoicePrefix = isWholesale ? 'WR' : 'INV';
        const lastInvoice = await Invoice.findOne({
            tenantId: req.tenantId,
            invoiceNo: new RegExp(`^${invoicePrefix}-`)
        }).sort({ createdAt: -1 }).session(session);
        let nextInvoiceNum = 1;
        if (lastInvoice && lastInvoice.invoiceNo) {
            const match = lastInvoice.invoiceNo.match(/-(\d+)$/);
            if (match) nextInvoiceNum = parseInt(match[1]) + 1;
        }
        const invoiceNo = `${invoicePrefix}-${new Date().getFullYear()}-${String(nextInvoiceNum).padStart(5, '0')}`;

        const paymentStatus = (actualReceived + creditApplied) >= finalTotal ? 'paid' : (actualReceived > 0 ? 'partial' : 'unpaid');

        // Customer Lookup / Auto-Registration (Optional Phone BRD §3 & §4)
        let customer = null;
        let resolvedCustomerId = customerId || null;

        if (!resolvedCustomerId && (customerPhone || customerName)) {
            let existingCust = null;
            if (customerPhone) {
                existingCust = await Customer.findOne({ phone: customerPhone, tenantId: req.tenantId }).session(session);
            }

            if (existingCust) {
                customer = existingCust;
                resolvedCustomerId = existingCust._id;
            } else {
                const newCust = new Customer({
                    name: customerName || 'Walk-in Customer',
                    phone: customerPhone || '',
                    owner: req.user._id,
                    tenantId: req.tenantId,
                    marketingConsent: {
                        optIn: Boolean(marketingConsentOptIn),
                        consentDate: new Date(),
                        consentSource: 'POS_CHECKOUT',
                        consentVersion: 'v1.0',
                        channels: { sms: Boolean(customerPhone), email: false, whatsapp: Boolean(customerPhone) }
                    }
                });
                await newCust.save({ session });
                customer = newCust;
                resolvedCustomerId = newCust._id;
            }
        } else if (customerId) {
            customer = await Customer.findOne({ _id: customerId, tenantId: req.tenantId }).session(session);
        }

        // Update Customer Marketing Opt-in if explicitly passed
        if (customer && typeof marketingConsentOptIn === 'boolean') {
            if (!customer.marketingConsent) {
                customer.marketingConsent = {
                    optIn: marketingConsentOptIn,
                    consentDate: new Date(),
                    consentSource: 'POS_CHECKOUT',
                    consentVersion: 'v1.0',
                    channels: { sms: Boolean(customer.phone), email: false, whatsapp: Boolean(customer.phone) }
                };
            } else {
                customer.marketingConsent.optIn = marketingConsentOptIn;
                customer.marketingConsent.consentDate = new Date();
            }
        }

        // Loyalty Points Redemption (BRD §10)
        let pointsDiscount = 0;
        if (customer && pointsToRedeem > 0) {
            const { LoyaltyService } = await import("../../crm/services/LoyaltyService.js");
            pointsDiscount = await LoyaltyService.redeemPoints(
                req.tenantId,
                customer._id.toString(),
                invoiceNo,
                pointsToRedeem,
                session
            );
        }

        // Customer Dues & Analytics Update (BRD §5, §12 & §20)
        if (customer) {
            const amountToPay = finalTotal - pointsDiscount;
            const totalCovered = actualReceived + creditApplied;
            const balanceDue = amountToPay - totalCovered;

            if (balanceDue > 0) customer.dues += balanceDue;
            if (creditApplied > 0) customer.dues += creditApplied;

            // Update RFM Analytics Metrics
            customer.totalSpend = (customer.totalSpend || 0) + actualReceived;
            customer.totalOrders = (customer.totalOrders || 0) + 1;
            customer.averageOrderValue = Number((customer.totalSpend / customer.totalOrders).toFixed(2));
            customer.lastPurchaseDate = new Date();
            if (!customer.firstPurchaseDate) customer.firstPurchaseDate = new Date();

            // Automatic Loyalty Points Earning (BRD §7 & §8)
            if (paymentStatus === 'paid' || actualReceived > 0) {
                const { LoyaltyService } = await import("../../crm/services/LoyaltyService.js");
                await LoyaltyService.earnPoints(
                    req.tenantId,
                    customer._id.toString(),
                    invoiceNo,
                    actualReceived,
                    session
                );
            }

            await customer.save({ session });
        }

        const invoiceData = {
            invoiceNo,
            customer: resolvedCustomerId || null,
            items: processedItems,
            subtotal,
            tax: taxTotal,
            discount,
            totalAmount: finalTotal,
            paidAmount: actualReceived,
            creditApplied,
            previousDueAmount,
            paymentStatus,
            paymentMethod,
            splitPaymentDetails,
            bankAccount: bankAccount || null,
            tenantId: req.tenantId,
            createdBy: req.user._id,
            isMrpPending: Boolean(isMrpPending),
            mrpPendingNote: isMrpPending ? (mrpPendingNote || undefined) : undefined,
            saleChannel: isWholesale ? 'WHOLESALE' : 'RETAIL',
            counterName: counterName || undefined
        };

        const newInvoice = await Invoice.create([invoiceData], { session });

        // 5. Handle Money In (Cashbank)
        if (actualReceived > 0) {
            if (paymentMethod === 'split') {
                for (const split of splitPaymentDetails) {
                    if (Number(split.amount) > 0) {
                        await CashbankTransaction.create([{
                            type: 'in',
                            amount: Number(split.amount),
                            fromAccount: 'sale',
                            toAccount: split.method === 'cash' ? 'cash_in_hand' : (bankAccount || 'bank_account'),
                            description: `Split Sale: ${invoiceNo} (${split.method})`,
                            date: new Date(),
                            userId: req.user._id,
                            tenantId: req.tenantId,
                            referenceId: newInvoice[0]._id,
                            referenceModel: 'Invoice'
                        }], { session });
                    }
                }
            } else {
                let toAccount = 'cash_in_hand';
                if (paymentMethod === 'bank_transfer' && bankAccount) {
                    toAccount = bankAccount;
                    await BankAccount.findOneAndUpdate(
                        { _id: bankAccount, tenantId: req.tenantId },
                        { $inc: { currentBalance: actualReceived } },
                        { session }
                    );
                }

                await CashbankTransaction.create([{
                    type: 'in',
                    amount: actualReceived,
                    fromAccount: 'sale',
                    toAccount: paymentMethod === 'cash' ? 'cash' : toAccount,
                    description: `POS Sale: ${invoiceNo}`,
                    date: new Date(),
                    userId: req.user._id,
                    tenantId: req.tenantId,
                    referenceId: newInvoice[0]._id,
                    referenceModel: 'Invoice'
                }], { session });
            }
        }

        await session.commitTransaction();
        res.status(201).json({
            success: true,
            message: "Invoice created successfully",
            invoice: newInvoice[0]
        });

    } catch (err) {
        await session.abortTransaction();
        error(`Create Invoice Failed: ${(err as Error).message}`);
        res.status((err as any).statusCode || 500).json({ success: false, message: (err as Error).message });
    } finally {
        session.endSession();
    }
};

/**
 * @desc    List invoices still awaiting final MRP confirmation for this tenant
 * @route   GET /api/pos/invoice/mrp-pending
 * @access  Private
 */
export const getMrpPendingInvoices = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
        const tenantId = req.tenantId;
        const invoices = await Invoice.find({
            tenantId,
            isMrpPending: true,
            isDeleted: { $ne: true }
        })
            .sort({ createdAt: -1 })
            .populate('customer', 'name phone');

        res.status(200).json({ success: true, invoices });
    } catch (err) {
        res.status(500).json({ success: false, message: (err as Error).message });
    }
};

/**
 * @desc    Confirm final MRP on a bill raised with the MRP-Pending flag. Optionally corrects
 *          each item's price (and recomputes totals from the corrected prices) so the bill
 *          reflects the now-confirmed MRP; if no corrected prices are given, this simply clears
 *          the flag on the existing amounts. This is intentionally narrower than a general
 *          invoice-edit endpoint (see the separate POS sale/invoice edit work) -- it only ever
 *          runs once, only while isMrpPending is true, and only touches price/tax/total fields.
 * @route   PATCH /api/pos/invoice/:id/finalize-mrp
 * @access  Private
 */
export const finalizeMrpPricing = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
        const tenantId = req.tenantId;
        const invoice = await Invoice.findOne({ _id: req.params.id, tenantId });
        if (!invoice) {
            res.status(404).json({ success: false, message: "Invoice not found" });
            return;
        }
        if (!invoice.isMrpPending) {
            res.status(400).json({ success: false, message: "This invoice's MRP is already finalized" });
            return;
        }

        const { items: correctedItems } = req.body as { items?: Array<{ item: string; price: number }> };

        if (Array.isArray(correctedItems) && correctedItems.length > 0) {
            const priceByItemId = new Map(correctedItems.map((c) => [String(c.item), Number(c.price)]));

            let subtotal = 0;
            let taxTotal = 0;
            for (const line of invoice.items) {
                const correctedPrice = priceByItemId.get(String(line.item));
                if (typeof correctedPrice === 'number' && !Number.isNaN(correctedPrice)) {
                    line.price = correctedPrice;
                }
                const itemTotal = line.quantity * line.price;
                const taxAmount = (itemTotal * (line.gstRate || 0)) / 100;
                line.taxableAmount = itemTotal;
                line.tax = taxAmount;
                line.total = itemTotal + taxAmount - (line.discount || 0);
                subtotal += itemTotal;
                taxTotal += taxAmount;
            }

            invoice.subtotal = subtotal;
            invoice.tax = taxTotal;
            invoice.totalAmount = subtotal + taxTotal - (invoice.discount || 0);
            invoice.paymentStatus = (invoice.paidAmount + invoice.creditApplied) >= invoice.totalAmount
                ? 'paid'
                : (invoice.paidAmount > 0 ? 'partial' : 'unpaid');
        }

        invoice.isMrpPending = false;
        invoice.mrpFinalizedAt = new Date();
        invoice.mrpFinalizedBy = req.user._id;

        await invoice.save();
        res.status(200).json({ success: true, message: "MRP finalized", invoice });
    } catch (err) {
        res.status(500).json({ success: false, message: (err as Error).message });
    }
};

/**
 * @desc    Correct a completed POS invoice's line quantities/prices/discount (and the bill-level
 *          discount), reconciling stock for any quantity change in the same transaction.
 *          Deliberately narrow: it only ever adjusts existing line items -- it cannot add or
 *          remove a line, and it does not touch payment method/amount or cashbank entries, since
 *          reopening the money side of a settled sale is a much larger, separate concern. Any
 *          other correction (wrong item entirely, refund, payment change) still goes through
 *          Sales Return / Payment In as before.
 * @route   PATCH /api/pos/invoice/:id/edit
 * @access  Private (owner/co-owner/manager)
 */
export const editInvoice = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
        const tenantId = req.tenantId;
        const requestingUser = req.user;
        if (!requestingUser?.role || !INVOICE_EDIT_ROLES.includes(requestingUser.role)) {
            throw new AppError("Only an owner, co-owner, or manager can edit a completed invoice.", 403);
        }

        const invoice = await Invoice.findOne({ _id: req.params.id, tenantId, isDeleted: { $ne: true } }).session(session);
        if (!invoice) throw new AppError("Invoice not found", 404);

        const {
            items: editedItems,
            discount: newBillDiscount,
            editReason
        } = req.body as {
            items?: Array<{ item: string; quantity?: number; price?: number; discount?: number }>;
            discount?: number;
            editReason?: string;
        };

        if (!Array.isArray(editedItems) || editedItems.length === 0) {
            throw new AppError("At least one item correction is required", 400);
        }

        // Keyed by item id so callers only need to send the lines that actually changed --
        // any invoice line not present in `items` is left exactly as it was.
        const editByItemId = new Map(editedItems.map((e) => [String(e.item), e]));

        let subtotal = 0;
        let taxTotal = 0;

        for (const line of invoice.items) {
            const edit = editByItemId.get(String(line.item));
            const oldQty = line.quantity;
            const newQty = typeof edit?.quantity === 'number' ? edit.quantity : oldQty;
            const newPrice = typeof edit?.price === 'number' ? edit.price : line.price;
            const newDiscount = typeof edit?.discount === 'number' ? edit.discount : (line.discount || 0);

            if (newQty <= 0) {
                throw new AppError(`Quantity for ${line.name || line.item} must be greater than zero`, 400);
            }

            // Reconcile stock for the delta only -- this is a correction to an already-completed
            // sale, not a new purchase, so it's a direct stock adjustment (no WAC recalculation,
            // unlike InventoryService.addStock) mirroring how ReturnController already restocks
            // a sales return: Item.stockQty +/- delta, plus an ADJUST StockLog entry for audit.
            const qtyDelta = newQty - oldQty;
            // Quick Entry lines have no stock item, so an edit changes only the line itself.
            if (qtyDelta !== 0 && !line.isQuickEntry) {
                const product = await Item.findOne({ _id: line.item, tenantId }).session(session);
                if (!product) throw new AppError(`Item not found: ${line.name || line.item}`, 404);
                if (qtyDelta > 0 && product.stockQty < qtyDelta) {
                    throw new AppError(`Insufficient stock for ${product.name}. Available: ${product.stockQty}`, 400);
                }

                const updated = await Item.findByIdAndUpdate(
                    line.item,
                    { $inc: { stockQty: -qtyDelta } },
                    { new: true, session }
                );

                await StockLog.create([{
                    itemId: line.item,
                    tenantId,
                    type: 'ADJUST',
                    delta: -qtyDelta,
                    finalQty: updated?.stockQty,
                    reason: `Invoice ${invoice.invoiceNo} edited${editReason ? `: ${editReason}` : ''}`,
                    performedBy: requestingUser._id
                }], { session });
            }

            line.quantity = newQty;
            line.price = newPrice;
            line.discount = newDiscount;

            const itemTotal = newQty * newPrice;
            const taxAmount = (itemTotal * (line.gstRate || 0)) / 100;
            line.taxableAmount = itemTotal;
            line.tax = taxAmount;
            line.total = itemTotal + taxAmount - newDiscount;

            subtotal += itemTotal;
            taxTotal += taxAmount;
        }

        invoice.subtotal = subtotal;
        invoice.tax = taxTotal;
        if (typeof newBillDiscount === 'number' && !Number.isNaN(newBillDiscount)) {
            invoice.discount = Math.max(0, newBillDiscount);
        }
        invoice.totalAmount = subtotal + taxTotal - (invoice.discount || 0);
        invoice.paymentStatus = (invoice.paidAmount + invoice.creditApplied) >= invoice.totalAmount
            ? 'paid'
            : (invoice.paidAmount > 0 ? 'partial' : 'unpaid');

        invoice.isEdited = true;
        invoice.lastEditedAt = new Date();
        invoice.lastEditedBy = requestingUser._id;
        if (editReason) invoice.lastEditReason = editReason;

        await invoice.save({ session });
        await session.commitTransaction();
        res.status(200).json({ success: true, message: "Invoice updated", invoice });
    } catch (err) {
        await session.abortTransaction();
        error(`Edit Invoice Failed: ${(err as Error).message}`);
        res.status((err as any).statusCode || 500).json({ success: false, message: (err as Error).message });
    } finally {
        session.endSession();
    }
};

/**
 * @desc    Record a payment against a POS invoice. Same Invoice collection/paid-status logic
 *          as the Sales Invoices module -- delegates to SalesService.markAsPaid rather than
 *          duplicating it.
 * @route   PUT /api/pos/invoice/:id/payment
 * @access  Private
 */
export const payInvoice = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
        const salesService = container.resolve(SalesService);
        // PaymentModal sends both `amount` and `paidAmount` (its two consumers disagree on the
        // field name for the same value) -- accept either.
        const amount = Number(req.body.amount ?? req.body.paidAmount);
        const result = await salesService.markAsPaid(
            req.params.id as string,
            req.tenantId,
            req.user.name,
            { amount, bankAccount: req.body.bankAccount, paymentMethod: req.body.paymentMethod }
        );
        res.status(200).json({ success: true, data: result });
    } catch (err) {
        const appErr = err as AppError;
        error(`Record POS invoice payment failed: ${appErr.message}`);
        res.status(appErr.statusCode || 500).json({ success: false, message: appErr.message });
    }
};

export default {
    getPosProducts,
    getPosSummary,
    processPosSale,
    createInvoice,
    getMrpPendingInvoices,
    finalizeMrpPricing,
    editInvoice,
    payInvoice
};
