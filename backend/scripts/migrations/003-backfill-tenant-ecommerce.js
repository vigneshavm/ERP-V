import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

// Configure dotenv
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.join(__dirname, '../../.env') });

const migrate = async () => {
    try {
        const mongoUri = process.env.MONGO_URI;
        if (!mongoUri) {
            throw new Error('MONGO_URI is not defined in .env');
        }

        console.log('Connecting to MongoDB...');
        await mongoose.connect(mongoUri);
        console.log('Connected to MongoDB.');

        const db = mongoose.connection.db;
        const tenantCollection = db.collection('tenants');
        const planCollection = db.collection('subscriptionplans');

        console.log('Fetching "FREE" plan...');
        const freePlan = await planCollection.findOne({ code: 'FREE' });
        if (!freePlan) {
            throw new Error('FREE SubscriptionPlan not found. Please run seeding first: node backend/scripts/seed-subscription-plans.js');
        }

        console.log(`Found FREE plan ID: ${freePlan._id}`);
        console.log('Starting migration to backfill ecommerce and subscriptionPlan fields...');

        // Update all tenants to point to the FREE plan ID
        const result = await tenantCollection.updateMany(
            {}, // Update all for consistency in this transition
            {
                $set: {
                    ecommerce: {
                        enabled: false,
                        settings: {}
                    },
                    subscriptionPlan: freePlan._id
                }
            }
        );

        console.log('Migration Result:', result);
        console.log(`Matched ${result.matchedCount} documents.`);
        console.log(`Modified ${result.modifiedCount} documents.`);

        console.log('Migration completed successfully.');
    } catch (error) {
        console.error('Migration failed:', error);
    } finally {
        try {
            await mongoose.disconnect();
            console.log('Disconnected from MongoDB.');
        } catch (e) {
            console.error('Error disconnecting:', e);
        }
    }
};

migrate();
