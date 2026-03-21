import jwt from 'jsonwebtoken';
import User from '@smarterp/core/modules/core/models/User.js';
import * as deviceUtils from '@smarterp/shared/utils/deviceUtils.js';
import { warn } from '@smarterp/shared/config/logger.js';
import { AppError } from '@smarterp/shared/utils/AppError.js';
import { getCache, setCache } from '@smarterp/shared/config/cache.js';
// User documents are cached for the access-token lifetime (default 15 m).
// This eliminates a User.findById call on every authenticated request.
const USER_CACHE_TTL_SECONDS = 900; // 15 minutes — matches JWT_ACCESS_EXPIRES_IN
/**
 * protect — validate JWT, enforce device-lock, attach user + tenantId to request.
 *
 * The user document is cached in-process keyed by user ID so that
 * concurrent requests within the same token window only hit MongoDB once.
 * The cache entry is invalidated automatically on TTL expiry; it is also
 * invalidated explicitly whenever activeDeviceId changes (login / logout /
 * force-logout) via invalidateUserCache(userId).
 */
export const protect = async (req, res, next) => {
    try {
        if (!req.headers.authorization?.startsWith('Bearer ')) {
            throw new AppError('Not authorized, token missing', 401);
        }
        const token = req.headers.authorization.split(' ')[1];
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        // Try in-process cache before hitting the database
        const cacheKey = `user:${decoded.id}`;
        let user = await getCache(cacheKey);
        if (!user) {
            user = await User.findById(decoded.id).select('-password').lean();
            if (!user)
                throw new AppError('Not authorized, user not found', 401);
            await setCache(cacheKey, user, USER_CACHE_TTL_SECONDS);
        }
        req.user = user;
        req.tenantId = user.tenantId;
        // Device-lock enforcement — the cookie deviceId must match the active session
        const deviceIdFromCookie = deviceUtils.getDeviceIdFromCookie(req);
        if (process.env.NODE_ENV === 'production') {
            if (!deviceIdFromCookie) {
                warn('[AUTH] Device validation failed — no cookie', {
                    userId: user._id,
                    hasActiveDevice: !!user.activeDeviceId,
                });
            }
            else if (user.activeDeviceId !== deviceIdFromCookie) {
                warn('[AUTH] Device validation failed — mismatch', {
                    userId: user._id,
                    cookiePrefix: deviceIdFromCookie.substring(0, 8) + '...',
                    activePrefix: user.activeDeviceId?.substring(0, 8) + '...',
                });
            }
        }
        if (!deviceIdFromCookie || user.activeDeviceId !== deviceIdFromCookie) {
            const message = !deviceIdFromCookie
                ? 'Session expired. Please log in again.'
                : 'This account is currently active on another device. Please log in again.';
            res.status(401).json({
                message,
                sessionExpired: true,
                reason: !deviceIdFromCookie ? 'missing_cookie' : 'device_mismatch',
            });
            return;
        }
        next();
    }
    catch (error) {
        warn('[AUTH] protect middleware failure', { error: error.message });
        next(new AppError('Not authorized, token failed', 401));
    }
};
/**
 * authorize — role-based access control.
 * Must be placed after protect in the middleware chain.
 */
export const authorize = (...roles) => (req, _res, next) => {
    const user = req.user;
    if (!user)
        return next(new AppError('Not authorized, user not found', 401));
    const userRole = user.systemRole?.toLowerCase() || user.role?.toLowerCase() || '';
    if (!roles.includes(userRole)) {
        return next(new AppError(`Role '${userRole}' is not authorized to access this resource`, 403));
    }
    next();
};
