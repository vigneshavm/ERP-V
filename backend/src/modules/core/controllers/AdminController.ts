import { Request, Response } from 'express';
import mongoose from 'mongoose';
import User from '../models/User.js';
import Tenant from '../models/Tenant.js';

export class AdminController {
    /**
     * GET /api/admin/session: confirms the caller is a platform administrator. Reached only through
     * protect + authorize('superadmin') (adminRoutes), so a 200 is the server's own confirmation; the System
     * Core console signs in with this instead of any client-side secret.
     */
    public getSession = async (req: Request, res: Response): Promise<void> => {
        const user = (req as unknown as { user?: { _id: unknown; name?: string; email?: string; role?: string } }).user;
        if (!user) {
            res.status(401).json({ message: 'Not authorized' });
            return;
        }
        res.status(200).json({ id: String(user._id), name: user.name ?? '', email: user.email ?? '', role: user.role });
    };

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
    public getAllUsersAcrossTenants = async (_req: Request, res: Response): Promise<void> => {
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
    /**
     * GET /api/admin/tenants: every tenant on the platform with its real status and user count (superadmin only).
     */
    public getTenants = async (_req: Request, res: Response): Promise<void> => {
        try {
            const [tenants, counts] = await Promise.all([
                Tenant.find({}, { name: 1, shopName: 1, slug: 1, status: 1, businessType: 1, sector: 1, createdAt: 1, subscriptionEndDate: 1 }).sort({ createdAt: -1 }).lean(),
                User.aggregate<{ _id: unknown; users: number }>([{ $group: { _id: '$tenantId', users: { $sum: 1 } } }]),
            ]);
            const users = new Map(counts.map((c) => [String(c._id), c.users]));
            res.status(200).json(tenants.map((t) => {
                const doc = t as unknown as { _id: unknown; name?: string; shopName?: string; slug?: string; status?: string; businessType?: string; sector?: string; createdAt?: Date; subscriptionEndDate?: Date };
                return {
                    id: String(doc._id),
                    name: doc.shopName || doc.name || '',
                    slug: doc.slug ?? '',
                    status: doc.status ?? 'ACTIVE',
                    businessType: doc.businessType ?? '',
                    sector: doc.sector ?? '',
                    createdAt: doc.createdAt ?? null,
                    subscriptionEndDate: doc.subscriptionEndDate ?? null,
                    users: users.get(String(doc._id)) ?? 0,
                };
            }));
        } catch (err) {
            res.status(500).json({ message: 'Unable to load tenants', error: (err as Error).message });
        }
    };

    /**
     * PATCH /api/admin/tenants/:id/status  { status: 'ACTIVE' | 'SUSPENDED' } (superadmin only). The console updates
     * its list only after this succeeds.
     */
    public updateTenantStatus = async (req: Request, res: Response): Promise<void> => {
        const id = String(req.params.id ?? '');
        const status = (req.body as { status?: unknown })?.status;
        if (!mongoose.Types.ObjectId.isValid(id)) {
            res.status(400).json({ message: 'Invalid tenant id' });
            return;
        }
        if (status !== 'ACTIVE' && status !== 'SUSPENDED') {
            res.status(400).json({ message: "status must be 'ACTIVE' or 'SUSPENDED'" });
            return;
        }
        try {
            const tenant = await Tenant.findByIdAndUpdate(id, { $set: { status } }, { new: true, runValidators: true, projection: { name: 1, shopName: 1, status: 1 } }).lean();
            if (!tenant) {
                res.status(404).json({ message: 'Tenant not found' });
                return;
            }
            const doc = tenant as unknown as { _id: unknown; name?: string; shopName?: string; status?: string };
            res.status(200).json({ id: String(doc._id), name: doc.shopName || doc.name || '', status: doc.status });
        } catch (err) {
            res.status(500).json({ message: 'Unable to update tenant status', error: (err as Error).message });
        }
    };
}

export default new AdminController();
