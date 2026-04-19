import { connectDB, disconnectDB } from './db.js';
import mongoose from 'mongoose';

const fixInvoiceIndex = async () => {
    await connectDB();
    try {
        const db = mongoose.connection.db;
        if (!db) throw new Error('Database connection not established');
        
        const invoicesCollection = db.collection('invoices');

        // Drop the old unique index on invoiceNo
        try {
            await invoicesCollection.dropIndex('invoiceNo_1');
            console.log('✓ Dropped old invoiceNo_1 index');
        } catch (error) {
            console.log('Old index not found or already dropped');
        }

        // Create new compound unique index
        await invoicesCollection.createIndex(
            { invoiceNo: 1, createdBy: 1 },
            { unique: true }
        );
        console.log('✓ Created new compound index: invoiceNo + createdBy');

        console.log('\n✅ Database indexes fixed successfully!');
    } catch (error: any) {
        console.error('❌ Error fixing indexes:', error.message);
    } finally {
        await disconnectDB();
    }
};

fixInvoiceIndex();
