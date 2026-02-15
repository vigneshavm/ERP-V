import { Request, Response } from 'express';
import User from '../models/User.js';

export class AdminController {
    /**
     * @swagger
     * /api/admin/users:
     *   get:
     *     summary: Get all users across all tenants (Superadmin only)
     *     tags: [Admin]
     *     security:
     *       - bearerAuth: []
     *     responses:
     *       200:
     *         description: List of all users grouped by tenant
     *       401:
     *         description: Unauthorized
     *       403:
     *         description: Forbidden (Not a superadmin)
     */
    public getAllUsersAcrossTenants = async (req: Request, res: Response): Promise<void> => {
        try {
            // Fetch all users and populate tenant info
            const users = await User.find({})
                .populate('tenantId', 'name shopName slug')
                .select('-password')
                .lean();

            res.status(200).json(users);
        } catch (error) {
            res.status(500).json({
                message: 'Server Error',
                error: (error as Error).message
            });
        }
    };
}

export default new AdminController();
