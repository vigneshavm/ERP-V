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

import type { Request, Response, NextFunction } from 'express';
import { AppError } from '@smarterp/shared/utils/AppError.js';

// ── Permission catalogue ──────────────────────────────────────────────────────
export type Permission =
    | 'delete:item'       | 'delete:customer'  | 'delete:supplier'
    | 'delete:expense'    | 'delete:invoice'   | 'delete:return'
    | 'delete:salesorder' | 'manage:users'     | 'approve:expense'
    | 'view:reports'      | 'manage:payroll'   | 'manage:settings';

// ── Role → permission map ─────────────────────────────────────────────────────
const ROLE_PERMISSIONS: Record<string, Set<Permission>> = {
    owner: new Set<Permission>([
        'delete:item', 'delete:customer', 'delete:supplier', 'delete:expense',
        'delete:invoice', 'delete:return', 'delete:salesorder', 'manage:users',
        'approve:expense', 'view:reports', 'manage:payroll', 'manage:settings',
    ]),
    admin: new Set<Permission>([
        'delete:item', 'delete:customer', 'delete:supplier', 'delete:expense',
        'delete:invoice', 'manage:users', 'approve:expense', 'view:reports',
        'manage:payroll',
    ]),
    manager: new Set<Permission>([
        'approve:expense', 'view:reports',
    ]),
    staff: new Set<Permission>([
        'view:reports',
    ]),
};

const getPermissions = (role: string): Set<Permission> =>
    ROLE_PERMISSIONS[role.toLowerCase()] ?? new Set();

/**
 * requirePermission — gate a route on a single permission.
 *
 *   router.delete('/:id', protect, requirePermission('delete:invoice'), handler)
 */
export const requirePermission = (permission: Permission) =>
    (req: Request, _res: Response, next: NextFunction): void => {
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
export const requireRole = (...roles: string[]) =>
    (req: Request, _res: Response, next: NextFunction): void => {
        const userRole = (req.user?.systemRole ?? req.user?.role ?? '').toLowerCase();
        if (roles.map((r) => r.toLowerCase()).includes(userRole)) {
            return next();
        }
        next(new AppError(`Role '${userRole}' is not authorized for this resource`, 403));
    };
