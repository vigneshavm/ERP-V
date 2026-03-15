import 'reflect-metadata';
import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';
import Item from '../src/modules/inventory/models/Item.js';

async function verify() {
    console.log('--- Starting Variation Schema Verification ---');
    
    try {
        const tenantId = new mongoose.Types.ObjectId();
        
        console.log('1. Validating Parent Product Schema...');
        const parent = new Item({
            name: 'Men T-Shirt',
            sku: 'TSHIRT-PARENT',
            isParent: true,
            model: 'Basic-TS',
            gender: 'Men',
            costPrice: 500,
            sellingPrice: 1000,
            tenantId,
            addedBy: 'user-123'
        });

        // Validate
        const parentError = parent.validateSync();
        if (parentError) {
            console.error('❌ Parent Schema Validation Failed:', parentError.message);
        } else {
            console.log('✅ Parent Schema Validated:', parent.name);
            console.log('   - isParent:', parent.isParent);
            console.log('   - model:', parent.model);
        }

        console.log('2. Validating Variation Product Schema...');
        const variation = new Item({
            name: 'Men T-Shirt - Blue - M',
            sku: 'TSHIRT-B-M',
            parentId: parent._id,
            isParent: false,
            color: 'Blue',
            size: 'M',
            costPrice: 500,
            sellingPrice: 1000,
            tenantId,
            addedBy: 'user-123'
        });

        const varError = variation.validateSync();
        if (varError) {
            console.error('❌ Variation Schema Validation Failed:', varError.message);
        } else {
            console.log('✅ Variation Schema Validated:', variation.name);
            console.log('   - parentId:', variation.parentId);
            console.log('   - color:', variation.color);
            console.log('   - size:', variation.size);
        }

        if (!parentError && !varError && variation.parentId.toString() === parent._id.toString()) {
            console.log('✅ SUCCESS: Variation schema and linking verified!');
        }

    } catch (error) {
        console.error('❌ ERROR during verification:', error);
    } finally {
        console.log('--- Verification Finished ---');
    }
}

verify();
