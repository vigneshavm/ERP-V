import { Request, Response } from 'express';

import User from '../models/User.js';
import BusinessProfile from '../models/BusinessProfile.js';
import { seedInventory } from '../services/inventorySeeder.js';

/**
 * Request interface with authenticated user
 */
interface AuthenticatedRequest extends Request {
    user?: {
        _id: string;
        [key: string]: any;
    };
    tenantId?: string; // Injected by Auth Middleware
}

/**
 * User update data interface
 */
interface UserUpdateData {
    name?: string;
    email?: string;
    phone?: string;
    shopName?: string;
    gstNumber?: string;
    shopAddress?: string;
    language?: 'en' | 'ta';
}

/**
 * @swagger
 * /api/users:
 *   get:
 *     summary: Get all users
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of all users
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/User'
 *       401:
 *         description: Unauthorized
 */
export const getAllUsers = async (_req: Request, res: Response): Promise<void> => {
    try {
        const req = _req as AuthenticatedRequest;
        const users = await User.find({ tenantId: req.tenantId }).select('-password');
        res.status(200).json(users);
    } catch (error) {
        res.status(500).json({ message: 'Server Error', error: (error as Error).message });
    }
};

/**
 * @swagger
 * /api/users/{id}:
 *   put:
 *     summary: Update user profile
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name: { type: string }
 *               email: { type: string }
 *               phone: { type: string }
 *               shopName: { type: string }
 *               gstNumber: { type: string }
 *               shopAddress: { type: string }
 *               businessCategory: { type: string }
 *               businessType: { type: string }
 *     responses:
 *       200:
 *         description: Profile updated successfully
 *       400:
 *         description: Invalid input or email in use
 *       403:
 *         description: Unauthorized to update this profile
 */
export const updateUser = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
        const { id } = req.params;
        const { name, email, phone, shopName, gstNumber, shopAddress, businessCategory, businessType, language } = req.body;

        // Validate that user is updating their own profile
        if (req.user?._id.toString() !== id) {
            res.status(403).json({ message: 'Unauthorized: Cannot update other users\' profiles' });
            return;
        }

        // Check if new email is already taken (if email is being changed)
        if (email) {
            const existingUser = await User.findOne({
                email,
                tenantId: req.tenantId,
                _id: { $ne: id }
            });
            if (existingUser) {
                res.status(400).json({ message: 'Email already in use' });
                return;
            }
        }

        // Update only allowed fields
        const updateData: UserUpdateData = {};
        if (name !== undefined) updateData.name = name;
        if (email !== undefined) updateData.email = email;
        if (phone !== undefined) updateData.phone = phone;
        if (shopName !== undefined) updateData.shopName = shopName;
        if (gstNumber !== undefined) updateData.gstNumber = gstNumber;
        if (shopAddress !== undefined) updateData.shopAddress = shopAddress;
        if (language !== undefined) updateData.language = language;

        const user = await User.findByIdAndUpdate(
            id,
            updateData,
            { new: true, runValidators: true }
        ).select('-password');

        if (!user) {
            res.status(404).json({ message: 'User not found' });
            return;
        }

        // --- Sync with BusinessProfile ---
        // If specific business fields are present, update BusinessProfile
        if (businessCategory !== undefined || shopName !== undefined || phone !== undefined || shopAddress !== undefined || email !== undefined || businessType !== undefined) {
            const businessUpdate: any = {};
            if (shopName !== undefined) businessUpdate.businessName = shopName;
            if (businessCategory !== undefined) businessUpdate.category = businessCategory;
            if (businessType !== undefined) businessUpdate.businessType = businessType;
            if (phone !== undefined) businessUpdate.phone = phone;
            if (shopAddress !== undefined) businessUpdate.address = shopAddress;
            if (email !== undefined) businessUpdate.email = email;

            // Ensure we have a BusinessProfile
            await BusinessProfile.findOneAndUpdate(
                { userId: user._id },
                { $set: businessUpdate },
                { new: true, upsert: true, setDefaultsOnInsert: true }
            );

            // Trigger Inventory Seeding if category is updated
            if (businessCategory) {
                await seedInventory(user._id.toString(), businessCategory);
            }
        }

        // Fetch the possibly updated or existing category to return it
        const businessProfile = await BusinessProfile.findOne({ userId: user._id });
        const currentCategory = businessProfile?.category || "";
        const currentType = businessProfile?.businessType || "";

        res.status(200).json({
            message: 'Profile updated successfully',
            user: {
                _id: user._id,
                name: user.name,
                email: user.email,
                shopName: user.shopName,
                gstNumber: user.gstNumber,
                shopAddress: user.shopAddress,
                phone: user.phone,
                businessCategory: currentCategory, // Return from BusinessProfile
                businessType: currentType,
                role: user.role,
            },
        });
    } catch (error) {
        res.status(500).json({ message: 'Server Error', error: (error as Error).message });
    }
};

/**
 * @swagger
 * /api/users/{id}:
 *   delete:
 *     summary: Delete user account
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: User account deleted successfully
 *       403:
 *         description: Unauthorized to delete this user
 *       404:
 *         description: User not found
 */
export const deleteUser = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
        const { id } = req.params;

        // Validate that user is deleting their own account
        if (req.user?._id.toString() !== id) {
            res.status(403).json({ message: 'Unauthorized: Cannot delete other users' });
            return;
        }

        const user = await User.findByIdAndDelete(id);

        if (!user) {
            res.status(404).json({ message: 'User not found' });
            return;
        }

        res.status(200).json({ message: 'User account deleted successfully' });
    } catch (error) {
        res.status(500).json({ message: 'Server Error', error: (error as Error).message });
    }
};

// Roles allowed to grant/restrict another user's individual discount ceiling. Mirrors
// backend/src/modules/sales/controllers/PosController.ts's DISCOUNT_APPROVER_ROLES.
const DISCOUNT_ADMIN_ROLES = ['owner', 'co-owner', 'manager'];

/**
 * @desc    Set (or clear) a specific tenant user's individual max-discount ceiling, which
 *          overrides the tenant-wide misConfig.maxDiscountPercent for that user at POS
 *          checkout (see PosController.createInvoice). Only an owner/co-owner/manager may
 *          set this for another user in their own tenant.
 * @route   PATCH /api/users/:id/discount-limit
 * @access  Private (owner/co-owner/manager)
 */
export const updateUserDiscountLimit = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
        const requesterRole = req.user?.role;
        if (!requesterRole || !DISCOUNT_ADMIN_ROLES.includes(requesterRole)) {
            res.status(403).json({ message: 'Only an owner, co-owner, or manager can set a discount limit.' });
            return;
        }

        const { id } = req.params;
        const { maxDiscountPercent } = req.body;

        let value: number | null = null;
        if (maxDiscountPercent !== null && maxDiscountPercent !== undefined && maxDiscountPercent !== '') {
            value = Number(maxDiscountPercent);
            if (Number.isNaN(value) || value < 0 || value > 100) {
                res.status(400).json({ message: 'maxDiscountPercent must be a number between 0 and 100 (or null to clear it).' });
                return;
            }
        }

        const user = await User.findOneAndUpdate(
            { _id: id, tenantId: req.tenantId },
            { maxDiscountPercent: value },
            { new: true }
        ).select('-password');

        if (!user) {
            res.status(404).json({ message: 'User not found' });
            return;
        }

        res.status(200).json({ message: 'Discount limit updated', user });
    } catch (error) {
        res.status(500).json({ message: 'Server Error', error: (error as Error).message });
    }
};

export default {
    getAllUsers,
    updateUser,
    deleteUser,
    updateUserDiscountLimit,
};
