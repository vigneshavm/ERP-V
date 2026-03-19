import { Request, Response } from 'express';
import mongoose from 'mongoose';
import SalesOrder from '../models/SalesOrder.js';
import DeliveryChallan from '../models/DeliveryChallan.js';
import Invoice from '../models/Invoice.js';
import Item from '@smarterp/core/modules/inventory/models/Item.js';
import Customer from '@smarterp/core/modules/crm/models/Customer.js';
import { reserveStock, releaseStock, checkAvailableStock } from '@smarterp/shared/utils/stockReservation.js';
import { info } from '@smarterp/shared/config/logger.js';
import { logStockMovement } from '@smarterp/shared/utils/stockMovementLogger.js';
import { calculatePaymentStatus } from '@smarterp/shared/utils/paymentStatusCalculator.js';
import { validateStockLevels, validateSalesOrderQuantities } from '@smarterp/shared/utils/inventoryValidator.js';
import { asyncHandler }               from '@smarterp/shared/utils/asyncHandler.js';
import { ok, created }                from '@smarterp/shared/utils/response.js';
import { requireTenantId, requireUserId } from '@smarterp/shared/utils/tenantContext.js';
import { AppError }                   from '@smarterp/shared/utils/AppError.js';

const validId = (id: string, label = 'ID') => {
    if (!mongoose.Types.ObjectId.isValid(id)) throw new AppError(`Invalid ${label} format`, 400);
    return id;
};

/** Generate a sequential padded number like SO-00001 */
const nextSequence = async (Model: any, field: string, prefix: string, tenantId: string): Promise<string> => {
    const last = await Model.findOne({ tenantId }).sort({ createdAt: -1 }).select(field);
    const m    = last?.[field]?.match(/\d+$/);
    return `${prefix}${String(m ? parseInt(m[0]) + 1 : 1).padStart(5, '0')}`;
};

/** Recalculate totals from raw order items array. */
const processSalesOrderItems = async (items: any[], tenantId: string) => {
    let subtotal = 0, taxTotal = 0, discountTotal = 0;
    const processed = [];
    for (const it of items) {
        validId(it.item, 'item ID');
        const item = await Item.findOne({ _id: it.item, tenantId });
        if (!item) throw new AppError(`Item not found or unauthorized: ${it.item}`, 400);
        const sub  = it.quantity * it.rate;
        const tax  = (sub * (it.tax || 0)) / 100;
        const disc = it.discount || 0;
        subtotal += sub; taxTotal += tax; discountTotal += disc;
        processed.push({ item: it.item, quantity: it.quantity, rate: it.rate, tax: it.tax || 0, discount: disc, reservedQty: 0, deliveredQty: 0, invoicedQty: 0, total: sub + tax - disc });
    }
    return { processed, subtotal, taxTotal, discountTotal };
};

export const createSalesOrder = asyncHandler(async (req: Request, res: Response) => {
    const tenantId = requireTenantId(req);
    const userId   = requireUserId(req);
    const { customerId, items, orderDate, expectedDeliveryDate, discount = 0, notes = '' } = req.body;

    if (!customerId) throw new AppError('Customer is required', 400);
    if (!items?.length) throw new AppError('At least one item is required', 400);
    if (!expectedDeliveryDate) throw new AppError('Expected delivery date is required', 400);
    validId(customerId, 'customer ID');

    const customer = await Customer.findOne({ _id: customerId, tenantId });
    if (!customer) throw new AppError('Customer not found or unauthorized', 400);

    const { processed, subtotal, taxTotal, discountTotal } = await processSalesOrderItems(items, tenantId);
    const orderNumber = await nextSequence(SalesOrder, 'orderNumber', 'SO-', tenantId);

    const salesOrder = await SalesOrder.create({
        orderNumber, customer: customerId, orderDate: orderDate || new Date(),
        expectedDeliveryDate, items: processed, subtotal, taxTotal,
        discountTotal: discountTotal + discount,
        totalAmount: subtotal + taxTotal - discountTotal - discount,
        status: 'Draft', notes, createdBy: userId, tenantId,
    });

    info(`Sales Order created by ${req.user!.name}: ${orderNumber}`);
    const populated = await SalesOrder.findById(salesOrder._id)
        .populate('customer', 'name phone email').populate('items.item', 'name sku unit');
    created(res, populated, 'Sales Order created successfully');
});

export const updateSalesOrder = asyncHandler(async (req: Request, res: Response) => {
    const tenantId  = requireTenantId(req);
    const { id }    = req.params;
    validId(id);
    const salesOrder = await SalesOrder.findOne({ _id: id, tenantId });
    if (!salesOrder) throw new AppError('Sales Order not found or unauthorized', 404);
    if (salesOrder.pricesLocked) throw new AppError('Cannot modify confirmed order. Prices and items are locked.', 400);
    if (salesOrder.isCancelled) throw new AppError('Cannot modify cancelled order', 400);

    const { customerId, items, orderDate, expectedDeliveryDate, discount = 0, notes = '' } = req.body;

    if (customerId) {
        validId(customerId, 'customer ID');
        const cust = await Customer.findOne({ _id: customerId, tenantId });
        if (!cust) throw new AppError('Customer not found or unauthorized', 400);
    }

    let itemUpdate: any = {};
    if (items?.length) {
        const { processed, subtotal, taxTotal, discountTotal } = await processSalesOrderItems(items, tenantId);
        itemUpdate = { items: processed, subtotal, taxTotal, discountTotal: discountTotal + discount, totalAmount: subtotal + taxTotal - discountTotal - discount };
    }

    const updated = await SalesOrder.findByIdAndUpdate(id, {
        ...(customerId && { customer: customerId }),
        ...(orderDate && { orderDate }),
        ...(expectedDeliveryDate && { expectedDeliveryDate }),
        ...itemUpdate, notes,
    }, { new: true }).populate('customer', 'name phone email').populate('items.item', 'name sku unit');

    if (!updated) throw new AppError('Sales Order not found', 404);
    info(`Sales Order updated by ${req.user!.name}: ${updated.orderNumber}`);
    ok(res, updated, 'Sales Order updated successfully');
});

export const confirmSalesOrder = asyncHandler(async (req: Request, res: Response) => {
    const tenantId   = requireTenantId(req);
    const userId     = requireUserId(req);
    const { id }     = req.params;
    validId(id);
    const salesOrder = await SalesOrder.findOne({ _id: id, tenantId });
    if (!salesOrder) throw new AppError('Sales Order not found or unauthorized', 404);
    if (salesOrder.isConfirmed) throw new AppError('Sales Order is already confirmed', 400);
    if (salesOrder.isCancelled) throw new AppError('Cannot confirm cancelled order', 400);

    for (const item of salesOrder.items) {
        const ok_ = await checkAvailableStock(item.item.toString(), item.quantity);
        if (!ok_) {
            const itemDoc = await Item.findById(item.item);
            if (!itemDoc) throw new AppError(`Item not found: ${item.item}`, 404);
            const avail = itemDoc.stockQty - itemDoc.reservedStock;
            throw new AppError(`Insufficient stock for ${itemDoc.name}. Available: ${avail}, Required: ${item.quantity}`, 400);
        }
    }

    for (const item of salesOrder.items) {
        await reserveStock(item.item.toString(), item.quantity, salesOrder._id.toString(), 'SalesOrder', userId);
        item.reservedQty = item.quantity;
    }

    salesOrder.isConfirmed  = true;
    salesOrder.status       = 'Confirmed';
    salesOrder.pricesLocked = true;
    salesOrder.confirmedAt  = new Date();
    salesOrder.confirmedBy  = new mongoose.Types.ObjectId(userId);
    await salesOrder.save();

    info(`Sales Order confirmed by ${req.user!.name}: ${salesOrder.orderNumber}`);
    const populated = await SalesOrder.findById(salesOrder._id)
        .populate('customer', 'name phone email').populate('items.item', 'name sku unit');
    ok(res, populated, 'Sales Order confirmed. Stock reserved.');
});

export const getSalesOrderById = asyncHandler(async (req: Request, res: Response) => {
    const tenantId   = requireTenantId(req);
    const salesOrder = await SalesOrder.findOne({ _id: req.params.id, tenantId })
        .populate('customer', 'name phone email address dues')
        .populate('items.item', 'name sku unit stockQty reservedStock')
        .populate('deliveryChallans').populate('invoices')
        .populate('confirmedBy', 'name').populate('cancelledBy', 'name');
    if (!salesOrder) throw new AppError('Sales Order not found or unauthorized', 404);

    const now = new Date();
    if (new Date(salesOrder.expectedDeliveryDate) < now && salesOrder.status !== 'Invoiced' && salesOrder.status !== 'Cancelled') {
        salesOrder.isOverdue = true;
        await salesOrder.save();
    }
    ok(res, salesOrder);
});

export const listSalesOrders = asyncHandler(async (req: Request, res: Response) => {
    const tenantId = requireTenantId(req);
    const { status, customerId, startDate, endDate, overdue } = req.query as Record<string, string>;
    const filter: any = { tenantId };
    if (status) filter.status = status;
    if (customerId && mongoose.Types.ObjectId.isValid(customerId)) filter.customer = customerId;
    if (startDate || endDate) {
        filter.orderDate = {};
        if (startDate) filter.orderDate.$gte = new Date(startDate);
        if (endDate)   filter.orderDate.$lte = new Date(endDate);
    }
    if (overdue === 'true') filter.isOverdue = true;
    const orders = await SalesOrder.find(filter)
        .populate('customer', 'name phone').populate('items.item', 'name sku unit stockQty reservedStock')
        .sort({ createdAt: -1 });
    ok(res, orders);
});

export const cancelSalesOrder = asyncHandler(async (req: Request, res: Response) => {
    const tenantId   = requireTenantId(req);
    const userId     = requireUserId(req);
    const { id }     = req.params;
    validId(id);
    const salesOrder = await SalesOrder.findOne({ _id: id, tenantId });
    if (!salesOrder) throw new AppError('Sales Order not found or unauthorized', 404);
    if (salesOrder.isCancelled) throw new AppError('Sales Order is already cancelled', 400);
    if (salesOrder.status === 'Invoiced') throw new AppError('Cannot cancel fully invoiced order', 400);

    if (salesOrder.isConfirmed) {
        for (const item of salesOrder.items) {
            const qty = item.reservedQty - item.deliveredQty;
            if (qty > 0) await releaseStock(item.item.toString(), qty, salesOrder._id.toString(), 'SalesOrder', userId);
        }
    }

    salesOrder.isCancelled = true;
    salesOrder.status      = 'Cancelled';
    salesOrder.cancelledAt = new Date();
    salesOrder.cancelledBy = new mongoose.Types.ObjectId(userId);
    await salesOrder.save();

    info(`Sales Order cancelled by ${req.user!.name}: ${salesOrder.orderNumber}`);
    const populated = await SalesOrder.findById(salesOrder._id)
        .populate('customer', 'name phone email').populate('items.item', 'name sku unit');
    ok(res, populated, 'Sales Order cancelled. Reserved stock released.');
});

export const convertToDeliveryChallan = asyncHandler(async (req: Request, res: Response) => {
    const tenantId   = requireTenantId(req);
    const userId     = requireUserId(req);
    validId(req.params.id);
    const salesOrder = await SalesOrder.findOne({ _id: req.params.id, tenantId });
    if (!salesOrder) throw new AppError('Sales Order not found or unauthorized', 404);
    if (!salesOrder.isConfirmed) throw new AppError('Only confirmed orders can be converted to Delivery Challan', 400);
    if (salesOrder.isCancelled)  throw new AppError('Cannot convert cancelled order', 400);
    if (salesOrder.status === 'Invoiced') throw new AppError('Order is already fully invoiced', 400);

    const { items, deliveryDate, vehicleNo, driverName, transportMode, notes } = req.body;
    const dcItems = [];

    for (const dcItem of items) {
        const soItem = salesOrder.items.find((i: any) => i.item.toString() === dcItem.item);
        if (!soItem) throw new AppError(`Item ${dcItem.item} not found in sales order`, 400);
        const remaining = soItem.reservedQty - soItem.deliveredQty;
        if (dcItem.quantity > remaining)
            throw new AppError(`Cannot deliver ${dcItem.quantity} units. Only ${remaining} remaining.`, 400);

        dcItems.push({ item: dcItem.item, quantity: soItem.quantity, deliveredQty: dcItem.quantity, unit: dcItem.unit || 'pcs', description: dcItem.description || '' });
        soItem.deliveredQty += dcItem.quantity;

        const item = await Item.findById(dcItem.item);
        if (!item) throw new AppError(`Item not found: ${dcItem.item}`, 404);
        const prev = { stockQty: item.stockQty, reservedStock: item.reservedStock, inTransitStock: item.inTransitStock || 0 };
        item.stockQty     -= dcItem.quantity;
        item.inTransitStock = (item.inTransitStock || 0) + dcItem.quantity;
        validateStockLevels(item);
        await item.save();
        const next = { stockQty: item.stockQty, reservedStock: item.reservedStock, inTransitStock: item.inTransitStock };
        await logStockMovement(item, 'DELIVER',    dcItem.quantity, salesOrder._id, 'SalesOrder', userId, prev, { ...prev, stockQty: item.stockQty });
        await logStockMovement(item, 'IN_TRANSIT', dcItem.quantity, salesOrder._id, 'SalesOrder', userId, { ...prev, stockQty: item.stockQty }, next);
    }

    validateSalesOrderQuantities(salesOrder);
    const challanNumber = await nextSequence(DeliveryChallan, 'challanNumber', 'DC-', tenantId);
    const challan = await DeliveryChallan.create({
        challanNumber, customer: salesOrder.customer, challanDate: new Date(),
        deliveryDate: deliveryDate || new Date(), items: dcItems, salesOrder: salesOrder._id,
        vehicleNo: vehicleNo || '', driverName: driverName || '', transportMode: transportMode || 'road',
        notes: notes || '', createdBy: userId, tenantId,
    });

    salesOrder.deliveryChallans.push(challan._id);
    const totalDelivered = salesOrder.items.reduce((s: number, i: any) => s + i.deliveredQty, 0);
    const totalReserved  = salesOrder.items.reduce((s: number, i: any) => s + i.reservedQty, 0);
    salesOrder.status = totalDelivered >= totalReserved ? 'Delivered' : totalDelivered > 0 ? 'Partially Delivered' : salesOrder.status;
    await salesOrder.save();

    info(`Delivery Challan ${challanNumber} created from ${salesOrder.orderNumber}`);
    const populatedChallan = await DeliveryChallan.findById(challan._id)
        .populate('customer', 'name phone email').populate('items.item', 'name sku unit').populate('salesOrder', 'orderNumber');
    created(res, { deliveryChallan: populatedChallan }, 'Delivery Challan created successfully');
});

export const convertToInvoice = asyncHandler(async (req: Request, res: Response) => {
    const tenantId   = requireTenantId(req);
    const userId     = requireUserId(req);
    validId(req.params.id);
    const salesOrder = await SalesOrder.findOne({ _id: req.params.id, tenantId });
    if (!salesOrder) throw new AppError('Sales Order not found or unauthorized', 404);
    if (salesOrder.isCancelled) throw new AppError('Cannot convert cancelled order', 400);
    if (salesOrder.status !== 'Delivered' && salesOrder.status !== 'Partially Invoiced')
        throw new AppError('Only delivered orders can be converted to Invoice', 400);

    const { items, discount = 0, paidAmount = 0, paymentMethod = 'cash', bankAccount } = req.body;
    const invoiceItems = [];
    let subtotal = 0;

    for (const invItem of items) {
        const soItem = salesOrder.items.find((i: any) => i.item.toString() === invItem.item);
        if (!soItem) throw new AppError(`Item ${invItem.item} not found in sales order`, 400);
        const remaining = soItem.deliveredQty - soItem.invoicedQty;
        if (invItem.quantity > remaining)
            throw new AppError(`Cannot invoice ${invItem.quantity} units. Only ${remaining} remaining.`, 400);

        const itemTotal = invItem.quantity * soItem.rate;
        subtotal += itemTotal;
        invoiceItems.push({ item: invItem.item, quantity: invItem.quantity, price: soItem.rate, total: itemTotal });
        soItem.invoicedQty += invItem.quantity;

        const item = await Item.findById(invItem.item);
        if (!item) throw new AppError(`Item not found: ${invItem.item}`, 404);
        const prev = { stockQty: item.stockQty, reservedStock: item.reservedStock, inTransitStock: item.inTransitStock || 0 };
        item.reservedStock -= invItem.quantity;
        if (item.inTransitStock > 0) item.inTransitStock = Math.max(0, item.inTransitStock - invItem.quantity);
        validateStockLevels(item);
        await item.save();
        await logStockMovement(item, 'INVOICE', invItem.quantity, salesOrder._id, 'SalesOrder', userId, prev, { stockQty: item.stockQty, reservedStock: item.reservedStock, inTransitStock: item.inTransitStock });
    }

    const totalAmount    = subtotal - discount;
    const paymentStatus  = calculatePaymentStatus(totalAmount, paidAmount, 0);
    const invoiceNo      = await nextSequence(Invoice, 'invoiceNo', 'INV-', tenantId);

    const invoice = await Invoice.create({
        invoiceNo, customer: salesOrder.customer, salesOrder: salesOrder._id,
        items: invoiceItems, subtotal, discount, totalAmount, paidAmount, paymentStatus, paymentMethod,
        bankAccount: paymentMethod === 'bank_transfer' ? bankAccount : undefined,
        createdBy: userId, tenantId,
    });

    salesOrder.invoices.push(invoice._id);
    const totalInvoiced  = salesOrder.items.reduce((s: number, i: any) => s + i.invoicedQty, 0);
    const totalDelivered = salesOrder.items.reduce((s: number, i: any) => s + i.deliveredQty, 0);
    salesOrder.status    = totalInvoiced >= totalDelivered ? 'Invoiced' : totalInvoiced > 0 ? 'Partially Invoiced' : salesOrder.status;
    validateSalesOrderQuantities(salesOrder);
    await salesOrder.save();

    info(`Invoice ${invoiceNo} created from ${salesOrder.orderNumber}`);
    const populatedInvoice = await Invoice.findById(invoice._id)
        .populate('customer', 'name phone email').populate('items.item', 'name sku').populate('salesOrder', 'orderNumber');
    created(res, { invoice: populatedInvoice }, 'Invoice created successfully');
});

export const updateOrderStatus = asyncHandler(async (req: Request, res: Response) => {
    const tenantId = requireTenantId(req);
    const { status } = req.body;
    if (!status) throw new AppError('Status is required', 400);
    const order = await SalesOrder.findOneAndUpdate(
        { _id: req.params.id, tenantId }, { status }, { new: true }
    );
    if (!order) throw new AppError('Sales Order not found', 404);
    info(`Sales Order ${order.orderNumber} status → ${status}`);
    ok(res, order);
});

export default { createSalesOrder, updateSalesOrder, confirmSalesOrder, getSalesOrderById, listSalesOrders, cancelSalesOrder, updateOrderStatus, convertToDeliveryChallan, convertToInvoice };
