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
export const getAllUsers = async (req: Request, res: Response): Promise<void> => {
    try {
        const authReq = req as AuthenticatedRequest;
        const { page = 1, limit = 10 } = req.query;
        const skip = (Number(page) - 1) * Number(limit);

        const filter: any = { 
            tenantId: authReq.tenantId,
            isDeleted: { $ne: true } 
        };

        const [users, total] = await Promise.all([
            User.find(filter)
                .select('-password')
                .skip(skip)
                .limit(Number(limit))
                .lean(),
            User.countDocuments(filter)
        ]);

        res.status(200).json({
            users,
            pagination: {
                total,
                page: Number(page),
                limit: Number(limit),
                pages: Math.ceil(total / Number(limit))
            }
        });
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
        const { name, email, phone, shopName, gstNumber, shopAddress, businessCategory, businessType } = req.body;

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

        const user = await User.findByIdAndUpdate(id, {
            isDeleted: true,
            deletedAt: new Date()
        });

        if (!user) {
            res.status(404).json({ message: 'User not found' });
            return;
        }

        res.status(200).json({ message: 'User account deleted successfully' });
    } catch (error) {
        res.status(500).json({ message: 'Server Error', error: (error as Error).message });
    }
};

/**
 * @desc Update personal finance settings (e.g. month start day)
 * @route POST /api/users/finance-settings
 */
export const updateFinanceSettings = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
        const { monthStartDay } = req.body;
        
        if (monthStartDay < 1 || monthStartDay > 31) {
            res.status(400).json({ message: 'Invalid month start day' });
            return;
        }

        const user = await User.findByIdAndUpdate(
            req.user?._id,
            { $set: { 'personalFinanceSettings.monthStartDay': monthStartDay } },
            { new: true }
        ).select('-password');

        if (!user) {
            res.status(404).json({ message: 'User not found' });
            return;
        }

        res.status(200).json({
            message: 'Finance settings updated successfully',
            personalFinanceSettings: user.personalFinanceSettings
        });
    } catch (error) {
        res.status(500).json({ message: 'Server Error', error: (error as Error).message });
    }
};

export default {
    getAllUsers,
    updateUser,
    deleteUser,
};
