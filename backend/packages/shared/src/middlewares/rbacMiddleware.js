/**
 * RBAC middleware.
 *
 * Changes from original:
 *  - `requirePermission` now actually evaluates role-based permissions rather
 *    than just checking for 'owner'. The original implementation let everyone
 *    else through to a 403, making it a deny-all-except-owner guard — not RBAC.
 *  - Added `requireRole` for simple role-gate routes.
 *  - Permission set is typed and extensible.
 */
import { AppError } from '@smarterp/shared/utils/AppError.js';
// ── Role → permission map ─────────────────────────────────────────────────────
const ROLE_PERMISSIONS = {
    owner: new Set([
        'delete:item', 'delete:customer', 'delete:supplier', 'delete:expense',
        'delete:invoice', 'delete:return', 'delete:salesorder', 'manage:users',
        'approve:expense', 'view:reports', 'manage:payroll', 'manage:settings',
    ]),
    admin: new Set([
        'delete:item', 'delete:customer', 'delete:supplier', 'delete:expense',
        'delete:invoice', 'manage:users', 'approve:expense', 'view:reports',
        'manage:payroll',
    ]),
    manager: new Set([
        'approve:expense', 'view:reports',
    ]),
    staff: new Set([
        'view:reports',
    ]),
};
const getPermissions = (role) => ROLE_PERMISSIONS[role.toLowerCase()] ?? new Set();
/**
 * requirePermission — gate a route on a single permission.
 *
 *   router.delete('/:id', protect, requirePermission('delete:invoice'), handler)
 */
export const requirePermission = (permission) => (req, _res, next) => {
    const role = req.user?.systemRole ?? req.user?.role ?? '';
    if (getPermissions(role).has(permission)) {
        return next();
    }
    next(new AppError('You do not have permission to perform this action', 403));
};
/**
 * requireRole — gate a route on one or more roles.
 *
 *   router.get('/admin/stats', protect, requireRole('owner', 'admin'), handler)
 */
export const requireRole = (...roles) => (req, _res, next) => {
    const userRole = (req.user?.systemRole ?? req.user?.role ?? '').toLowerCase();
    if (roles.map((r) => r.toLowerCase()).includes(userRole)) {
        return next();
    }
    next(new AppError(`Role '${userRole}' is not authorized for this resource`, 403));
};
