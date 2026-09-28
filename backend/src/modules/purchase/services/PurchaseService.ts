import { injectable, singleton, inject } from "tsyringe";
import mongoose from "mongoose";
import { PurchaseRepository } from "../../../repositories/PurchaseRepository.js";
import { InventoryService } from "../../inventory/services/InventoryService.js";
import Item from "../../inventory/models/Item.js";
import Bill from "../../finance/models/Bill.js";
import JournalEntry from "../../finance/models/JournalEntry.js";
import Tenant from "../../core/models/Tenant.js";
import Supplier from "../models/Supplier.js";
import { IPurchase } from "../models/Purchase.js";
import { IUser } from "../../../interfaces/IUser.js";
import { error, warn } from "../../../config/logger.js";
import { isSqlItemSource } from "../../../config/itemDataSource.js";
import { isSqlId, sqlPurchaseById, sqlPurchaseList } from "../../../integrations/textilesoft/sqlSales.js";
import { AppError } from "../../../utils/AppError.js";

/**
 * Purchase intake, lifecycle and reporting. Owns the create-purchase transaction boundary
 * (supplier credit checks, inventory receipt, bill + ledger posting) that used to live in
 * PurchaseController -- the controller now only translates HTTP <-> this service.
 */
@injectable()
@singleton()
export class PurchaseService {
    constructor(
        @inject(PurchaseRepository) private purchaseRepository: PurchaseRepository,
        @inject(InventoryService) private inventoryService: InventoryService,
    ) { }

    // Wholesale/Retail (WR) Billing: `numberPrefix` lets WR purchase intake (channel: 'WHOLESALE')
    // get its own "WRPUR-" series instead of "PUR-", scanned separately -- same convention as
    // PosController.ts's INV-/WR- invoice numbering split. Defaults to 'PUR' so every existing
    // caller is unaffected.
    private async generatePurchaseNumber(numberPrefix: string = "PUR"): Promise<string> {
        const today = new Date();
        const dateStr = today.toISOString().slice(0, 10).replace(/-/g, "");
        const prefix = `${numberPrefix}-${dateStr}`;
        const lastPurchase = await this.purchaseRepository.findLatestByNumberPrefix(prefix);

        let sequence = 1;
        if (lastPurchase) {
            const parts = lastPurchase.purchaseNumber.split("-");
            if (parts.length >= 3) {
                const seq = parseInt(parts[2]);
                if (!isNaN(seq)) sequence = seq + 1;
            }
        }
        return `${prefix}-${sequence.toString().padStart(3, "0")}`;
    }

    async createPurchase(user: IUser, body: any): Promise<{ purchaseNumber: string }> {
        const tenantId = user.tenantId?.toString() || "default";
        const session = await mongoose.startSession();
        session.startTransaction();
        try {
            const { details, items, status } = body;

            if (!body.p_vendor_id) {
                throw new AppError("Supplier (Vendor) is required", 400, "SUPPLIER_REQUIRED");
            }

            const supplier = await Supplier.findById(body.p_vendor_id).session(session);
            if (!supplier) {
                throw new AppError("Supplier (Vendor) not found", 404, "SUPPLIER_NOT_FOUND");
            }

            if (supplier.status === "inactive") {
                throw new AppError("Cannot create Purchase Order for an inactive vendor", 400, "SUPPLIER_INACTIVE");
            }

            const supShortCode = supplier.shortCode || "SUP";

            // Supplier Credit Protocol
            if (status === "COMPLETED" && supplier) {
                const { paymentPromiseDate, overrideCreditLimit } = body;

                // If override is TRUE or User is Co-Owner/Owner, skip these checks
                const userRole = (user as any).systemRole?.toLowerCase() || user.role?.toLowerCase() || "";
                const isExempt = userRole === "co-owner" || userRole === "owner" || userRole === "admin";

                if (!paymentPromiseDate && !overrideCreditLimit && !isExempt) {
                    // 1. Check Credit Period Limit (Overdue Invoices)
                    const overdueBills = await Bill.countDocuments({
                        supplier: supplier._id,
                        paymentStatus: { $ne: "paid" },
                        dueDate: { $lt: new Date() },
                    }).session(session);

                    if (overdueBills > 0) {
                        throw new AppError(
                            `Supplier Lockout: ${overdueBills} overdue invoices. Manager action required.`,
                            403,
                            "CREDIT_PERIOD_EXCEEDED",
                        );
                    }

                    // 2. Check Credit Limit (Total Outstanding)
                    if (supplier.creditLimit && supplier.creditLimit > 0) {
                        const result = await Bill.aggregate([
                            { $match: { supplier: supplier._id, paymentStatus: { $ne: "paid" } } },
                            { $group: { _id: null, total: { $sum: { $subtract: ["$amount", "$paidAmount"] } } } },
                        ]).session(session);

                        const currentOutstanding = result[0]?.total || 0;
                        const newAmount = details.total_amount || 0;

                        if (currentOutstanding + newAmount > supplier.creditLimit) {
                            throw new AppError(
                                `Credit Limit Exceeded. Outstanding: ${currentOutstanding}, Limit: ${supplier.creditLimit}`,
                                403,
                                "CREDIT_LIMIT_EXCEEDED",
                                {
                                    currentOutstanding,
                                    limit: supplier.creditLimit,
                                    shortage: currentOutstanding + newAmount - supplier.creditLimit,
                                },
                            );
                        }
                    }
                }
            }

            // Wholesale/Retail (WR) Billing: channel comes from either the top-level body (WR
            // Purchase Entry) or details.channel, defaulting to RETAIL so every existing caller
            // (Purchase Entry, PDF import, PO conversion) is unaffected.
            const channel: "RETAIL" | "WHOLESALE" = (body.channel || details?.channel) === "WHOLESALE" ? "WHOLESALE" : "RETAIL";
            const purchaseNumber = await this.generatePurchaseNumber(channel === "WHOLESALE" ? "WRPUR" : "PUR");

            // Process items: Create new inventory items for variants or new designs
            const processedItems = [];
            for (const i of items) {
                let productId = i.product_id;
                let productName = i.product_name || "Unknown";
                const catCode = i.category_code || "CAT";

                // If it's a new item (no product_id or marked as new)
                if (!productId || productId === "new") {
                    const sku = i.sku || `${supShortCode}-${catCode}-${i.selling_price || 0}`;

                    const newItem = new Item({
                        name: i.product_name,
                        sku: sku,
                        category: i.category_name,
                        categoryCode: catCode,
                        costPrice: i.rate,
                        sellingPrice: i.selling_price || 0,
                        // Wholesale/Retail (WR) Billing: seed the item's wholesale rate when WR
                        // Purchase Entry created it, so POS's existing wholesale pricing
                        // (usePOSLogic.ts's resolveItemPrice) picks it up right away.
                        wholesaleRate: i.wholesale_rate || undefined,
                        stockQty: 0, // Will be updated below
                        color: i.color,
                        size: i.size,
                        washingInstructions: i.washing_instructions,
                        // Textile descriptors -- Purchase Entry is often the first place a genuinely
                        // new product is ever entered, so without these it silently shipped with no
                        // brand/design/pattern/modelNo/fashionName/shelfCode until someone later
                        // opened Product Modal and filled them in by hand.
                        brand: i.brand,
                        design: i.design,
                        pattern: i.pattern,
                        modelNo: i.model_no,
                        fashionName: i.fashion_name,
                        shelfCode: i.shelf_code,
                        tenantId,
                        addedBy: user._id,
                    });
                    const savedItem = await newItem.save({ session });
                    productId = savedItem._id;
                    productName = savedItem.name;
                }

                processedItems.push({
                    productId,
                    productName,
                    quantity: i.quantity,
                    rate: i.rate,
                    taxPercent: i.tax_percent,
                    amount: i.amount,
                    margin: i.margin || 0,
                    sellingPrice: i.selling_price || 0,
                    wholesaleRate: i.wholesale_rate || undefined,
                    color: i.color,
                    size: i.size,
                    categoryCode: catCode,
                    lotNumber: i.lot_number,
                    brand: i.brand,
                    design: i.design,
                    pattern: i.pattern,
                    modelNo: i.model_no,
                    fashionName: i.fashion_name,
                    shelfCode: i.shelf_code,
                });
            }

            const purchase = await this.purchaseRepository.create(
                {
                    purchaseNumber,
                    tenantId,
                    vendorId: body.p_vendor_id,
                    date: details.date || new Date(),
                    invoiceNo: details.invoice_no,
                    subtotal: details.subtotal,
                    taxAmount: details.tax_amount,
                    discountAmount: details.discount_amount,
                    shippingAmount: details.shipping_amount,
                    totalAmount: details.total_amount,
                    notes: details.notes,
                    channel,
                    status: status || "DRAFT",
                    createdBy: user._id,
                    items: processedItems,
                } as Partial<IPurchase>,
                session,
            );

            for (let i = 0; i < purchase.items.length; i++) {
                const item = purchase.items[i];
                const product = await Item.findById(item.productId).session(session);
                if (product) {
                    purchase.items[i].productName = product.name;
                    if (status === "COMPLETED" || status === "RECEIVED") {
                        const shipping = details.shipping_amount || 0;
                        const subtotalVal = details.subtotal || 1;
                        const itemLandedOverhead = shipping > 0 ? (shipping * (item.amount / subtotalVal)) / item.quantity : 0;
                        const landedRate = Number((item.rate + itemLandedOverhead).toFixed(2));

                        await this.inventoryService.addStock(
                            item.productId.toString(),
                            item.quantity,
                            landedRate,
                            {
                                batchNumber: (item as any).lotNumber || `${purchaseNumber}-Batch`,
                                expiryDate: undefined,
                                supplierId: purchase.vendorId.toString(),
                            },
                            tenantId,
                            user,
                            session,
                        );
                    }
                }
            }

            await purchase.save({ session });

            if (status === "COMPLETED") {
                await this.postCompletedPurchase(purchase, supplier, details, body, user, session);
            }

            await session.commitTransaction();
            return { purchaseNumber };
        } catch (err) {
            await session.abortTransaction();
            throw err;
        } finally {
            session.endSession();
        }
    }

    /** Supplier bill + double-entry ledger posting for a COMPLETED purchase. */
    private async postCompletedPurchase(
        purchase: IPurchase,
        supplier: any,
        details: any,
        body: any,
        user: IUser,
        session: mongoose.ClientSession,
    ): Promise<void> {
        const creditPeriod = supplier?.creditPeriod || 30;
        const dueDate = new Date(purchase.date);
        dueDate.setDate(dueDate.getDate() + creditPeriod);

        const isCash = body.details?.payment_method === "Cash";

        const bill = new Bill({
            billNo: `BILL-${purchase.purchaseNumber}`,
            vendorInvoiceNo: purchase.invoiceNo,
            date: purchase.date,
            supplier: purchase.vendorId,
            amount: purchase.totalAmount,
            status: isCash ? "paid" : "unpaid",
            paymentMethod: body.details?.payment_method || "credit",
            createdBy: user._id,
            description: `Generated from Purchase ${purchase.purchaseNumber}`,
            paymentStatus: isCash ? "paid" : "unpaid",
            paidAmount: isCash ? purchase.totalAmount : 0,
            dueDate: isCash ? purchase.date : dueDate,
            tenantId: user.tenantId,
        });
        await bill.save({ session });

        // Automated ledger posting (double-entry accounting). Failure here does not roll back
        // the purchase -- see the note below, carried over from the original controller.
        try {
            const tenant = await Tenant.findOne({ _id: user.tenantId }).session(session);
            const tenantState = tenant?.address?.state?.toLowerCase() || "";
            const supplierState = supplier.state?.toLowerCase() || "";

            // Tax Logic: Intra-state (Same) -> CGST/SGST, Inter-state (Diff) -> IGST
            const isInterState = tenantState && supplierState && tenantState !== supplierState;

            const taxAmount = details.tax_amount || 0;
            let cgst = 0, sgst = 0, igst = 0;

            if (taxAmount > 0) {
                if (isInterState) {
                    igst = taxAmount;
                } else {
                    cgst = taxAmount / 2;
                    sgst = taxAmount / 2;
                }
            }

            // Ledger Entries
            // Debit: Purchase Account (Base Amount)
            // Debit: Input Tax (CGST/SGST or IGST)
            // Credit: Supplier (Total Amount)
            const journalEntries = [
                {
                    accountId: "PURCHASE_ACCOUNT", // Replace with real ID lookup later
                    accountName: "Purchase Account",
                    debit: details.total_amount - taxAmount,
                    credit: 0,
                },
                {
                    accountId: supplier._id.toString(),
                    accountName: supplier.businessName,
                    debit: 0,
                    credit: details.total_amount,
                },
            ];

            if (igst > 0) {
                journalEntries.push({ accountId: "INPUT_IGST", accountName: "Input IGST", debit: igst, credit: 0 });
            } else {
                if (cgst > 0) journalEntries.push({ accountId: "INPUT_CGST", accountName: "Input CGST", debit: cgst, credit: 0 });
                if (sgst > 0) journalEntries.push({ accountId: "INPUT_SGST", accountName: "Input SGST", debit: sgst, credit: 0 });
            }

            const journalEntry = new JournalEntry({
                tenantId: user.tenantId,
                date: purchase.date,
                description: `Purchase Recorded - ${purchase.purchaseNumber}`,
                reference: purchase.purchaseNumber,
                entries: journalEntries,
                status: "POSTED",
                createdBy: user._id,
            });

            await journalEntry.save({ session });
        } catch (jeError: any) {
            error(`Ledger Posting Failed: ${(jeError as Error).message}`, { stack: (jeError as Error).stack });
            // We don't block the purchase if ledger fails, but ideally we should.
            // For now, logging error. In strict ERP, this should rollback.
        }
    }

    async getAllPurchases(user: IUser, query: Record<string, unknown>): Promise<unknown[]> {
        const tenantId = user.tenantId?.toString();
        const channel = query.channel === "WHOLESALE" || query.channel === "RETAIL" ? (query.channel as "WHOLESALE" | "RETAIL") : undefined;
        const purchases = await this.purchaseRepository.findAll({
            tenantId,
            createdBy: tenantId ? undefined : user._id.toString(),
            channel,
        });

        // SQL mode: the shop's own GRNs (Textilesoft purchgrnentry) are listed after the ERP's purchases.
        if (isSqlItemSource() && query.channel !== "WHOLESALE") {
            try {
                const shop = await sqlPurchaseList();
                const merged = [...purchases.map((p: any) => p.toObject()), ...shop];
                merged.sort((a: any, b: any) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
                return merged;
            } catch (e) {
                warn(`[sql-purchases] shop GRNs unavailable, showing ERP purchases only - ${(e as Error).message}`);
            }
        }
        return purchases;
    }

    async getPurchaseById(id: string, tenantId: string): Promise<unknown> {
        if (isSqlId(id)) {
            const shopPurchase = isSqlItemSource() ? await sqlPurchaseById(id) : undefined;
            if (!shopPurchase) throw new AppError("Purchase not found", 404);
            return shopPurchase;
        }
        const purchase = await this.purchaseRepository.findByIdForTenant(id, tenantId);
        if (!purchase) throw new AppError("Purchase not found", 404);
        return purchase;
    }

    async updatePurchase(id: string, tenantId: string, updateData: Partial<IPurchase>): Promise<IPurchase | null> {
        return this.purchaseRepository.updateForTenant(id, tenantId, updateData);
    }

    async deletePurchase(id: string, tenantId: string): Promise<void> {
        await this.purchaseRepository.deleteForTenant(id, tenantId);
    }

    async getSupplierTotals(tenantId: string) {
        return this.purchaseRepository.supplierTotals(tenantId);
    }

    async getPurchaseHistory(tenantId: string, itemId: string) {
        const purchases = await this.purchaseRepository.findCompletedByItem(tenantId, itemId);
        return purchases.map((p) => {
            const item = p.items.find((i) => i.productId.toString() === itemId);
            return {
                _id: p._id,
                date: p.date,
                vendorName: (p.vendorId as any)?.businessName || "Unknown",
                vendorId: (p.vendorId as any)?._id,
                quantity: item?.quantity || 0,
                rate: item?.rate || 0,
                unit: item?.unitId || "",
            };
        });
    }

    async updatePOStatus(
        id: string,
        tenantId: string,
        user: IUser,
        status: string | undefined,
        expectedDeliveryDate: string | undefined,
    ): Promise<IPurchase> {
        const purchase = await this.purchaseRepository.findForTenant(id, tenantId);
        if (!purchase) throw new AppError("Purchase Order not found", 404);

        if (status) purchase.status = status as IPurchase["status"];
        if (expectedDeliveryDate) purchase.expectedDeliveryDate = new Date(expectedDeliveryDate);

        if (status === "APPROVED") {
            purchase.approvedBy = user._id as any;
            purchase.approvedAt = new Date();
        } else if (status === "SENT_TO_VENDOR") {
            purchase.sentToVendorAt = new Date();
        }

        await purchase.save();
        return purchase;
    }
}
