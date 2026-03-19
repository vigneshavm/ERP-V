import { Request, Response } from 'express';
import mongoose from 'mongoose';
import User from '../models/User.js';
import BusinessProfile from '../models/BusinessProfile.js';
import Tenant from '../models/Tenant.js';
import { seedInventory } from '../services/inventorySeeder.js';
import { asyncHandler } from '@smarterp/shared/utils/asyncHandler.js';
import { ok, created, paginated } from '@smarterp/shared/utils/response.js';

interface UserUpdateData {
    name?:        string;
    email?:       string;
    phone?:       string;
    shopName?:    string;
    gstNumber?:   string;
    shopAddress?: string;
}

/** GET /api/v1/users — list users for the authenticated tenant. */
export const getAllUsers = asyncHandler(async (req: AuthenticatedRequest, res: Response): Promise<void> =>{
    const { page = 1, limit = 10 } = req.query;
    const skip = (Number(page) - 1) * Number(limit);

    const filter = { tenantId: req.tenantId, isDeleted: { $ne: true } };

    const [users, total] = await Promise.all([
        User.find(filter).select('-password').skip(skip).limit(Number(limit)).lean(),
        User.countDocuments(filter),
    ]);

    res.status(200).json({
        users,
        pagination: {
            total,
            page:  Number(page),
            limit: Number(limit),
            pages: Math.ceil(total / Number(limit)),
        },
    });

/**
 * PUT /api/v1/users/:id — update user credentials and optionally sync BusinessProfile.
 *
 * The BusinessProfile sync is wrapped in the same session as the User update
 * so a failure in either write does not leave data partially applied.
 * seedInventory is called only after both writes commit.
 */
export const updateUser = asyncHandler(async (req: AuthenticatedRequest, res: Response): Promise<void> =>{
    const { id } = req.params;

    // Assert — do not use optional chaining here. protect guarantees user is set;
    // if it were missing, the check would silently pass (undefined !== id === true).
    const requestingUserId = req.user!._id.toString();
    if (requestingUserId !== id) {
        res.status(403).json({ message: "Unauthorized: Cannot update other users' profiles" });
        return;
    }

    const {
        name, email, phone, shopName, gstNumber, shopAddress,
        businessCategory, businessType,
    } = req.body;

    if (email) {
        const conflict = await User.exists({ email, tenantId: req.tenantId, _id: { $ne: id } });
        if (conflict) {
            res.status(400).json({ message: 'Email already in use' });
            return;
        }
    }

    const userUpdate: UserUpdateData = {};
    if (name        !== undefined) userUpdate.name        = name;
    if (email       !== undefined) userUpdate.email       = email;
    if (phone       !== undefined) userUpdate.phone       = phone;
    if (shopName    !== undefined) userUpdate.shopName    = shopName;
    if (gstNumber   !== undefined) userUpdate.gstNumber   = gstNumber;
    if (shopAddress !== undefined) userUpdate.shopAddress = shopAddress;

    const needsBusinessSync =
        businessCategory !== undefined || shopName      !== undefined ||
        phone            !== undefined || shopAddress   !== undefined ||
        email            !== undefined || businessType  !== undefined;

    // Wrap User + BusinessProfile writes in a transaction so neither can
    // partially apply if the other fails.
    let user: any;
    let businessProfile: any;

    const session = await mongoose.startSession();
    await session.withTransaction(async () => {
        user = await User.findByIdAndUpdate(id, userUpdate, {
            new: true, runValidators: true, session,
        }).select('-password');

        if (!user) throw Object.assign(new Error('User not found'), { statusCode: 404 });

        if (needsBusinessSync) {
            const businessUpdate: Record<string, unknown> = {};
            if (shopName          !== undefined) businessUpdate.businessName = shopName;
            if (businessCategory  !== undefined) businessUpdate.category     = businessCategory;
            if (businessType      !== undefined) businessUpdate.businessType  = businessType;
            if (phone             !== undefined) businessUpdate.phone         = phone;
            if (shopAddress       !== undefined) businessUpdate.address       = shopAddress;
            if (email             !== undefined) businessUpdate.email         = email;

            businessProfile = await BusinessProfile.findOneAndUpdate(
                { userId: user._id },
                { $set: businessUpdate },
                { new: true, upsert: true, setDefaultsOnInsert: true, session },
            );
        }
    });

/**
 * DELETE /api/v1/users/:id — soft-delete the authenticated user's account.
 * Guards against deleting the tenant owner (would orphan the tenant).
 */
export const deleteUser = asyncHandler(async (req: AuthenticatedRequest, res: Response): Promise<void> =>{
    const { id } = req.params;

    // Assert — see comment in updateUser
    if (req.user!._id.toString() !== id) {
        res.status(403).json({ message: 'Unauthorized: Cannot delete other users' });
        return;
    }

    // Prevent orphaning the tenant if the owner deletes themselves
    const ownerOfTenant = await Tenant.exists({ ownerId: id, status: 'ACTIVE' });
    if (ownerOfTenant) {
        res.status(409).json({
            message: 'Cannot delete the tenant owner account. Transfer ownership first.',
        });
        return;
    }

    const user = await User.findByIdAndUpdate(id, { isDeleted: true, deletedAt: new Date() });
    if (!user) {
        res.status(404).json({ message: 'User not found' });
        return;
    }

    res.status(200).json({ message: 'User account deleted successfully' });

/**
 * POST /api/v1/users/finance-settings
 * Update the personal finance month-start day for the authenticated user.
 */
export const updateFinanceSettings = asyncHandler(async (req: AuthenticatedRequest, res: Response): Promise<void> =>{
    const { monthStartDay } = req.body;

    // Explicit type check — coercion allows strings to slip past numeric comparisons
    const day = Number(monthStartDay);
    if (!Number.isInteger(day) || day < 1 || day > 31) {
        res.status(400).json({ message: 'monthStartDay must be an integer between 1 and 31' });
        return;
    }

    const user = await User.findByIdAndUpdate(
        req.user!._id,
        { $set: { 'personalFinanceSettings.monthStartDay': day } },
        { new: true },
    ).select('-password');

    if (!user) {
        res.status(404).json({ message: 'User not found' });
        return;
    }

    res.status(200).json({
        message: 'Finance settings updated successfully',
        personalFinanceSettings: user.personalFinanceSettings,
    });

export default { getAllUsers, updateUser, deleteUser };
