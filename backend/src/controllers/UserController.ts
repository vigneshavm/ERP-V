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
 * @desc Get all users
 * @route GET /api/users
 * @access Private
 */
export const getAllUsers = async (req: Request, res: Response): Promise<void> => {
    try {
        const users = await User.find().select('-password');
        res.status(200).json(users);
    } catch (error) {
        res.status(500).json({ message: 'Server Error', error: (error as Error).message });
    }
};

/**
 * @desc Update user profile
 * @route PUT /api/users/:id
 * @access Private
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
            const existingUser = await User.findOne({ email, _id: { $ne: id } });
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
 * @desc Delete user account
 * @route DELETE /api/users/:id
 * @access Private
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

export default {
    getAllUsers,
    updateUser,
    deleteUser,
};
