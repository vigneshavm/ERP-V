/**
 * SmartERP AI - Complete Database Schema Script
 * 
 * This script creates all MongoDB collections with proper validation schemas,
 * indexes, and relationships for the SmartERP AI application.
 * 
 * Database: MongoDB
 * Total Collections: 25
 * 
 * Run this script with: node scripts/database_schema.js
 * Or use MongoDB Compass/Shell to execute individual collection creations.
 * 
 * Generated: 2026-01-24
 */

import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

// ============================================================================
// CONNECTION CONFIGURATION
// ============================================================================
const connectDB = async () => {
    try {
        const conn = await mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/smarterp', {
            useNewUrlParser: true,
            useUnifiedTopology: true,
        });
        console.log(`MongoDB Connected: ${conn.connection.host}`);
        return conn;
    } catch (error) {
        console.error(`Error: ${error.message}`);
        process.exit(1);
    }
};

// ============================================================================
// COLLECTION DEFINITIONS
// ============================================================================

/**
 * Creates all collections with validation schemas
 */
const createCollections = async (db) => {
    console.log('\n📦 Creating MongoDB Collections...\n');

    // ========================================================================
    // 1. USERS COLLECTION - Core authentication and user management
    // ========================================================================
    await createCollection(db, 'users', {
        validator: {
            $jsonSchema: {
                bsonType: 'object',
                required: ['name', 'email', 'password'],
                properties: {
                    name: { bsonType: 'string', description: 'User full name - required' },
                    email: { bsonType: 'string', pattern: '^.+@.+$', description: 'Unique email - required' },
                    password: { bsonType: 'string', description: 'Bcrypt hashed password - required' },
                    shopName: { bsonType: 'string', description: 'Business/shop name' },
                    gstNumber: { bsonType: 'string', description: 'GST registration number' },
                    shopAddress: { bsonType: 'string', description: 'Shop physical address' },
                    phone: { bsonType: 'string', description: 'Contact phone number' },
                    role: { enum: ['owner'], description: 'User role - owner only' },
                    status: { enum: ['active', 'inactive', 'suspended'], description: 'Account status' },
                    resetPasswordToken: { bsonType: ['string', 'null'] },
                    resetPasswordExpires: { bsonType: ['date', 'null'] },
                    activeDeviceId: { bsonType: ['string', 'null'], description: 'Current active session device ID' },
                    activeSessionCreatedAt: { bsonType: ['date', 'null'] },
                    lastLoginIp: { bsonType: ['string', 'null'] },
                    lastLoginUserAgent: { bsonType: ['string', 'null'] },
                    lastLogin: { bsonType: ['date', 'null'] },
                    loginHistory: {
                        bsonType: 'array',
                        items: {
                            bsonType: 'object',
                            properties: {
                                timestamp: { bsonType: 'date' },
                                ipAddress: { bsonType: 'string' },
                                userAgent: { bsonType: 'string' },
                                success: { bsonType: 'bool' }
                            }
                        }
                    },
                    failedLoginAttempts: { bsonType: 'int', minimum: 0 },
                    lastFailedLogin: { bsonType: ['date', 'null'] },
                    accountLockedUntil: { bsonType: ['date', 'null'] },
                    createdAt: { bsonType: 'date' },
                    updatedAt: { bsonType: 'date' }
                }
            }
        }
    });

    // User indexes
    await createIndexes(db, 'users', [
        { key: { email: 1 }, options: { unique: true } },
        { key: { activeDeviceId: 1 }, options: {} }
    ]);

    // ========================================================================
    // 2. REFRESH TOKENS COLLECTION - JWT token management
    // ========================================================================
    await createCollection(db, 'refreshtokens', {
        validator: {
            $jsonSchema: {
                bsonType: 'object',
                required: ['token', 'user', 'expiresAt'],
                properties: {
                    token: { bsonType: 'string', description: 'Unique refresh token' },
                    user: { bsonType: 'objectId', description: 'Reference to User' },
                    expiresAt: { bsonType: 'date', description: 'Token expiration time' },
                    isRevoked: { bsonType: 'bool' },
                    revokedAt: { bsonType: ['date', 'null'] },
                    replacedByToken: { bsonType: ['string', 'null'] },
                    createdByIp: { bsonType: ['string', 'null'] },
                    userAgent: { bsonType: ['string', 'null'] },
                    createdAt: { bsonType: 'date' },
                    updatedAt: { bsonType: 'date' }
                }
            }
        }
    });

    await createIndexes(db, 'refreshtokens', [
        { key: { token: 1 }, options: { unique: true } },
        { key: { user: 1 }, options: {} },
        { key: { expiresAt: 1 }, options: { expireAfterSeconds: 0 } } // TTL index
    ]);

    // ========================================================================
    // 3. CUSTOMERS COLLECTION - Customer management
    // ========================================================================
    await createCollection(db, 'customers', {
        validator: {
            $jsonSchema: {
                bsonType: 'object',
                required: ['name', 'phone', 'owner'],
                properties: {
                    name: { bsonType: 'string', description: 'Customer name - required' },
                    phone: { bsonType: 'string', description: 'Phone number - required' },
                    email: { bsonType: 'string', pattern: '^\\w+([.-]?\\w+)*@\\w+([.-]?\\w+)*(\\.\\w{2,3})+$' },
                    address: { bsonType: 'string' },
                    dues: { bsonType: 'number', minimum: 0, description: 'Outstanding dues amount' },
                    transactionHistory: {
                        bsonType: 'array',
                        items: { bsonType: 'objectId' },
                        description: 'References to Transaction documents'
                    },
                    referredBy: { bsonType: ['objectId', 'null'], description: 'Reference to referring Customer' },
                    owner: { bsonType: 'objectId', description: 'Reference to User (shop owner)' },
                    createdAt: { bsonType: 'date' },
                    updatedAt: { bsonType: 'date' }
                }
            }
        }
    });

    await createIndexes(db, 'customers', [
        { key: { phone: 1, owner: 1 }, options: { unique: true } }
    ]);

    // ========================================================================
    // 4. SUPPLIERS COLLECTION - Supplier/vendor management
    // ========================================================================
    await createCollection(db, 'suppliers', {
        validator: {
            $jsonSchema: {
                bsonType: 'object',
                required: ['businessName', 'contactPersonName', 'contactNo', 'email', 'physicalAddress', 'gstNo', 'supplierType', 'owner'],
                properties: {
                    supplierId: { bsonType: 'string', description: 'Unique supplier ID' },
                    businessName: { bsonType: 'string', description: 'Business/company name' },
                    contactPersonName: { bsonType: 'string', description: 'Primary contact person' },
                    contactNo: { bsonType: 'string', description: 'Contact phone number' },
                    email: { bsonType: 'string', pattern: '^\\w+([.-]?\\w+)*@\\w+([.-]?\\w+)*(\\.\\w{2,3})+$' },
                    physicalAddress: { bsonType: 'string' },
                    gstNo: { bsonType: 'string', description: 'GST registration number' },
                    supplierType: { enum: ['manufacturer', 'wholesaler', 'distributor'] },
                    openingBalance: { bsonType: 'number' },
                    balanceType: { enum: ['payable', 'receivable'] },
                    creditPeriod: { bsonType: 'int', minimum: 0, description: 'Credit period in days' },
                    status: { enum: ['active', 'inactive'] },
                    itemsSupplied: {
                        bsonType: 'array',
                        items: { bsonType: 'objectId' },
                        description: 'References to Item documents'
                    },
                    owner: { bsonType: 'objectId', description: 'Reference to User' },
                    createdAt: { bsonType: 'date' },
                    updatedAt: { bsonType: 'date' }
                }
            }
        }
    });

    await createIndexes(db, 'suppliers', [
        { key: { supplierId: 1 }, options: { unique: true, sparse: true } },
        { key: { contactNo: 1, owner: 1 }, options: { unique: true } }
    ]);

    // ========================================================================
    // 5. ITEMS COLLECTION - Inventory/product management
    // ========================================================================
    await createCollection(db, 'items', {
        validator: {
            $jsonSchema: {
                bsonType: 'object',
                required: ['name', 'costPrice', 'sellingPrice', 'addedBy'],
                properties: {
                    name: { bsonType: 'string', description: 'Product/item name' },
                    sku: { bsonType: ['string', 'null'], description: 'Stock Keeping Unit' },
                    category: { bsonType: ['string', 'null'], description: 'Product category' },
                    costPrice: { bsonType: 'number', minimum: 0, description: 'Cost/purchase price' },
                    sellingPrice: { bsonType: 'number', minimum: 0, description: 'Selling price' },
                    stockQty: { bsonType: 'number', minimum: 0, description: 'Current stock quantity' },
                    reservedStock: { bsonType: 'number', minimum: 0, description: 'Reserved for orders' },
                    inTransitStock: { bsonType: 'number', minimum: 0, description: 'Stock in transit' },
                    lowStockLimit: { bsonType: 'number', minimum: 0, description: 'Low stock alert threshold' },
                    unit: { bsonType: 'string', description: 'Unit of measurement (pcs, kg, etc.)' },
                    addedBy: { bsonType: 'objectId', description: 'Reference to User (owner)' },
                    createdAt: { bsonType: 'date' },
                    updatedAt: { bsonType: 'date' }
                }
            }
        }
    });

    await createIndexes(db, 'items', [
        { key: { name: 1, addedBy: 1 }, options: { unique: true } }
    ]);

    // ========================================================================
    // 6. INVOICES COLLECTION - Sales invoices
    // ========================================================================
    await createCollection(db, 'invoices', {
        validator: {
            $jsonSchema: {
                bsonType: 'object',
                required: ['invoiceNo', 'subtotal', 'totalAmount', 'createdBy'],
                properties: {
                    invoiceNo: { bsonType: 'string', description: 'Invoice number' },
                    customer: { bsonType: ['objectId', 'null'], description: 'Reference to Customer' },
                    salesOrder: { bsonType: ['objectId', 'null'], description: 'Reference to SalesOrder' },
                    items: {
                        bsonType: 'array',
                        items: {
                            bsonType: 'object',
                            required: ['item', 'quantity', 'price', 'total'],
                            properties: {
                                item: { bsonType: 'objectId' },
                                quantity: { bsonType: 'number', minimum: 0 },
                                price: { bsonType: 'number', minimum: 0 },
                                tax: { bsonType: 'number' },
                                discount: { bsonType: 'number' },
                                total: { bsonType: 'number' }
                            }
                        }
                    },
                    subtotal: { bsonType: 'number', minimum: 0 },
                    tax: { bsonType: 'number' },
                    discount: { bsonType: 'number' },
                    totalAmount: { bsonType: 'number', minimum: 0 },
                    paidAmount: { bsonType: 'number' },
                    creditApplied: { bsonType: 'number' },
                    previousDueAmount: { bsonType: 'number' },
                    paymentStatus: { enum: ['paid', 'unpaid', 'partial'] },
                    paymentMethod: { enum: ['cash', 'upi', 'card', 'due', 'split', 'bank_transfer', 'cheque', 'credit'] },
                    paidViaMethod: { enum: ['cash', 'upi', 'card', 'due', 'split', 'bank_transfer', 'cheque', 'credit', null] },
                    splitPaymentDetails: {
                        bsonType: 'array',
                        items: {
                            bsonType: 'object',
                            properties: {
                                method: { enum: ['cash', 'upi', 'card', 'due', 'split', 'bank_transfer', 'cheque'] },
                                amount: { bsonType: 'number' }
                            }
                        }
                    },
                    bankAccount: { bsonType: ['objectId', 'null'], description: 'Reference to BankAccount' },
                    returnedAmount: { bsonType: 'number' },
                    hasReturns: { bsonType: 'bool' },
                    createdBy: { bsonType: 'objectId', description: 'Reference to User' },
                    isDeleted: { bsonType: 'bool', description: 'Soft delete flag' },
                    deletedAt: { bsonType: ['date', 'null'] },
                    deletedBy: { bsonType: ['objectId', 'null'] },
                    createdAt: { bsonType: 'date' },
                    updatedAt: { bsonType: 'date' }
                }
            }
        }
    });

    await createIndexes(db, 'invoices', [
        { key: { invoiceNo: 1, createdBy: 1 }, options: { unique: true } }
    ]);

    // ========================================================================
    // 7. SALES ORDERS COLLECTION - Sales order management
    // ========================================================================
    await createCollection(db, 'salesorders', {
        validator: {
            $jsonSchema: {
                bsonType: 'object',
                required: ['orderNumber', 'customer', 'orderDate', 'expectedDeliveryDate', 'subtotal', 'totalAmount', 'createdBy'],
                properties: {
                    orderNumber: { bsonType: 'string' },
                    customer: { bsonType: 'objectId', description: 'Reference to Customer' },
                    orderDate: { bsonType: 'date' },
                    expectedDeliveryDate: { bsonType: 'date' },
                    items: {
                        bsonType: 'array',
                        items: {
                            bsonType: 'object',
                            required: ['item', 'quantity', 'rate', 'total'],
                            properties: {
                                item: { bsonType: 'objectId' },
                                quantity: { bsonType: 'number', minimum: 0 },
                                rate: { bsonType: 'number', minimum: 0 },
                                tax: { bsonType: 'number' },
                                discount: { bsonType: 'number' },
                                reservedQty: { bsonType: 'number' },
                                deliveredQty: { bsonType: 'number' },
                                invoicedQty: { bsonType: 'number' },
                                total: { bsonType: 'number' }
                            }
                        }
                    },
                    subtotal: { bsonType: 'number' },
                    taxTotal: { bsonType: 'number' },
                    discountTotal: { bsonType: 'number' },
                    totalAmount: { bsonType: 'number' },
                    status: { enum: ['Draft', 'Confirmed', 'Partially Delivered', 'Delivered', 'Partially Invoiced', 'Invoiced', 'Cancelled'] },
                    notes: { bsonType: 'string' },
                    isConfirmed: { bsonType: 'bool' },
                    isCancelled: { bsonType: 'bool' },
                    isOverdue: { bsonType: 'bool' },
                    pricesLocked: { bsonType: 'bool' },
                    deliveryChallans: { bsonType: 'array', items: { bsonType: 'objectId' } },
                    invoices: { bsonType: 'array', items: { bsonType: 'objectId' } },
                    createdBy: { bsonType: 'objectId' },
                    confirmedAt: { bsonType: ['date', 'null'] },
                    confirmedBy: { bsonType: ['objectId', 'null'] },
                    cancelledAt: { bsonType: ['date', 'null'] },
                    cancelledBy: { bsonType: ['objectId', 'null'] },
                    createdAt: { bsonType: 'date' },
                    updatedAt: { bsonType: 'date' }
                }
            }
        }
    });

    await createIndexes(db, 'salesorders', [
        { key: { orderNumber: 1, createdBy: 1 }, options: { unique: true } },
        { key: { customer: 1 }, options: {} },
        { key: { status: 1 }, options: {} },
        { key: { expectedDeliveryDate: 1 }, options: {} },
        { key: { createdAt: -1 }, options: {} }
    ]);

    // ========================================================================
    // 8. DELIVERY CHALLANS COLLECTION - Delivery tracking
    // ========================================================================
    await createCollection(db, 'deliverychallans', {
        validator: {
            $jsonSchema: {
                bsonType: 'object',
                required: ['challanNumber', 'customer', 'challanDate', 'createdBy'],
                properties: {
                    challanNumber: { bsonType: 'string' },
                    customer: { bsonType: 'objectId' },
                    challanDate: { bsonType: 'date' },
                    deliveryDate: { bsonType: ['date', 'null'] },
                    items: {
                        bsonType: 'array',
                        items: {
                            bsonType: 'object',
                            required: ['item', 'quantity', 'deliveredQty'],
                            properties: {
                                item: { bsonType: 'objectId' },
                                quantity: { bsonType: 'number', minimum: 0 },
                                deliveredQty: { bsonType: 'number', minimum: 0 },
                                unit: { bsonType: 'string' },
                                description: { bsonType: 'string' }
                            }
                        }
                    },
                    salesOrder: { bsonType: ['objectId', 'null'] },
                    vehicleNo: { bsonType: 'string' },
                    driverName: { bsonType: 'string' },
                    transportMode: { enum: ['road', 'rail', 'air', 'ship', 'courier'] },
                    notes: { bsonType: 'string' },
                    status: { enum: ['Draft', 'Delivered', 'Converted'] },
                    convertedToInvoice: { bsonType: ['objectId', 'null'] },
                    convertedAt: { bsonType: ['date', 'null'] },
                    systemGenerated: { bsonType: 'bool' },
                    isDeleted: { bsonType: 'bool' },
                    createdBy: { bsonType: 'objectId' },
                    createdAt: { bsonType: 'date' },
                    updatedAt: { bsonType: 'date' }
                }
            }
        }
    });

    await createIndexes(db, 'deliverychallans', [
        { key: { challanNumber: 1, createdBy: 1 }, options: { unique: true } },
        { key: { customer: 1 }, options: {} },
        { key: { salesOrder: 1 }, options: {} },
        { key: { createdAt: -1 }, options: {} }
    ]);

    // ========================================================================
    // 9. ESTIMATES COLLECTION - Quotations/estimates
    // ========================================================================
    await createCollection(db, 'estimates', {
        validator: {
            $jsonSchema: {
                bsonType: 'object',
                required: ['estimateNo', 'subtotal', 'totalAmount'],
                properties: {
                    estimateNo: { bsonType: 'string' },
                    customer: { bsonType: ['objectId', 'null'], description: 'null = Walk-in Customer' },
                    items: {
                        bsonType: 'array',
                        items: {
                            bsonType: 'object',
                            required: ['name', 'quantity', 'price', 'total'],
                            properties: {
                                itemId: { bsonType: ['objectId', 'null'] },
                                name: { bsonType: 'string' },
                                quantity: { bsonType: 'number', minimum: 0 },
                                price: { bsonType: 'number', minimum: 0 },
                                total: { bsonType: 'number', minimum: 0 }
                            }
                        }
                    },
                    subtotal: { bsonType: 'number' },
                    discount: { bsonType: 'number', minimum: 0 },
                    totalAmount: { bsonType: 'number' },
                    notes: { bsonType: 'string' },
                    status: { enum: ['draft', 'sent', 'accepted', 'rejected', 'expired'] },
                    validUntil: { bsonType: ['date', 'null'] },
                    createdAt: { bsonType: 'date' },
                    updatedAt: { bsonType: 'date' }
                }
            }
        }
    });

    await createIndexes(db, 'estimates', [
        { key: { estimateNo: 1 }, options: { unique: true } },
        { key: { customer: 1 }, options: {} },
        { key: { createdAt: -1 }, options: {} }
    ]);

    // ========================================================================
    // 10. RETURNS COLLECTION - Sales returns
    // ========================================================================
    await createCollection(db, 'returns', {
        validator: {
            $jsonSchema: {
                bsonType: 'object',
                required: ['returnId', 'invoice', 'returnType', 'subtotal', 'totalReturnAmount', 'createdBy'],
                properties: {
                    returnId: { bsonType: 'string' },
                    invoice: { bsonType: 'objectId' },
                    customer: { bsonType: ['objectId', 'null'] },
                    customerName: { bsonType: 'string' },
                    returnDate: { bsonType: 'date' },
                    returnType: { enum: ['partial', 'full'] },
                    refundMethod: { enum: ['credit', 'cash', 'bank', 'upi', 'original_payment', 'bank_transfer', 'card', 'cheque'] },
                    actualRefundMethod: { enum: ['credit', 'cash', 'bank_transfer', 'upi', 'card', 'cheque', null] },
                    originalPaymentInfo: {
                        bsonType: 'object',
                        properties: {
                            paymentMethod: { bsonType: 'string' },
                            paidViaMethod: { bsonType: 'string' },
                            creditApplied: { bsonType: 'number' },
                            paidAmount: { bsonType: 'number' },
                            splitPaymentDetails: { bsonType: 'array' },
                            bankAccount: { bsonType: ['objectId', 'null'] }
                        }
                    },
                    bankAccount: { bsonType: ['objectId', 'null'] },
                    refundProcessed: { bsonType: 'bool' },
                    items: {
                        bsonType: 'array',
                        items: {
                            bsonType: 'object',
                            required: ['product', 'productName', 'originalQty', 'returnedQty', 'rate', 'lineTotal', 'condition', 'reason'],
                            properties: {
                                product: { bsonType: 'objectId' },
                                productName: { bsonType: 'string' },
                                originalQty: { bsonType: 'number' },
                                returnedQty: { bsonType: 'number' },
                                rate: { bsonType: 'number' },
                                taxPercent: { bsonType: 'number' },
                                taxAmount: { bsonType: 'number' },
                                lineTotal: { bsonType: 'number' },
                                condition: { enum: ['damaged', 'not_damaged'] },
                                reason: { bsonType: 'string' },
                                inventoryAdjusted: { bsonType: 'bool' }
                            }
                        }
                    },
                    subtotal: { bsonType: 'number' },
                    taxAmount: { bsonType: 'number' },
                    discountAmount: { bsonType: 'number' },
                    totalReturnAmount: { bsonType: 'number' },
                    status: { enum: ['processed', 'pending', 'refunded'] },
                    notes: { bsonType: 'string' },
                    createdBy: { bsonType: 'objectId' },
                    createdAt: { bsonType: 'date' },
                    updatedAt: { bsonType: 'date' }
                }
            }
        }
    });

    await createIndexes(db, 'returns', [
        { key: { returnId: 1, createdBy: 1 }, options: { unique: true } },
        { key: { invoice: 1 }, options: {} },
        { key: { customer: 1 }, options: {} }
    ]);

    // ========================================================================
    // 11. PURCHASE RETURNS COLLECTION - Returns to suppliers
    // ========================================================================
    await createCollection(db, 'purchasereturns', {
        validator: {
            $jsonSchema: {
                bsonType: 'object',
                required: ['returnId', 'supplier', 'subtotal', 'totalAmount', 'createdBy'],
                properties: {
                    returnId: { bsonType: 'string' },
                    bill: { bsonType: ['objectId', 'null'] },
                    supplier: { bsonType: 'objectId' },
                    returnDate: { bsonType: 'date' },
                    refundMethod: { enum: ['credit', 'cash', 'bank_transfer', 'adjust_next_bill'] },
                    bankAccount: { bsonType: ['objectId', 'null'] },
                    items: {
                        bsonType: 'array',
                        items: {
                            bsonType: 'object',
                            required: ['productName', 'quantity', 'rate', 'amount', 'reason'],
                            properties: {
                                productName: { bsonType: 'string' },
                                quantity: { bsonType: 'number' },
                                rate: { bsonType: 'number' },
                                tax: { bsonType: 'number' },
                                amount: { bsonType: 'number' },
                                reason: { bsonType: 'string' }
                            }
                        }
                    },
                    subtotal: { bsonType: 'number' },
                    taxAmount: { bsonType: 'number' },
                    discountAmount: { bsonType: 'number' },
                    totalAmount: { bsonType: 'number' },
                    notes: { bsonType: 'string' },
                    createdBy: { bsonType: 'objectId' },
                    createdAt: { bsonType: 'date' },
                    updatedAt: { bsonType: 'date' }
                }
            }
        }
    });

    await createIndexes(db, 'purchasereturns', [
        { key: { returnId: 1, createdBy: 1 }, options: { unique: true } }
    ]);

    // ========================================================================
    // 12. BILLS COLLECTION - Purchase bills from suppliers
    // ========================================================================
    await createCollection(db, 'bills', {
        validator: {
            $jsonSchema: {
                bsonType: 'object',
                required: ['billNo', 'date', 'supplier', 'amount', 'createdBy'],
                properties: {
                    billNo: { bsonType: 'string' },
                    date: { bsonType: 'date' },
                    supplier: { bsonType: 'objectId' },
                    amount: { bsonType: 'number' },
                    dueDate: { bsonType: ['date', 'null'] },
                    status: { enum: ['paid', 'unpaid'] },
                    paymentMethod: { enum: ['cash', 'upi', 'card', 'bank_transfer', 'cheque'] },
                    paidAmount: { bsonType: 'number' },
                    bankAccount: { bsonType: ['objectId', 'null'] },
                    paymentStatus: { enum: ['paid', 'unpaid', 'partial'] },
                    description: { bsonType: 'string' },
                    createdBy: { bsonType: 'objectId' },
                    createdAt: { bsonType: 'date' },
                    updatedAt: { bsonType: 'date' }
                }
            }
        }
    });

    await createIndexes(db, 'bills', [
        { key: { billNo: 1, createdBy: 1 }, options: { unique: true } }
    ]);

    // ========================================================================
    // 13. EXPENSES COLLECTION - Business expenses
    // ========================================================================
    await createCollection(db, 'expenses', {
        validator: {
            $jsonSchema: {
                bsonType: 'object',
                required: ['expenseNo', 'date', 'category', 'amount', 'createdBy'],
                properties: {
                    expenseNo: { bsonType: 'string' },
                    date: { bsonType: 'date' },
                    category: {
                        enum: ['Rent', 'Utilities', 'Salaries', 'Transportation', 'Marketing',
                            'Office Supplies', 'Maintenance', 'Insurance', 'Professional Fees',
                            'Miscellaneous', 'Travel', 'Electricity', 'Salary',
                            'Food & Refreshments', 'Other']
                    },
                    amount: { bsonType: 'number' },
                    paymentMethod: { enum: ['cash', 'upi', 'card', 'cheque', 'bank_transfer'] },
                    bankAccount: { bsonType: ['objectId', 'null'] },
                    description: { bsonType: 'string' },
                    receipt: { bsonType: 'string', description: 'URL to uploaded receipt' },
                    createdBy: { bsonType: 'objectId' },
                    createdAt: { bsonType: 'date' },
                    updatedAt: { bsonType: 'date' }
                }
            }
        }
    });

    await createIndexes(db, 'expenses', [
        { key: { expenseNo: 1, createdBy: 1 }, options: { unique: true } }
    ]);

    // ========================================================================
    // 14. EXPENSE CATEGORIES COLLECTION - Custom expense categories
    // ========================================================================
    await createCollection(db, 'expensecategories', {
        validator: {
            $jsonSchema: {
                bsonType: 'object',
                required: ['name', 'createdBy'],
                properties: {
                    name: { bsonType: 'string' },
                    monthly_budget: { bsonType: 'number' },
                    approval_required: { bsonType: 'bool' },
                    is_cash_allowed: { bsonType: 'bool' },
                    is_active: { bsonType: 'bool' },
                    gst_eligible: { bsonType: 'bool' },
                    createdBy: { bsonType: 'objectId' },
                    createdAt: { bsonType: 'date' },
                    updatedAt: { bsonType: 'date' }
                }
            }
        }
    });

    await createIndexes(db, 'expensecategories', [
        { key: { name: 1, createdBy: 1 }, options: { unique: true } }
    ]);

    // ========================================================================
    // 15. RECURRING EXPENSES COLLECTION - Scheduled recurring expenses
    // ========================================================================
    await createCollection(db, 'recurringexpenses', {
        validator: {
            $jsonSchema: {
                bsonType: 'object',
                required: ['category', 'amount', 'next_due', 'createdBy'],
                properties: {
                    category: { bsonType: 'string' },
                    amount: { bsonType: 'number' },
                    frequency: { enum: ['MONTHLY', 'QUARTERLY', 'YEARLY'] },
                    vendor: { bsonType: 'string' },
                    next_due: { bsonType: 'date' },
                    branch_id: { bsonType: 'string' },
                    branch_name: { bsonType: 'string' },
                    description: { bsonType: 'string' },
                    is_active: { bsonType: 'bool' },
                    createdBy: { bsonType: 'objectId' },
                    createdAt: { bsonType: 'date' },
                    updatedAt: { bsonType: 'date' }
                }
            }
        }
    });

    // ========================================================================
    // 16. TRANSACTIONS COLLECTION - All financial transactions
    // ========================================================================
    await createCollection(db, 'transactions', {
        validator: {
            $jsonSchema: {
                bsonType: 'object',
                required: ['type', 'amount'],
                properties: {
                    type: { enum: ['sale', 'due', 'payment', 'purchase', 'refund', 'return', 'due_adjustment'] },
                    customer: { bsonType: ['objectId', 'null'] },
                    invoice: { bsonType: ['objectId', 'null'] },
                    return: { bsonType: ['objectId', 'null'] },
                    dueAdjustment: { bsonType: ['objectId', 'null'] },
                    amount: { bsonType: 'number' },
                    paymentMethod: { enum: ['cash', 'upi', 'card', 'due', 'split', 'bank_transfer', 'cheque', 'credit'] },
                    description: { bsonType: 'string' },
                    createdAt: { bsonType: 'date' },
                    updatedAt: { bsonType: 'date' }
                }
            }
        }
    });

    // ========================================================================
    // 17. PAYMENT IN COLLECTION - Customer payments received
    // ========================================================================
    await createCollection(db, 'paymentins', {
        validator: {
            $jsonSchema: {
                bsonType: 'object',
                required: ['receiptNumber', 'customer', 'paymentDate', 'totalAmount', 'depositAccount', 'createdBy'],
                properties: {
                    receiptNumber: { bsonType: 'string' },
                    customer: { bsonType: 'objectId' },
                    paymentDate: { bsonType: 'date' },
                    totalAmount: { bsonType: 'number', minimum: 0.01 },
                    paymentMethods: {
                        bsonType: 'array',
                        items: {
                            bsonType: 'object',
                            required: ['method', 'amount'],
                            properties: {
                                method: { enum: ['cash', 'upi', 'card', 'bank_transfer', 'cheque'] },
                                amount: { bsonType: 'number', minimum: 0.01 },
                                reference: { bsonType: 'string' },
                                bankAccount: { bsonType: ['objectId', 'null'] },
                                cardType: { bsonType: 'string' },
                                chequeNumber: { bsonType: 'string' },
                                chequeDate: { bsonType: ['date', 'null'] },
                                chequeBank: { bsonType: 'string' }
                            }
                        }
                    },
                    allocatedInvoices: {
                        bsonType: 'array',
                        items: {
                            bsonType: 'object',
                            required: ['invoice', 'allocatedAmount', 'invoiceBalanceBefore'],
                            properties: {
                                invoice: { bsonType: 'objectId' },
                                allocatedAmount: { bsonType: 'number' },
                                invoiceBalanceBefore: { bsonType: 'number' }
                            }
                        }
                    },
                    creditApplied: { bsonType: 'number', minimum: 0 },
                    excessAmount: { bsonType: 'number', minimum: 0 },
                    depositAccount: { description: 'Can be "cash" string or BankAccount ObjectId' },
                    notes: { bsonType: 'string' },
                    createdBy: { bsonType: 'objectId' },
                    createdAt: { bsonType: 'date' },
                    updatedAt: { bsonType: 'date' }
                }
            }
        }
    });

    await createIndexes(db, 'paymentins', [
        { key: { receiptNumber: 1, createdBy: 1 }, options: { unique: true } },
        { key: { customer: 1 }, options: {} },
        { key: { createdBy: 1 }, options: {} },
        { key: { paymentDate: -1 }, options: {} }
    ]);

    // ========================================================================
    // 18. DUES COLLECTION - Customer outstanding dues
    // ========================================================================
    await createCollection(db, 'dues', {
        validator: {
            $jsonSchema: {
                bsonType: 'object',
                required: ['customer', 'amount'],
                properties: {
                    customer: { bsonType: 'objectId' },
                    amount: { bsonType: 'number' },
                    note: { bsonType: 'string' },
                    isCleared: { bsonType: 'bool' },
                    lastPaidDate: { bsonType: ['date', 'null'] },
                    createdAt: { bsonType: 'date' },
                    updatedAt: { bsonType: 'date' }
                }
            }
        }
    });

    // ========================================================================
    // 19. DUE ADJUSTMENTS COLLECTION - Due payment adjustments
    // ========================================================================
    await createCollection(db, 'dueadjustments', {
        validator: {
            $jsonSchema: {
                bsonType: 'object',
                required: ['customer', 'adjustmentAmount', 'adjustmentMethod', 'previousDue', 'updatedDue', 'createdBy'],
                properties: {
                    customer: { bsonType: 'objectId' },
                    relatedInvoice: { bsonType: ['objectId', 'null'] },
                    adjustmentAmount: { bsonType: 'number', minimum: 0 },
                    adjustmentMethod: { enum: ['cash', 'bank', 'credit', 'original_payment'] },
                    previousDue: { bsonType: 'number' },
                    updatedDue: { bsonType: 'number' },
                    notes: { bsonType: 'string' },
                    createdBy: { bsonType: 'objectId' },
                    createdAt: { bsonType: 'date' },
                    updatedAt: { bsonType: 'date' }
                }
            }
        }
    });

    await createIndexes(db, 'dueadjustments', [
        { key: { customer: 1, createdBy: 1 }, options: {} },
        { key: { createdBy: 1 }, options: {} }
    ]);

    // ========================================================================
    // 20. BANK ACCOUNTS COLLECTION - Bank account management
    // ========================================================================
    await createCollection(db, 'bankaccounts', {
        validator: {
            $jsonSchema: {
                bsonType: 'object',
                required: ['bankName', 'accountNumber', 'ifsc', 'userId'],
                properties: {
                    bankName: { bsonType: 'string' },
                    accountNumber: { bsonType: 'string', description: 'AES-256-CBC encrypted' },
                    accountType: { enum: ['Savings', 'Current', 'Overdraft', 'Loan'] },
                    branch: { bsonType: 'string' },
                    ifsc: { bsonType: 'string' },
                    openingBalance: { bsonType: 'number' },
                    currentBalance: { bsonType: 'number' },
                    status: { enum: ['active', 'inactive'] },
                    userId: { bsonType: 'objectId' },
                    transactions: { bsonType: 'array', items: { bsonType: 'objectId' } },
                    createdAt: { bsonType: 'date' },
                    updatedAt: { bsonType: 'date' }
                }
            }
        }
    });

    // ========================================================================
    // 21. CASHBANK TRANSACTIONS COLLECTION - Cash/bank transfers
    // ========================================================================
    await createCollection(db, 'cashbanktransactions', {
        validator: {
            $jsonSchema: {
                bsonType: 'object',
                required: ['type', 'amount', 'fromAccount', 'toAccount', 'userId'],
                properties: {
                    type: { enum: ['transfer', 'in', 'out'] },
                    amount: { bsonType: 'number', minimum: 0.01 },
                    fromAccount: { description: 'ObjectId or "cash"' },
                    toAccount: { description: 'ObjectId or "cash"' },
                    description: { bsonType: 'string' },
                    date: { bsonType: 'date' },
                    reconciled: { bsonType: 'bool' },
                    reconciledDate: { bsonType: ['date', 'null'] },
                    reconciledBy: { bsonType: ['objectId', 'null'] },
                    reference: { bsonType: 'string' },
                    userId: { bsonType: 'objectId' },
                    createdAt: { bsonType: 'date' },
                    updatedAt: { bsonType: 'date' }
                }
            }
        }
    });

    // ========================================================================
    // 22. STOCK MOVEMENTS COLLECTION - Inventory movement tracking
    // ========================================================================
    await createCollection(db, 'stockmovements', {
        validator: {
            $jsonSchema: {
                bsonType: 'object',
                required: ['item', 'type', 'quantity', 'sourceId', 'sourceType',
                    'previousStock', 'previousReserved', 'previousInTransit',
                    'newStock', 'newReserved', 'newInTransit', 'createdBy'],
                properties: {
                    item: { bsonType: 'objectId' },
                    type: { enum: ['RESERVE', 'RELEASE', 'DELIVER', 'IN_TRANSIT', 'POS_SALE', 'RETURN', 'INVOICE'] },
                    quantity: { bsonType: 'number' },
                    sourceId: { bsonType: 'objectId' },
                    sourceType: { enum: ['SalesOrder', 'DeliveryChallan', 'Invoice', 'Return'] },
                    previousStock: { bsonType: 'number' },
                    previousReserved: { bsonType: 'number' },
                    previousInTransit: { bsonType: 'number' },
                    newStock: { bsonType: 'number' },
                    newReserved: { bsonType: 'number' },
                    newInTransit: { bsonType: 'number' },
                    createdBy: { bsonType: 'objectId' },
                    createdAt: { bsonType: 'date' },
                    updatedAt: { bsonType: 'date' }
                }
            }
        }
    });

    await createIndexes(db, 'stockmovements', [
        { key: { item: 1, createdAt: -1 }, options: {} },
        { key: { sourceId: 1, sourceType: 1 }, options: {} },
        { key: { type: 1 }, options: {} }
    ]);

    // ========================================================================
    // 23. COUNTERS COLLECTION - Atomic sequence generation
    // ========================================================================
    await createCollection(db, 'counters', {
        validator: {
            $jsonSchema: {
                bsonType: 'object',
                required: ['name', 'userId'],
                properties: {
                    name: { bsonType: 'string', description: 'Counter name (invoice, order, etc.)' },
                    seq: { bsonType: 'int', minimum: 0 },
                    userId: { bsonType: 'objectId' },
                    createdAt: { bsonType: 'date' },
                    updatedAt: { bsonType: 'date' }
                }
            }
        }
    });

    await createIndexes(db, 'counters', [
        { key: { name: 1, userId: 1 }, options: { unique: true } }
    ]);

    // ========================================================================
    // 24. NOTIFICATIONS COLLECTION - System notifications
    // ========================================================================
    await createCollection(db, 'notifications', {
        validator: {
            $jsonSchema: {
                bsonType: 'object',
                required: ['message'],
                properties: {
                    type: { enum: ['stock', 'due', 'payment', 'system'] },
                    message: { bsonType: 'string' },
                    read: { bsonType: 'bool' },
                    relatedItem: { bsonType: ['objectId', 'null'] },
                    relatedCustomer: { bsonType: ['objectId', 'null'] },
                    createdAt: { bsonType: 'date' },
                    updatedAt: { bsonType: 'date' }
                }
            }
        }
    });

    // ========================================================================
    // 25. AUDIT LOGS COLLECTION - Enterprise audit trail (append-only)
    // ========================================================================
    await createCollection(db, 'auditlogs', {
        validator: {
            $jsonSchema: {
                bsonType: 'object',
                required: ['userId', 'action', 'entityType', 'entityId', 'ipAddress', 'currentHash'],
                properties: {
                    userId: { bsonType: 'objectId' },
                    action: {
                        enum: ['DELETE_INVOICE', 'DELETE_CUSTOMER', 'DELETE_ITEM',
                            'UPDATE_INVOICE', 'UPDATE_CUSTOMER', 'UPDATE_ITEM',
                            'DELETE_RETURN', 'UPDATE_RETURN', 'DELETE_SALES_ORDER',
                            'UPDATE_SALES_ORDER', 'DELETE_PAYMENT', 'UPDATE_PAYMENT',
                            'FORCE_LOGOUT', 'PASSWORD_RESET', 'USER_ROLE_CHANGE']
                    },
                    entityType: { enum: ['Invoice', 'Customer', 'Item', 'Return', 'SalesOrder', 'Payment', 'User'] },
                    entityId: { bsonType: 'objectId' },
                    beforeSnapshot: { description: 'Data before change' },
                    afterSnapshot: { description: 'Data after change' },
                    ipAddress: { bsonType: 'string' },
                    userAgent: { bsonType: ['string', 'null'] },
                    metadata: { bsonType: 'object' },
                    previousHash: { bsonType: ['string', 'null'], description: 'SHA-256 hash of previous log' },
                    currentHash: { bsonType: 'string', description: 'SHA-256 hash for integrity' },
                    retentionUntil: { bsonType: 'date', description: '7 year default retention' },
                    createdAt: { bsonType: 'date' },
                    updatedAt: { bsonType: 'date' }
                }
            }
        }
    });

    await createIndexes(db, 'auditlogs', [
        { key: { userId: 1 }, options: {} },
        { key: { action: 1 }, options: {} },
        { key: { createdAt: -1 }, options: {} },
        { key: { userId: 1, createdAt: -1 }, options: {} },
        { key: { entityType: 1, entityId: 1 }, options: {} },
        { key: { previousHash: 1 }, options: {} },
        { key: { currentHash: 1 }, options: {} },
        { key: { retentionUntil: 1 }, options: {} }
    ]);

    console.log('\n✅ All 25 collections created successfully!\n');
};

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

async function createCollection(db, collectionName, options) {
    try {
        await db.createCollection(collectionName, options);
        console.log(`  ✓ Created collection: ${collectionName}`);
    } catch (error) {
        if (error.codeName === 'NamespaceExists') {
            console.log(`  ○ Collection exists: ${collectionName} (skipped)`);
        } else {
            console.error(`  ✗ Error creating ${collectionName}:`, error.message);
        }
    }
}

async function createIndexes(db, collectionName, indexes) {
    try {
        const collection = db.collection(collectionName);
        for (const idx of indexes) {
            await collection.createIndex(idx.key, idx.options);
        }
        console.log(`    → Created ${indexes.length} index(es) for ${collectionName}`);
    } catch (error) {
        console.error(`    ✗ Error creating indexes for ${collectionName}:`, error.message);
    }
}

// ============================================================================
// MAIN EXECUTION
// ============================================================================

const main = async () => {
    console.log('╔════════════════════════════════════════════════════════════╗');
    console.log('║         SmartERP AI - Database Schema Setup               ║');
    console.log('║                   MongoDB Collections                      ║');
    console.log('╚════════════════════════════════════════════════════════════╝');

    const conn = await connectDB();
    const db = conn.connection.db;

    await createCollections(db);

    // Print summary
    console.log('╔════════════════════════════════════════════════════════════╗');
    console.log('║                    SCHEMA SUMMARY                          ║');
    console.log('╠════════════════════════════════════════════════════════════╣');
    console.log('║  USER & AUTH:        users, refreshtokens                  ║');
    console.log('║  PARTIES:            customers, suppliers                  ║');
    console.log('║  INVENTORY:          items, stockmovements                 ║');
    console.log('║  SALES:              invoices, salesorders,                ║');
    console.log('║                      deliverychallans, estimates           ║');
    console.log('║  PURCHASES:          bills                                 ║');
    console.log('║  RETURNS:            returns, purchasereturns              ║');
    console.log('║  EXPENSES:           expenses, expensecategories,          ║');
    console.log('║                      recurringexpenses                     ║');
    console.log('║  FINANCIAL:          transactions, paymentins,             ║');
    console.log('║                      dues, dueadjustments                  ║');
    console.log('║  BANKING:            bankaccounts, cashbanktransactions    ║');
    console.log('║  SYSTEM:             counters, notifications, auditlogs    ║');
    console.log('╚════════════════════════════════════════════════════════════╝');

    console.log('\n🎉 Database schema setup complete!\n');

    await mongoose.connection.close();
    console.log('Connection closed.');
};

main().catch(console.error);
