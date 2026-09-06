import { Request, Response, NextFunction } from "express";
import { AppError } from "../utils/AppError.js";

type Permission = "delete:item" | "delete:customer" | "delete:supplier" | "delete:expense" | "delete:invoice" | "delete:return" | "delete:salesorder" | "manage:users";

// Was previously a deny-all-non-owner stub (only user.role === 'owner' ever passed, regardless
// of which permission was requested) -- every co-owner, manager, admin, and staff account was
// silently denied every one of these actions. Replaced with the same owner/co-owner/manager
// tier already established elsewhere in this codebase for comparably-sensitive actions
// (PosController's DISCOUNT_APPROVER_ROLES/INVOICE_EDIT_ROLES, CommissionController's
// COMMISSION_ADMIN_ROLES, UserController's DISCOUNT_ADMIN_ROLES) for the "delete:*" permissions.
// "manage:users" (creating users / changing roles) is kept narrower -- owner/co-owner only --
// since it can grant someone else these same permissions.
const PERMISSION_ROLES: Record<Permission, string[]> = {
    'delete:item': ['owner', 'co-owner', 'manager'],
    'delete:customer': ['owner', 'co-owner', 'manager'],
    'delete:supplier': ['owner', 'co-owner', 'manager'],
    'delete:expense': ['owner', 'co-owner', 'manager'],
    'delete:invoice': ['owner', 'co-owner', 'manager'],
    'delete:return': ['owner', 'co-owner', 'manager'],
    'delete:salesorder': ['owner', 'co-owner', 'manager'],
    'manage:users': ['owner', 'co-owner'],
};

export const requirePermission = (permission: Permission) => {
    return (req: Request, _res: Response, next: NextFunction) => {
        const user = (req as any).user;
        const allowedRoles = PERMISSION_ROLES[permission] || [];

        if (user && allowedRoles.includes(user.role)) {
            return next();
        }

        next(new AppError("You do not have permission to perform this action", 403));
    };
};
