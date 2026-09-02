import { Request, Response } from "express";
import mongoose from "mongoose";
import { AppError } from "../../../utils/AppError.js";
import { error } from "../../../config/logger.js";
import Item from "../../inventory/models/Item.js";
import Invoice from "../../sales/models/Invoice.js";
import Customer from "../../crm/models/Customer.js";
import CashbankTransaction from "../../finance/models/CashbankTransaction.js";
import BankAccount from "../../finance/models/BankAccount.js";
import { stockReservationManager } from "../../inventory/services/StockReservationService.js";

/**
 * @desc    Get all POS products (placeholder)
 * @route   GET /api/pos/products
 * @access  Private
 */
export const getPosProducts = async (_req: Request, res: Response): Promise<void> => {
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
export const getPosSummary = async (_req: Request, res: Response): Promise<void> => {
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
export const processPosSale = async (_req: Request, res: Response): Promise<void> => {
    res.status(201).json({ message: 'POS sale processed' });
};

/**
 * @desc    Create a new POS Invoice
 * @route   POST /api/pos/invoice
 * @access  Private
 */
export const createInvoice = async (req: Request, res: Response): Promise<void> => {
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
            previousDueAmount = 0
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
        const processedItems = [];

        for (const item of items) {
            // Use findById directly for better error handling if needed, but findOne with tenantId is safer
            const product = await Item.findOne({ _id: item.item || item._id, tenantId: (req as any).tenantId }).session(session);

            if (!product) {
                throw new AppError(`Item not found: ${item.name}`, 404);
            }

            const reservedQty = stockReservationManager.getReservedQuantity((req as any).tenantId, product._id.toString());
            const availableNetStock = product.stockQty - reservedQty;

            if (availableNetStock < item.quantity) {
                throw new AppError(`Insufficient stock for ${product.name}. Available (Net of Holds): ${availableNetStock}`, 400);
            }

            // Calculate Item Totals
            const itemTotal = item.quantity * item.price;
            subtotal += itemTotal;

            const taxAmount = (itemTotal * (item.tax || 0)) / 100;
            taxTotal += taxAmount;

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
                (req as any).tenantId,
                (req as any).user,
                'SALES',
                session
            );
        }

        const {
            customerPhone,
            customerName,
            marketingConsentOptIn = false,
            pointsToRedeem = 0
        } = req.body;

        const finalTotal = subtotal + taxTotal - discount;

        // 4. Create Invoice
        const lastInvoice = await Invoice.findOne({ tenantId: (req as any).tenantId }).sort({ createdAt: -1 }).session(session);
        let nextInvoiceNum = 1;
        if (lastInvoice && lastInvoice.invoiceNo) {
            const match = lastInvoice.invoiceNo.match(/-(\d+)$/);
            if (match) nextInvoiceNum = parseInt(match[1]) + 1;
        }
        const invoiceNo = `INV-${new Date().getFullYear()}-${String(nextInvoiceNum).padStart(5, '0')}`;

        const paymentStatus = (actualReceived + creditApplied) >= finalTotal ? 'paid' : (actualReceived > 0 ? 'partial' : 'unpaid');

        // Customer Lookup / Auto-Registration (Optional Phone BRD §3 & §4)
        let customer = null;
        let resolvedCustomerId = customerId || null;

        if (!resolvedCustomerId && (customerPhone || customerName)) {
            let existingCust = null;
            if (customerPhone) {
                existingCust = await Customer.findOne({ phone: customerPhone, tenantId: (req as any).tenantId }).session(session);
            }

            if (existingCust) {
                customer = existingCust;
                resolvedCustomerId = existingCust._id;
            } else {
                const newCust = new Customer({
                    name: customerName || 'Walk-in Customer',
                    phone: customerPhone || '',
                    owner: (req as any).user._id,
                    tenantId: (req as any).tenantId,
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
            customer = await Customer.findOne({ _id: customerId, tenantId: (req as any).tenantId }).session(session);
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
                (req as any).tenantId,
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
                    (req as any).tenantId,
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
            tenantId: (req as any).tenantId,
            createdBy: (req as any).user._id
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
                            userId: (req as any).user._id,
                            tenantId: (req as any).tenantId,
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
                        { _id: bankAccount, tenantId: (req as any).tenantId },
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
                    userId: (req as any).user._id,
                    tenantId: (req as any).tenantId,
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

export default {
    getPosProducts,
    getPosSummary,
    processPosSale,
    createInvoice
};
