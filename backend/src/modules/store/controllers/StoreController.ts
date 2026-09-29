import { Response } from 'express';
import mongoose from 'mongoose';
import Store from '../models/Store.js';
import Branch from '../../core/models/Branch.js';
import Item from '../../inventory/models/Item.js';
import { error } from '../../../config/logger.js';
import { AuthenticatedRequest } from '../../../middlewares/authMiddleware.js';

export const createStore = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
        const { tenantId } = req;
        const { name, address, city, gstin, counters } = req.body;

        if (!tenantId) {
            res.status(401).json({ message: 'Tenant context missing. Please ensure you are logged in correctly.' });
            return;
        }

        if (!name) {
            res.status(400).json({ message: 'Store name is required' });
            return;
        }

        const newStore = await Store.create({
            tenantId,
            name,
            address,
            city,
            gstin,
            counters: counters || [],
            isActive: true
        });

        // Also sync to Branch collection
        try {
            const existingBranch = await Branch.findOne({ tenantId, name });
            if (!existingBranch) {
                await Branch.create({
                    tenantId,
                    name,
                    address,
                    isMain: false
                });
            }
        } catch (e) {
            // Ignore branch creation error
        }

        res.status(201).json(newStore);
    } catch (err) {
        const errorMsg = (err as Error).message;
        error(`Create store failed: ${errorMsg}`, { stack: (err as Error).stack, body: req.body });
        res.status(500).json({ 
            message: 'Internal Server Error while creating store', 
            error: process.env.NODE_ENV === 'development' ? errorMsg : undefined 
        });
    }
};

export const getStores = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
        const { tenantId } = req;
        const stores = await Store.find({ tenantId });
        res.status(200).json(stores);
    } catch (err) {
        error(`Get stores failed: ${(err as Error).message}`);
        res.status(500).json({ message: 'Server Error', error: (err as Error).message });
    }
};

export const updateStore = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
        const { tenantId } = req;
        const { id } = req.params;

        if (!mongoose.Types.ObjectId.isValid(id as string)) {
            res.status(400).json({ message: 'Invalid store ID format' });
            return;
        }

        // Only the store's own editable fields -- `$set: req.body` also let a request overwrite
        // tenantId, isActive, managerUserId or anything else on the document.
        const update: Record<string, unknown> = {};
        for (const key of ['name', 'address', 'city', 'gstin'] as const) {
            if (typeof req.body?.[key] === 'string') update[key] = req.body[key];
        }
        if (req.body?.counters !== undefined) {
            if (!Array.isArray(req.body.counters)) {
                res.status(400).json({ message: 'counters must be a list' });
                return;
            }
            const seen = new Set<string>();
            const counters = [];
            for (const c of req.body.counters) {
                const cid = String(c?.id ?? '').trim().toUpperCase();
                const cname = String(c?.name ?? '').trim();
                if (!cid || !cname) {
                    res.status(400).json({ message: 'Every counter needs a code and a name' });
                    return;
                }
                if (seen.has(cid)) {
                    res.status(400).json({ message: `Counter code ${cid} is used twice` });
                    return;
                }
                seen.add(cid);
                counters.push({ id: cid.slice(0, 20), name: cname.slice(0, 60), lastBillNumber: String(c?.lastBillNumber ?? '0') });
            }
            update.counters = counters;
        }

        const updatedStore = await Store.findOneAndUpdate(
            { _id: id, tenantId },
            { $set: update },
            { new: true }
        );

        if (!updatedStore) {
            res.status(404).json({ message: 'Store not found' });
            return;
        }

        res.status(200).json(updatedStore);
    } catch (err) {
        error(`Update store failed: ${(err as Error).message}`);
        res.status(500).json({ message: 'Server Error', error: (err as Error).message });
    }
};

export const transferStock = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
        const { tenantId } = req;
        const { id: sourceStoreId } = req.params; // Using the store in URL as source
        const { targetStoreId, itemId, quantity } = req.body;

        if (!mongoose.Types.ObjectId.isValid(sourceStoreId as string) || !mongoose.Types.ObjectId.isValid(targetStoreId as string)) {
            res.status(400).json({ message: 'Invalid store ID format' });
            return;
        }

        if (!quantity || quantity <= 0) {
            res.status(400).json({ message: 'Invalid quantity' });
            return;
        }

        const item = await Item.findOne({ _id: itemId, tenantId });
        if (!item) {
            res.status(404).json({ message: 'Item not found' });
            return;
        }

        const sourceLevel = item.storeLevels.find((s: any) => s.storeId?.toString() === sourceStoreId);
        if (!sourceLevel || sourceLevel.qty < quantity) {
            res.status(400).json({ message: 'Insufficient stock in source store' });
            return;
        }

        let targetLevel = item.storeLevels.find((s: any) => s.storeId?.toString() === targetStoreId);
        if (!targetLevel) {
            item.storeLevels.push({ storeId: targetStoreId, qty: 0, reservedQty: 0 } as any);
            targetLevel = item.storeLevels.find((s: any) => s.storeId?.toString() === targetStoreId);
        }

        if (sourceLevel && targetLevel) {
            sourceLevel.qty -= quantity;
            targetLevel.qty += quantity;
        }

        await item.save();

        res.status(200).json({ message: 'Stock transferred successfully', item });
    } catch (err) {
        error(`Transfer stock failed: ${(err as Error).message}`);
        res.status(500).json({ message: 'Server Error', error: (err as Error).message });
    }
};

export default {
    createStore,
    getStores,
    updateStore,
    transferStock
};
