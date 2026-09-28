import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import User from "../modules/core/models/User.js";
import * as deviceUtils from "../utils/deviceUtils.js";
import { warn } from "../config/logger.js";
import { AppError } from "../utils/AppError.js";
import { IUser } from "../interfaces/IUser.js";
import { Types } from "mongoose";

/**
 * Properly-typed authenticated request with guaranteed tenantId and user
 * Controllers should cast to this after the protect middleware
 */
declare global {
    namespace Express {
        interface Request {
            /** Set by `protect`. Typed as always present so handlers behind `protect` can use it directly;
             *  routes without `protect` must not read it. */
            user: IUser;
        }
    }
}

export interface AuthenticatedRequest extends Request {
    user: IUser;
    tenantId: Types.ObjectId;
}

/**
 * Middleware to protect routes
 * Validates both JWT token AND deviceId cookie
 */
export const protect = async (req: Request, res: Response, next: NextFunction) => {
    let token;

    try {
        // Token format: "Bearer <token>"
        if (
            req.headers.authorization &&
            req.headers.authorization.startsWith("Bearer")
        ) {
            token = req.headers.authorization.split(" ")[1];

            // Verify token
            const decoded: any = jwt.verify(token, process.env.JWT_SECRET as string);

            // Attach user (without password) with proper typing
            const user = await User.findById(decoded.id).select("-password") as IUser | null;

            if (!user) {
                throw new AppError("Not authorized, user not found", 401, 'AUTH_USER_NOT_FOUND');
            }

            // Fail closed: every account except a platform superadmin must belong to a tenant.
            // (Superadmins only reach tenant-less data through /api/admin; tenant routes that need a
            // tenant call requestContext(), which rejects them with 403 TENANT_REQUIRED.)
            if (!user.tenantId && user.role !== "superadmin") {
                warn("[AUTH] Account without a tenant rejected", { userId: String(user._id) });
                return next(new AppError("This account is not linked to a shop. Contact support.", 403, "TENANT_REQUIRED"));
            }

            const authReq = req as unknown as AuthenticatedRequest;
            authReq.user = user;
            authReq.tenantId = user.tenantId as Types.ObjectId;

            // CRITICAL: Validate deviceId from cookie matches user's active deviceId
            const deviceIdFromCookie = deviceUtils.getDeviceIdFromCookie(req);

            // Enhanced logging for production diagnostics
            if (process.env.NODE_ENV === 'production') {
                if (!deviceIdFromCookie) {
                    warn('⚠️  [AUTH] Device validation failed - No cookie', {
                        userId: user._id,
                        hasActiveDevice: !!user.activeDeviceId,
                        activeDevicePrefix: user.activeDeviceId ? user.activeDeviceId.substring(0, 8) + '...' : 'none'
                    });
                } else if (user.activeDeviceId !== deviceIdFromCookie) {
                    warn('⚠️  [AUTH] Device validation failed - Mismatch', {
                        userId: user._id,
                        cookieDevicePrefix: deviceIdFromCookie.substring(0, 8) + '...',
                        activeDevicePrefix: user.activeDeviceId ? user.activeDeviceId.substring(0, 8) + '...' : 'none'
                    });
                }
            }

            if (!deviceIdFromCookie || user.activeDeviceId !== deviceIdFromCookie) {
                // Device mismatch - this device was logged out from another location
                // Provide more specific error message based on the scenario
                const errorMessage = !deviceIdFromCookie
                    ? "Session expired. Please log in again."
                    : "This account is currently active on another device. Please log in again.";

                // We can't attach extra properties to AppError easily without easy customization, so return response directly or use extended error.
                // For strict compatibility, use res.status
                return res.status(401).json({
                    message: errorMessage,
                    sessionExpired: true,
                    reason: !deviceIdFromCookie ? 'missing_cookie' : 'device_mismatch'
                });
            }

            next();
        } else {
            throw new AppError("Not authorized, token missing", 401, "AUTH_TOKEN_MISSING");
        }
    } catch (error: any) {
        if (error instanceof AppError) {
            next(error);
            return;
        }
        warn('⚠️  [AUTH] Protection middleware failure', {
            error: error.message,
            token: token ? 'present (truncated: ' + token.substring(0, 10) + '...)' : 'missing'
        });
        next(new AppError("Not authorized, token failed", 401, "AUTH_TOKEN_INVALID"));
    }
};

/**
 * Middleware for role-based authorization
 * Must be used after protect middleware
 * @param roles - Array of allowed roles (e.g., ['admin', 'super_admin'])
 */
export const authorize = (...roles: string[]) => {
    return (req: Request, _res: Response, next: NextFunction) => {
        const user = req.user;

        if (!user) {
            return next(new AppError("Not authorized, user not found", 401));
        }

        // Check if user's role is in the allowed roles
        const userRole = ((user as IUser & { systemRole?: string }).systemRole || user.role || '').toLowerCase();

        if (!roles.includes(userRole)) {
            return next(new AppError(`Role '${userRole}' is not authorized to access this resource`, 403));
        }

        next();
    };
};
