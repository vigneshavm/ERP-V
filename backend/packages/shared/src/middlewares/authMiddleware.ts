import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import User from "@smarterp/core/modules/core/models/User.js";
import * as deviceUtils from '@smarterp/shared/utils/deviceUtils.js';
import { warn } from '@smarterp/shared/config/logger.js';
import { AppError } from '@smarterp/shared/utils/AppError.js';

export interface AuthenticatedRequest extends Request {
    user?: any;
    tenantId?: string;
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

            // Attach user (without password)
            const user = await User.findById(decoded.id).select("-password"); // This uses Mongoose model directly for performance/middleware simplicity

            if (!user) {
                throw new AppError("Not authorized, user not found", 401);
            }

            (req as any).user = user;
            // NEW: Inject Tenant ID into request for downstream use
            (req as any).tenantId = user.tenantId;

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
            throw new AppError("Not authorized, token missing", 401);
        }
    } catch (error: any) {
        warn('⚠️  [AUTH] Protection middleware failure', {
            error: error.message,
            stack: error.stack,
            token: token ? 'present (truncated: ' + token.substring(0, 10) + '...)' : 'missing'
        });
        next(new AppError("Not authorized, token failed", 401));
    }
};

/**
 * Middleware for role-based authorization
 * Must be used after protect middleware
 * @param roles - Array of allowed roles (e.g., ['admin', 'super_admin'])
 */
export const authorize = (...roles: string[]) => {
    return (req: Request, _res: Response, next: NextFunction) => {
        const user = (req as any).user;

        if (!user) {
            return next(new AppError("Not authorized, user not found", 401));
        }

        // Check if user's role is in the allowed roles
        const userRole = user.systemRole?.toLowerCase() || user.role?.toLowerCase() || '';

        if (!roles.includes(userRole)) {
            return next(new AppError(`Role '${userRole}' is not authorized to access this resource`, 403));
        }

        next();
    };
};
