import swaggerJsdoc from 'swagger-jsdoc';
import path from 'path';
import { fileURLToPath } from 'url';
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
export const getSwaggerSpec = ({ title, version = '2.0.0', description = 'API documentation for SmartERPAI backend', port, modules }) => {
    // backend/packages/shared/src/config/swagger.ts
    // backendRoot is 4 levels up from this file
    const backendRoot = path.resolve(__dirname, '../../../../').replace(/\\/g, '/');
    console.log(`[Swagger] Building spec for: ${title}`);
    console.log(`[Swagger] Backend Root: ${backendRoot}`);
    const apiPaths = modules.flatMap(module => [
        `${backendRoot}/packages/core/src/modules/${module}/routes/*.ts`,
        `${backendRoot}/packages/core/src/modules/${module}/controllers/*.ts`
    ]);
    // Also include the calling app's own routes if they exist
    const appRoot = process.cwd().replace(/\\/g, '/');
    apiPaths.push(`${appRoot}/src/routes/*.ts`);
    apiPaths.push(`${appRoot}/src/controllers/*.ts`);
    console.log(`[Swagger] Final scan paths (forward slashes):`);
    apiPaths.forEach(p => console.log(` - ${p}`));
    const options = {
        definition: {
            openapi: '3.0.0',
            info: {
                title,
                version,
                description,
                contact: {
                    name: 'SmartERPAI Team',
                },
            },
            servers: [
                {
                    url: `http://localhost:${port}`,
                    description: 'Development server',
                },
            ],
            components: {
                securitySchemes: {
                    bearerAuth: {
                        type: 'http',
                        scheme: 'bearer',
                        bearerFormat: 'JWT',
                    },
                },
                schemas: {
                    Customer: {
                        type: 'object',
                        required: ['name', 'phone'],
                        properties: {
                            _id: { type: 'string' },
                            name: { type: 'string' },
                            phone: { type: 'string' },
                            email: { type: 'string' },
                            address: { type: 'string' },
                            dues: { type: 'number' },
                            points: { type: 'number' },
                            tier: { type: 'string' },
                            referredBy: { $ref: '#/components/schemas/Customer' },
                            purchaseCount: { type: 'number' },
                            totalPurchases: { type: 'number' },
                            lastPurchase: { type: 'string', format: 'date-time' },
                            createdAt: { type: 'string', format: 'date-time' },
                            updatedAt: { type: 'string', format: 'date-time' },
                        },
                    },
                    Transaction: {
                        type: 'object',
                        properties: {
                            _id: { type: 'string' },
                            type: { type: 'string', enum: ['sale', 'due', 'payment', 'purchase', 'refund', 'return', 'due_adjustment'] },
                            amount: { type: 'number' },
                            paymentMethod: { type: 'string' },
                            description: { type: 'string' },
                            createdAt: { type: 'string', format: 'date-time' },
                        },
                    },
                    LoyaltyTransaction: {
                        type: 'object',
                        properties: {
                            _id: { type: 'string' },
                            customer: { type: 'string' },
                            type: { type: 'string', enum: ['EARNED', 'REDEEMED', 'EXPIRED', 'BONUS'] },
                            points: { type: 'number' },
                            description: { type: 'string' },
                            createdAt: { type: 'string', format: 'date-time' },
                        },
                    },
                    User: {
                        type: 'object',
                        properties: {
                            _id: { type: 'string' },
                            name: { type: 'string' },
                            email: { type: 'string' },
                            phone: { type: 'string' },
                            role: { type: 'string', enum: ['owner', 'admin', 'staff'] },
                            status: { type: 'string', enum: ['active', 'suspended', 'locked'] },
                            shopName: { type: 'string' },
                        },
                    },
                    AuthResponse: {
                        type: 'object',
                        properties: {
                            _id: { type: 'string' },
                            name: { type: 'string' },
                            email: { type: 'string' },
                            token: { type: 'string' },
                            refreshToken: { type: 'string' },
                        },
                    },
                    Item: {
                        type: 'object',
                        properties: {
                            _id: { type: 'string' },
                            name: { type: 'string' },
                            sku: { type: 'string' },
                            category: { type: 'string' },
                            price: { type: 'number' },
                            stockQty: { type: 'number' },
                            unit: { type: 'string' },
                            lowStockLimit: { type: 'number' },
                            description: { type: 'string' },
                            addedBy: { type: 'string' },
                        },
                    },
                    Invoice: {
                        type: 'object',
                        properties: {
                            _id: { type: 'string' },
                            invoiceNumber: { type: 'string' },
                            customer: { type: 'string' },
                            items: {
                                type: 'array',
                                items: {
                                    type: 'object',
                                    properties: {
                                        item: { type: 'string' },
                                        name: { type: 'string' },
                                        quantity: { type: 'number' },
                                        price: { type: 'number' },
                                        total: { type: 'number' },
                                    },
                                },
                            },
                            totalAmount: { type: 'number' },
                            paidAmount: { type: 'number' },
                            paymentStatus: { type: 'string', enum: ['Paid', 'Unpaid', 'Partial'] },
                            paymentMethod: { type: 'string' },
                            dueDate: { type: 'string', format: 'date' },
                            createdAt: { type: 'string', format: 'date-time' },
                        },
                    },
                    Bill: {
                        type: 'object',
                        properties: {
                            _id: { type: 'string' },
                            billNo: { type: 'string' },
                            supplier: { type: 'string' },
                            amount: { type: 'number' },
                            status: { type: 'string' },
                            paymentStatus: { type: 'string' },
                            date: { type: 'string', format: 'date' },
                        },
                    },
                    BankAccount: {
                        type: 'object',
                        properties: {
                            _id: { type: 'string' },
                            bankName: { type: 'string' },
                            accountNumber: { type: 'string' },
                            accountHolderName: { type: 'string' },
                            currentBalance: { type: 'number' },
                            isActive: { type: 'boolean' },
                        },
                    },
                    Supplier: {
                        type: 'object',
                        properties: {
                            _id: { type: 'string' },
                            name: { type: 'string' },
                            businessName: { type: 'string' },
                            phone: { type: 'string' },
                            email: { type: 'string' },
                            address: { type: 'string' },
                            dues: { type: 'number' },
                        },
                    },
                },
            },
            security: [
                {
                    bearerAuth: [],
                },
            ],
        },
        apis: apiPaths,
    };
    return swaggerJsdoc(options);
};
export default getSwaggerSpec;
