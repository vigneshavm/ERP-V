import 'reflect-metadata';
import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';
import Item from '../src/modules/inventory/models/Item';

describe('Inventory Variation Support', () => {
    let mongoServer;

    beforeAll(async () => {
        mongoServer = await MongoMemoryServer.create();
        const uri = mongoServer.getUri();
        await mongoose.connect(uri);
    });

    afterAll(async () => {
        await mongoose.disconnect();
        await mongoServer.stop();
    });

    it('should create a parent product correctly', async () => {
        const parent = await Item.create({
            name: 'Men T-Shirt',
            sku: 'TSHIRT-PARENT',
            isParent: true,
            model: 'Basic-TS',
            gender: 'Men',
            costPrice: 500,
            sellingPrice: 1000,
            tenantId: new mongoose.Types.ObjectId(),
            addedBy: 'user-123'
        });

        expect(parent.name).toBe('Men T-Shirt');
        expect(parent.isParent).toBe(true);
        expect(parent.model).toBe('Basic-TS');
        expect(parent.sku).toBe('TSHIRT-PARENT');
    });

    it('should create variation products linked to a parent', async () => {
        const tenantId = new mongoose.Types.ObjectId();
        const parent = await Item.create({
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

        const variation1 = await Item.create({
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

        const variation2 = await Item.create({
            name: 'Men T-Shirt - Red - L',
            sku: 'TSHIRT-R-L',
            parentId: parent._id,
            isParent: false,
            color: 'Red',
            size: 'L',
            costPrice: 500,
            sellingPrice: 1000,
            tenantId,
            addedBy: 'user-123'
        });

        expect(variation1.parentId.toString()).toBe(parent._id.toString());
        expect(variation1.color).toBe('Blue');
        expect(variation1.size).toBe('M');
        expect(variation2.parentId.toString()).toBe(parent._id.toString());

        const variations = await Item.find({ parentId: parent._id });
        expect(variations).toHaveLength(2);
    });
});
