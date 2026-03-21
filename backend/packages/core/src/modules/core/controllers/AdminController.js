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
    getAllUsersAcrossTenants = async (_req, res) => {
        // Fetch all users and populate tenant info
        const users = await User.find({})
            .populate('tenantId', 'name shopName slug')
            .select('-password')
            .lean();
        res.status(200).json(users);
    };
}
export default new AdminController();
