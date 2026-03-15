import { Request, Response } from 'express';
import mongoose from 'mongoose';

import SalesOrder from '../models/SalesOrder.js';

import DeliveryChallan from '../models/DeliveryChallan.js';

import Invoice from '../models/Invoice.js';

import Item from '@smarterp/core/modules/inventory/models/Item.js';

import Customer from '@smarterp/core/modules/crm/models/Customer.js';
import { reserveStock, releaseStock, checkAvailableStock } from '@smarterp/shared/utils/stockReservation.js';
import { info, error } from '@smarterp/shared/config/logger.js';
import { logStockMovement } from '@smarterp/shared/utils/stockMovementLogger.js';
import { calculatePaymentStatus } from '@smarterp/shared/utils/paymentStatusCalculator.js';
import { validateStockLevels, validateSalesOrderQuantities } from '@smarterp/shared/utils/inventoryValidator.js';

/**
 * Request interface with authenticated user
 */
interface AuthenticatedRequest extends Request {
    user?: {
        _id: string;
        name?: string;
        [key: string]: any;
    };
    tenantId?: string; // Injected by Auth Middleware
}

interface SalesOrderItem {
    item: string;
    quantity: number;
    rate: number;
    tax?: number;
    discount?: number;
}

interface DeliveryChallanItem {
    item: string;
    quantity: number;
    unit?: string;
    description?: string;
}

interface InvoiceItem {
    item: string;
    quantity: number;
}

/**
 * @swagger
 * /api/sales-orders:
 *   post:
 *     summary: Create a new sales order
 *     tags: [Sales - Orders]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [customerId, items, expectedDeliveryDate]
 *             properties:
 *               customerId: { type: string }
 *               items: { type: array, items: { type: object } }
 *               expectedDeliveryDate: { type: string, format: date }
 *     responses:
 *       201:
 *         description: Sales order created successfully
 */
export const createSalesOrder = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
        const { customerId, items, orderDate, expectedDeliveryDate, discount = 0, notes = '' } = req.body;

        // Validate customer is provided
        if (!customerId) {
            res.status(400).json({ message: 'Customer is required for Sales Order' });
            return;
        }

        // Validate items
        if (!items || items.length === 0) {
            res.status(400).json({ message: 'At least one item is required' });
            return;
        }

        // Validate expected delivery date
        if (!expectedDeliveryDate) {
            res.status(400).json({ message: 'Expected delivery date is required' });
            return;
        }

        // Validate ObjectId format for customer
        if (!mongoose.Types.ObjectId.isValid(customerId)) {
            res.status(400).json({ message: 'Invalid customer ID format' });
            return;
        }

        // Verify customer belongs to current tenant
        const customer = await Customer.findOne({
            _id: customerId,
            tenantId: req.tenantId,
        });

        if (!customer) {
            res.status(400).json({ message: 'Customer not found or unauthorized' });
            return;
        }

        // Verify all items belong to current user and calculate totals
        let subtotal = 0;
        let taxTotal = 0;
        let discountTotal = 0;
        const processedItems = [];

        for (const it of items as SalesOrderItem[]) {
            // Validate ObjectId format
            if (!mongoose.Types.ObjectId.isValid(it.item)) {
                res.status(400).json({ message: `Invalid item ID format: ${it.item}` });
                return;
            }

            const item = await Item.findOne({ _id: it.item, tenantId: req.tenantId });
            if (!item) {
                res.status(400).json({ message: `Item not found or unauthorized: ${it.item}` });
                return;
            }

            // Calculate item total
            const itemSubtotal = it.quantity * it.rate;
            const itemTax = (itemSubtotal * (it.tax || 0)) / 100;
            const itemDiscount = it.discount || 0;
            const itemTotal = itemSubtotal + itemTax - itemDiscount;

            subtotal += itemSubtotal;
            taxTotal += itemTax;
            discountTotal += itemDiscount;

            processedItems.push({
                item: it.item,
                quantity: it.quantity,
                rate: it.rate,
                tax: it.tax || 0,
                discount: it.discount || 0,
                reservedQty: 0, // Will be set on confirmation
                deliveredQty: 0,
                invoicedQty: 0,
                total: itemTotal,
            });
        }

        const totalAmount = subtotal + taxTotal - discountTotal - discount;

        // Generate unique order number
        const lastOrder = await SalesOrder.findOne({ tenantId: req.tenantId })
            .sort({ createdAt: -1 })
            .select('orderNumber');

        let orderNumber = 1;
        if (lastOrder && lastOrder.orderNumber) {
            const match = lastOrder.orderNumber.match(/SO-(\d+)/);
            if (match) {
                orderNumber = parseInt(match[1]) + 1;
            }
        }

        const orderNo = `SO-${String(orderNumber).padStart(5, '0')}`;

        // Create sales order in Draft status
        const salesOrder = await SalesOrder.create({
            orderNumber: orderNo,
            customer: customerId,
            orderDate: orderDate || new Date(),
            expectedDeliveryDate,
            items: processedItems,
            subtotal,
            taxTotal,
            discountTotal: discountTotal + discount,
            totalAmount,
            status: 'Draft',
            notes,
            createdBy: req.user?._id,
            tenantId: req.tenantId // Enforce Tenant Scope
        });

        info(`Sales Order created by ${req.user?.name}: ${orderNo}`);

        const populatedOrder = await SalesOrder.findById(salesOrder._id)
            .populate('customer', 'name phone email')
            .populate('items.item', 'name sku unit');

        res.status(201).json({
            message: 'Sales Order created successfully',
            salesOrder: populatedOrder,
        });
    } catch (err) {
        console.error('Create Sales Order Error:', err);
        error(`Sales Order creation failed: ${(err as Error).message}`);
        res.status(500).json({ message: 'Server Error', error: (err as Error).message });
    }
};

/**
 * @swagger
 * /api/sales-orders/{id}:
 *   put:
 *     summary: Update a sales order
 *     tags: [Sales - Orders]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               items: { type: array, items: { type: object } }
 *     responses:
 *       200:
 *         description: Sales order updated successfully
 */
export const updateSalesOrder = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
        const { id } = req.params;
        const { customerId, items, orderDate, expectedDeliveryDate, discount = 0, notes = '' } = req.body;

        // Validate ObjectId format
        if (!mongoose.Types.ObjectId.isValid(id as string)) {
            res.status(400).json({ message: 'Invalid sales order ID format' });
            return;
        }

        const salesOrder = await SalesOrder.findOne({
            _id: id,
            tenantId: req.tenantId,
        });

        if (!salesOrder) {
            res.status(404).json({ message: 'Sales Order not found or unauthorized' });
            return;
        }

        // Check if order is confirmed (prices locked)
        if (salesOrder.pricesLocked) {
            res.status(400).json({
                message: 'Cannot modify confirmed order. Prices and items are locked.',
            });
            return;
        }

        // Check if order is cancelled
        if (salesOrder.isCancelled) {
            res.status(400).json({ message: 'Cannot modify cancelled order' });
            return;
        }

        // Validate customer if provided
        if (customerId) {
            if (!mongoose.Types.ObjectId.isValid(customerId)) {
                res.status(400).json({ message: 'Invalid customer ID format' });
                return;
            }

            const customer = await Customer.findOne({
                _id: customerId,
                tenantId: req.tenantId,
            });

            if (!customer) {
                res.status(400).json({ message: 'Customer not found or unauthorized' });
                return;
            }
        }

        // Recalculate totals if items provided
        let subtotal = 0;
        let taxTotal = 0;
        let discountTotal = 0;
        const processedItems = [];

        if (items && items.length > 0) {
            for (const it of items as SalesOrderItem[]) {
                if (!mongoose.Types.ObjectId.isValid(it.item)) {
                    res.status(400).json({ message: `Invalid item ID format: ${it.item}` });
                    return;
                }

                const item = await Item.findOne({ _id: it.item, tenantId: req.tenantId });
                if (!item) {
                    res.status(400).json({ message: `Item not found or unauthorized: ${it.item}` });
                    return;
                }

                const itemSubtotal = it.quantity * it.rate;
                const itemTax = (itemSubtotal * (it.tax || 0)) / 100;
                const itemDiscount = it.discount || 0;
                const itemTotal = itemSubtotal + itemTax - itemDiscount;

                subtotal += itemSubtotal;
                taxTotal += itemTax;
                discountTotal += itemDiscount;

                processedItems.push({
                    item: it.item,
                    quantity: it.quantity,
                    rate: it.rate,
                    tax: it.tax || 0,
                    discount: it.discount || 0,
                    reservedQty: 0,
                    deliveredQty: 0,
                    invoicedQty: 0,
                    total: itemTotal,
                });
            }
        }

        const totalAmount = subtotal + taxTotal - discountTotal - discount;

        // Update sales order
        const updateData: any = {
            ...(customerId && { customer: customerId }),
            ...(orderDate && { orderDate }),
            ...(expectedDeliveryDate && { expectedDeliveryDate }),
            ...(items && items.length > 0 && { items: processedItems }),
            ...(items && items.length > 0 && { subtotal, taxTotal, discountTotal: discountTotal + discount, totalAmount }),
            notes,
        };

        const updatedOrder = await SalesOrder.findByIdAndUpdate(id, updateData, { new: true })
            .populate('customer', 'name phone email')
            .populate('items.item', 'name sku unit');

        if (!updatedOrder) {
            res.status(404).json({ message: 'Sales order not found' });
            return;
        }

        info(`Sales Order updated by ${req.user?.name}: ${updatedOrder.orderNumber}`);

        res.status(200).json({
            message: 'Sales Order updated successfully',
            salesOrder: updatedOrder,
        });
    } catch (err) {
        console.error('Update Sales Order Error:', err);
        error(`Sales Order update failed: ${(err as Error).message}`);
        res.status(500).json({ message: 'Server Error', error: (err as Error).message });
    }
};

/**
 * @desc Confirm a sales order (reserve stock)
 * @route POST /api/sales-orders/:id/confirm
 */
/**
 * @swagger
 * /api/sales-orders/{id}/confirm:
 *   post:
 *     summary: Confirm a sales order (reserves stock)
 *     tags: [Sales - Orders]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: Order confirmed and stock reserved
 */
export const confirmSalesOrder = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
        const { id } = req.params;

        if (!mongoose.Types.ObjectId.isValid(id as string)) {
            res.status(400).json({ message: 'Invalid sales order ID format' });
            return;
        }

        const salesOrder = await SalesOrder.findOne({
            _id: id,
            tenantId: req.tenantId,
        });

        if (!salesOrder) {
            res.status(404).json({ message: 'Sales Order not found or unauthorized' });
            return;
        }

        if (salesOrder.isConfirmed) {
            res.status(400).json({ message: 'Sales Order is already confirmed' });
            return;
        }

        if (salesOrder.isCancelled) {
            res.status(400).json({ message: 'Cannot confirm cancelled order' });
            return;
        }

        // Check available stock for all items
        for (const item of salesOrder.items) {
            const isAvailable = await checkAvailableStock(item.item.toString(), item.quantity);
            if (!isAvailable) {
                const itemDoc = await Item.findById(item.item);

                if (!itemDoc) {
                    res.status(404).json({ message: `Item not found: ${item.item}` });
                    return;
                }

                const available = itemDoc.stockQty - itemDoc.reservedStock;
                res.status(400).json({
                    message: `Insufficient available stock for ${itemDoc.name}. Available: ${available}, Required: ${item.quantity}`,
                });
                return;
            }
        }

        // Reserve stock for all items
        for (const item of salesOrder.items) {
            await reserveStock(item.item.toString(), item.quantity, salesOrder._id.toString(), 'SalesOrder', req.user?._id);
            // Update reservedQty in sales order
            item.reservedQty = item.quantity;
        }

        // Update sales order status
        salesOrder.isConfirmed = true;
        salesOrder.status = 'Confirmed';
        salesOrder.pricesLocked = true;
        salesOrder.confirmedAt = new Date();
        salesOrder.confirmedBy = req.user?._id ? new mongoose.Types.ObjectId(req.user._id) : undefined;
        await salesOrder.save();

        info(`Sales Order confirmed by ${req.user?.name}: ${salesOrder.orderNumber}`);

        const populatedOrder = await SalesOrder.findById(salesOrder._id)
            .populate('customer', 'name phone email')
            .populate('items.item', 'name sku unit');

        res.status(200).json({
            message: 'Sales Order confirmed successfully. Stock reserved.',
            salesOrder: populatedOrder,
        });
    } catch (err) {
        console.error('Confirm Sales Order Error:', err);
        error(`Sales Order confirmation failed: ${(err as Error).message}`);
        res.status(500).json({ message: 'Server Error', error: (err as Error).message });
    }
};

/**
 * @desc Get sales order by ID
 * @route GET /api/sales-orders/:id
 */
/**
 * @swagger
 * /api/sales-orders/{id}:
 *   get:
 *     summary: Get sales order by ID
 *     tags: [Sales - Orders]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: Sales order details retrieved
 */
export const getSalesOrderById = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
        const { id } = req.params;

        if (!mongoose.Types.ObjectId.isValid(id as string)) {
            res.status(400).json({ message: 'Invalid sales order ID format' });
            return;
        }

        const salesOrder = await SalesOrder.findOne({
            _id: id,
            tenantId: req.tenantId,
        })
            .populate('customer', 'name phone email address dues')
            .populate('items.item', 'name sku unit stockQty reservedStock')
            .populate('deliveryChallans')
            .populate('invoices')
            .populate('confirmedBy', 'name')
            .populate('cancelledBy', 'name');

        if (!salesOrder) {
            res.status(404).json({ message: 'Sales Order not found or unauthorized' });
            return;
        }

        // Check if overdue
        const now = new Date();
        const expectedDate = new Date(salesOrder.expectedDeliveryDate);
        if (expectedDate < now && salesOrder.status !== 'Invoiced' && salesOrder.status !== 'Cancelled') {
            salesOrder.isOverdue = true;
            await salesOrder.save();
        }

        res.status(200).json(salesOrder);
    } catch (err) {
        console.error('Get Sales Order Error:', err);
        error(`Get Sales Order failed: ${(err as Error).message}`);
        res.status(500).json({ message: 'Server Error', error: (err as Error).message });
    }
};

/**
 * @desc List all sales orders
 * @route GET /api/sales-orders
 */
/**
 * @swagger
 * /api/sales-orders:
 *   get:
 *     summary: List all sales orders
 *     tags: [Sales - Orders]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of sales orders retrieved
 */
export const listSalesOrders = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
        const { status, customerId, startDate, endDate, overdue } = req.query;

        const filter: any = { tenantId: req.tenantId };

        if (status) {
            filter.status = status;
        }

        if (customerId && mongoose.Types.ObjectId.isValid(customerId as string)) {
            filter.customer = customerId;
        }

        if (startDate || endDate) {
            filter.orderDate = {};
            if (startDate) filter.orderDate.$gte = new Date(startDate as string);
            if (endDate) filter.orderDate.$lte = new Date(endDate as string);
        }

        if (overdue === 'true') {
            filter.isOverdue = true;
        }

        const salesOrders = await SalesOrder.find(filter)
            .populate('customer', 'name phone')
            .populate('items.item', 'name sku unit stock stockQty reservedStock')
            .sort({ createdAt: -1 });

        res.status(200).json(salesOrders);
    } catch (err) {
        console.error('List Sales Orders Error:', err);
        error(`List Sales Orders failed: ${(err as Error).message}`);
        res.status(500).json({ message: 'Server Error', error: (err as Error).message });
    }
};

/**
 * @desc Cancel a sales order (release stock)
 * @route POST /api/sales-orders/:id/cancel
 */
/**
 * @swagger
 * /api/sales-orders/{id}/cancel:
 *   post:
 *     summary: Cancel a sales order (releases stock)
 *     tags: [Sales - Orders]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: Order cancelled and stock released
 */
export const cancelSalesOrder = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
        const { id } = req.params;

        if (!mongoose.Types.ObjectId.isValid(id as string)) {
            res.status(400).json({ message: 'Invalid sales order ID format' });
            return;
        }

        const salesOrder = await SalesOrder.findOne({
            _id: id,
            tenantId: req.tenantId,
        });

        if (!salesOrder) {
            res.status(404).json({ message: 'Sales Order not found or unauthorized' });
            return;
        }

        if (salesOrder.isCancelled) {
            res.status(400).json({ message: 'Sales Order is already cancelled' });
            return;
        }

        if (salesOrder.status === 'Invoiced') {
            res.status(400).json({ message: 'Cannot cancel fully invoiced order' });
            return;
        }

        // Release reserved stock
        if (salesOrder.isConfirmed) {
            for (const item of salesOrder.items) {
                const unreservedQty = item.reservedQty - item.deliveredQty;
                if (unreservedQty > 0) {
                    await releaseStock(item.item.toString(), unreservedQty, salesOrder._id.toString(), 'SalesOrder', req.user?._id as string);
                }
            }
        }

        // Update sales order status
        salesOrder.isCancelled = true;
        salesOrder.status = 'Cancelled';
        salesOrder.cancelledAt = new Date();
        salesOrder.cancelledBy = req.user?._id ? new mongoose.Types.ObjectId(req.user._id) : undefined;
        await salesOrder.save();

        info(`Sales Order cancelled by ${req.user?.name}: ${salesOrder.orderNumber}`);

        const populatedOrder = await SalesOrder.findById(salesOrder._id)
            .populate('customer', 'name phone email')
            .populate('items.item', 'name sku unit');

        res.status(200).json({
            message: 'Sales Order cancelled successfully. Reserved stock released.',
            salesOrder: populatedOrder,
        });
    } catch (err) {
        console.error('Cancel Sales Order Error:', err);
        error(`Sales Order cancellation failed: ${(err as Error).message}`);
        res.status(500).json({ message: 'Server Error', error: (err as Error).message });
    }
};

/**
 * @desc Convert sales order to delivery challan
 * @route POST /api/sales-orders/:id/convert-to-dc
 */
/**
 * @swagger
 * /api/sales-orders/{id}/convert-to-dc:
 *   post:
 *     summary: Convert sales order to delivery challan
 *     tags: [Sales - Orders]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       201:
 *         description: Delivery challan created
 */
export const convertToDeliveryChallan = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
        const { id } = req.params;
        const { items, deliveryDate, vehicleNo, driverName, transportMode, notes } = req.body;

        if (!mongoose.Types.ObjectId.isValid(id as string)) {
            res.status(400).json({ message: 'Invalid sales order ID format' });
            return;
        }

        const salesOrder = await SalesOrder.findOne({
            _id: id,
            tenantId: req.tenantId,
        });

        if (!salesOrder) {
            res.status(404).json({ message: 'Sales Order not found or unauthorized' });
            return;
        }

        if (!salesOrder.isConfirmed) {
            res.status(400).json({ message: 'Only confirmed orders can be converted to Delivery Challan' });
            return;
        }

        if (salesOrder.isCancelled) {
            res.status(400).json({ message: 'Cannot convert cancelled order' });
            return;
        }

        if (salesOrder.status === 'Invoiced') {
            res.status(400).json({ message: 'Order is already fully invoiced' });
            return;
        }

        // Validate items and quantities
        const dcItems = [];
        for (const dcItem of items as DeliveryChallanItem[]) {
            const soItem = salesOrder.items.find((i: any) => i.item.toString() === dcItem.item);
            if (!soItem) {
                res.status(400).json({ message: `Item ${dcItem.item} not found in sales order` });
                return;
            }

            const remainingQty = soItem.reservedQty - soItem.deliveredQty;
            if (dcItem.quantity > remainingQty) {
                res.status(400).json({
                    message: `Cannot deliver ${dcItem.quantity} units. Only ${remainingQty} units remaining for delivery.`,
                });
                return;
            }

            dcItems.push({
                item: dcItem.item,
                quantity: soItem.quantity,
                deliveredQty: dcItem.quantity,
                unit: dcItem.unit || 'pcs',
                description: dcItem.description || '',
            });

            // Update delivered quantity in sales order
            soItem.deliveredQty += dcItem.quantity;

            // ERP-GRADE: Update stock with in-transit tracking
            const item = await Item.findById(dcItem.item);

            if (!item) {
                res.status(404).json({ message: `Item not found: ${dcItem.item}` });
                return;
            }

            const previousState = {
                stockQty: item.stockQty,
                reservedStock: item.reservedStock,
                inTransitStock: item.inTransitStock || 0,
            };

            item.stockQty -= dcItem.quantity;
            item.inTransitStock = (item.inTransitStock || 0) + dcItem.quantity;

            validateStockLevels(item);
            await item.save();

            const newState = {
                stockQty: item.stockQty,
                reservedStock: item.reservedStock,
                inTransitStock: item.inTransitStock,
            };

            await logStockMovement(
                item,
                'DELIVER',
                dcItem.quantity,
                salesOrder._id,
                'SalesOrder',
                req.user?._id as string,
                previousState,
                { ...previousState, stockQty: item.stockQty }
            );

            await logStockMovement(
                item,
                'IN_TRANSIT',
                dcItem.quantity,
                salesOrder._id,
                'SalesOrder',
                req.user?._id as string,
                { ...previousState, stockQty: item.stockQty },
                newState
            );
        }

        // Validate Sales Order quantities
        validateSalesOrderQuantities(salesOrder);

        // Generate unique challan number
        const lastChallan = await DeliveryChallan.findOne({ tenantId: req.tenantId })
            .sort({ createdAt: -1 })
            .select('challanNumber');

        let challanNumber = 1;
        if (lastChallan && lastChallan.challanNumber) {
            const match = lastChallan.challanNumber.match(/DC-(\d+)/);
            if (match) {
                challanNumber = parseInt(match[1]) + 1;
            }
        }

        const challanNo = `DC-${String(challanNumber).padStart(5, '0')}`;

        // Create delivery challan
        const deliveryChallan = await DeliveryChallan.create({
            challanNumber: challanNo,
            customer: salesOrder.customer,
            challanDate: new Date(),
            deliveryDate: deliveryDate || new Date(),
            items: dcItems,
            salesOrder: salesOrder._id,
            vehicleNo: vehicleNo || '',
            driverName: driverName || '',
            transportMode: transportMode || 'road',
            notes: notes || '',
            createdBy: req.user?._id,
            tenantId: req.tenantId
        });

        // Link delivery challan to sales order
        salesOrder.deliveryChallans.push(deliveryChallan._id);

        // Update sales order status
        const totalDelivered = salesOrder.items.reduce((sum: number, item: any) => sum + item.deliveredQty, 0);
        const totalReserved = salesOrder.items.reduce((sum: number, item: any) => sum + item.reservedQty, 0);

        if (totalDelivered >= totalReserved) {
            salesOrder.status = 'Delivered';
        } else if (totalDelivered > 0) {
            salesOrder.status = 'Partially Delivered';
        }

        await salesOrder.save();

        info(`Delivery Challan created from Sales Order ${salesOrder.orderNumber}: ${challanNo}`);

        const populatedChallan = await DeliveryChallan.findById(deliveryChallan._id)
            .populate('customer', 'name phone email')
            .populate('items.item', 'name sku unit')
            .populate('salesOrder', 'orderNumber');

        res.status(201).json({
            message: 'Delivery Challan created successfully',
            deliveryChallan: populatedChallan,
            salesOrder: await SalesOrder.findById(salesOrder._id)
                .populate('customer', 'name phone email')
                .populate('items.item', 'name sku unit'),
        });
    } catch (err) {
        console.error('Convert to Delivery Challan Error:', err);
        error(`Conversion to Delivery Challan failed: ${(err as Error).message}`);
        res.status(500).json({ message: 'Server Error', error: (err as Error).message });
    }
};

/**
 * @desc Convert sales order to invoice
 * @route POST /api/sales-orders/:id/convert-to-invoice
 */
/**
 * @swagger
 * /api/sales-orders/{id}/convert-to-invoice:
 *   post:
 *     summary: Convert sales order to invoice
 *     tags: [Sales - Orders]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       201:
 *         description: Invoice created successfully
 */
export const convertToInvoice = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
        const { id } = req.params;
        const { items, discount = 0, paidAmount = 0, paymentMethod = 'cash', bankAccount } = req.body;

        if (!mongoose.Types.ObjectId.isValid(id as string)) {
            res.status(400).json({ message: 'Invalid sales order ID format' });
            return;
        }

        const salesOrder = await SalesOrder.findOne({
            _id: id,
            tenantId: req.tenantId,
        });

        if (!salesOrder) {
            res.status(404).json({ message: 'Sales Order not found or unauthorized' });
            return;
        }

        if (salesOrder.isCancelled) {
            res.status(400).json({ message: 'Cannot convert cancelled order' });
            return;
        }

        if (salesOrder.status !== 'Delivered' && salesOrder.status !== 'Partially Invoiced') {
            res.status(400).json({
                message: 'Only delivered orders can be converted to Invoice',
            });
            return;
        }

        // Validate items and quantities
        const invoiceItems = [];
        let subtotal = 0;

        for (const invItem of items as InvoiceItem[]) {
            const soItem = salesOrder.items.find((i: any) => i.item.toString() === invItem.item);
            if (!soItem) {
                res.status(400).json({ message: `Item ${invItem.item} not found in sales order` });
                return;
            }

            const remainingQty = soItem.deliveredQty - soItem.invoicedQty;
            if (invItem.quantity > remainingQty) {
                res.status(400).json({
                    message: `Cannot invoice ${invItem.quantity} units. Only ${remainingQty} units remaining for invoicing.`,
                });
                return;
            }

            // Use locked prices from sales order
            const itemTotal = invItem.quantity * soItem.rate;
            subtotal += itemTotal;

            invoiceItems.push({
                item: invItem.item,
                quantity: invItem.quantity,
                price: soItem.rate,
                total: itemTotal,
            });

            // Update invoiced quantity in sales order
            soItem.invoicedQty += invItem.quantity;

            // ERP-GRADE: Release reserved stock and reduce in-transit
            const item = await Item.findById(invItem.item);

            if (!item) {
                res.status(404).json({ message: `Item not found: ${invItem.item}` });
                return;
            }

            const previousState = {
                stockQty: item.stockQty,
                reservedStock: item.reservedStock,
                inTransitStock: item.inTransitStock || 0,
            };

            item.reservedStock -= invItem.quantity;

            if (item.inTransitStock > 0) {
                item.inTransitStock = Math.max(0, item.inTransitStock - invItem.quantity);
            }

            validateStockLevels(item);
            await item.save();

            const newState = {
                stockQty: item.stockQty,
                reservedStock: item.reservedStock,
                inTransitStock: item.inTransitStock,
            };

            await logStockMovement(
                item,
                'INVOICE',
                invItem.quantity,
                salesOrder._id,
                'SalesOrder',
                req.user?._id as string,
                previousState,
                newState
            );
        }

        const totalAmount = subtotal - discount;

        // Determine payment status - USE CENTRALIZED FUNCTION
        const paymentStatus = calculatePaymentStatus(totalAmount, paidAmount, 0);

        // Generate unique invoice number
        const lastInvoice = await Invoice.findOne({ tenantId: req.tenantId })
            .sort({ createdAt: -1 })
            .select('invoiceNo');

        let invoiceNumber = 1;
        if (lastInvoice && lastInvoice.invoiceNo) {
            const match = lastInvoice.invoiceNo.match(/INV-(\d+)/);
            if (match) {
                invoiceNumber = parseInt(match[1]) + 1;
            }
        }

        const invoiceNo = `INV-${String(invoiceNumber).padStart(5, '0')}`;

        // Create invoice
        const invoice = await Invoice.create({
            invoiceNo,
            customer: salesOrder.customer,
            salesOrder: salesOrder._id,
            items: invoiceItems,
            subtotal,
            discount,
            totalAmount,
            paidAmount,
            paymentStatus,
            paymentMethod,
            bankAccount: paymentMethod === 'bank_transfer' ? bankAccount : undefined,
            createdBy: req.user?._id,
            tenantId: req.tenantId,
        });

        // Link invoice to sales order
        salesOrder.invoices.push(invoice._id);

        // Update sales order status
        const totalInvoiced = salesOrder.items.reduce((sum: number, item: any) => sum + item.invoicedQty, 0);
        const totalDelivered = salesOrder.items.reduce((sum: number, item: any) => sum + item.deliveredQty, 0);

        if (totalInvoiced >= totalDelivered) {
            salesOrder.status = 'Invoiced';
        } else if (totalInvoiced > 0) {
            salesOrder.status = 'Partially Invoiced';
        }

        // Validate Sales Order quantities
        validateSalesOrderQuantities(salesOrder);

        await salesOrder.save();

        info(`Invoice created from Sales Order ${salesOrder.orderNumber}: ${invoiceNo}`);

        const populatedInvoice = await Invoice.findById(invoice._id)
            .populate('customer', 'name phone email')
            .populate('items.item', 'name sku')
            .populate('salesOrder', 'orderNumber');

        res.status(201).json({
            message: 'Invoice created successfully',
            invoice: populatedInvoice,
            salesOrder: await SalesOrder.findById(salesOrder._id)
                .populate('customer', 'name phone email')
                .populate('items.item', 'name sku unit'),
        });
    } catch (err) {
        console.error('Convert to Invoice Error:', err);
        error(`Conversion to Invoice failed: ${(err as Error).message}`);
        res.status(500).json({ message: 'Server Error', error: (err as Error).message });
    }
};

/**
 * @desc Generic status update for sales order
 * @route PATCH /api/sales-orders/:id/status
 */
export const updateOrderStatus = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
        const { id } = req.params;
        const { status } = req.body;

        if (!status) {
            res.status(400).json({ message: 'Status is required' });
            return;
        }

        const order = await SalesOrder.findOneAndUpdate(
            { _id: id, tenantId: req.tenantId },
            { status: status },
            { new: true }
        );

        if (!order) {
            res.status(404).json({ message: 'Sales Order not found' });
            return;
        }

        info(`Sales Order ${order.orderNumber} status updated to ${status}`);
        res.status(200).json(order);
    } catch (err) {
        error(`Update Order Status failed: ${(err as Error).message}`);
        res.status(500).json({ message: 'Server Error', error: (err as Error).message });
    }
};

export default {
    createSalesOrder: createSalesOrder as any,
    updateSalesOrder: updateSalesOrder as any,
    confirmSalesOrder: confirmSalesOrder as any,
    getSalesOrderById: getSalesOrderById as any,
    listSalesOrders: listSalesOrders as any,
    cancelSalesOrder: cancelSalesOrder as any,
    updateOrderStatus: updateOrderStatus as any,
    convertToDeliveryChallan: convertToDeliveryChallan as any,
    convertToInvoice: convertToInvoice as any,
};
