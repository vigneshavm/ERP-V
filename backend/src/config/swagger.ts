import swaggerJsdoc from 'swagger-jsdoc';

const options: swaggerJsdoc.Options = {
    definition: {
        openapi: '3.0.0',
        info: {
            title: 'SmartERPAI API',
            version: '2.0.0',
            description: 'API documentation for SmartERPAI backend',
            contact: {
                name: 'SmartERPAI Team',
            },
        },
        servers: [
            {
                url: 'http://localhost:5000',
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
            },
        },
        security: [
            {
                bearerAuth: [],
            },
        ],
    },
    apis: ['./src/routes/*.ts', './src/controllers/*.ts'], // Path to the API docs
};

const swaggerSpec = swaggerJsdoc(options);

export default swaggerSpec;
