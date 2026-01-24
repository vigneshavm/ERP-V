import crypto from "crypto";
import { Response, Request } from "express";
import { info, warn, error } from "../config/logger.js";

/**
 * Generate a cryptographically secure device ID
 */
export const generateDeviceId = (): string => {
    return crypto.randomBytes(32).toString("hex");
};

/**
 * Detect if running in production environment
 */
const isProductionEnvironment = (): boolean => {
    // Explicit NODE_ENV check
    if (process.env.NODE_ENV === "production") return true;

    // Check for Render.com environment
    if (process.env.RENDER) return true;

    // Check for other common production indicators
    if (process.env.RAILWAY_ENVIRONMENT) return true;
    if (process.env.VERCEL) return true;
    if (process.env.HEROKU) return true;

    return false;
};

/**
 * Determine sameSite cookie setting based on environment
 */
const getSameSiteSetting = (): "none" | "lax" | "strict" => {
    if (process.env.COOKIE_SAME_SITE) {
        return process.env.COOKIE_SAME_SITE as "none" | "lax" | "strict";
    }
    const isProduction = isProductionEnvironment();
    // Default to "none" for production (cross-domain deployments)
    // Override with COOKIE_SAME_SITE=lax if using same-domain deployment
    return isProduction ? "none" : "strict";
};

/**
 * Set secure deviceId cookie
 */
export const setDeviceIdCookie = (res: Response, deviceId: string): void => {
    const isProduction = isProductionEnvironment();
    const sameSite = getSameSiteSetting();

    // CRITICAL: Validate COOKIE_SECRET is set
    if (!process.env.COOKIE_SECRET) {
        error('❌ CRITICAL: COOKIE_SECRET environment variable is not set!');
        // throw new Error('COOKIE_SECRET must be configured for signed cookies'); 
        // Note: Throwing here might crash the request in a way that's hard to handle if not caught.
        // But original code throws, so we keep behavior.
        throw new Error('COOKIE_SECRET must be configured for signed cookies');
    }

    const cookieOptions = {
        httpOnly: true,
        secure: isProduction,
        sameSite,
        maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
        signed: true,
        path: '/',
    };

    res.cookie("deviceId", deviceId, cookieOptions);

    // Production logging for diagnostics (protect sensitive data)
    if (isProduction) {
        info('🍪 [PRODUCTION] Set deviceId cookie', {
            deviceIdPrefix: deviceId.substring(0, 8) + '...',
            sameSite,
            secure: isProduction,
            httpOnly: true,
            maxAge: '7 days',
            hasCookieSecret: !!process.env.COOKIE_SECRET
        });
    } else {
        // Debug log in development
        info('🍪 Set deviceId cookie', {
            deviceId: deviceId.substring(0, 8) + '...',
            sameSite,
            secure: isProduction
        });
    }
};

/**
 * Clear deviceId cookie
 */
export const clearDeviceIdCookie = (res: Response): void => {
    const isProduction = isProductionEnvironment();
    const sameSite = getSameSiteSetting();

    res.clearCookie("deviceId", {
        httpOnly: true,
        secure: isProduction,
        sameSite,
        signed: true,
        path: '/',
    });
};

/**
 * Get deviceId from signed cookie
 */
export const getDeviceIdFromCookie = (req: Request): string | null => {
    const deviceId = req.signedCookies?.deviceId || null;
    const isProduction = isProductionEnvironment();

    // Production logging for diagnostics
    if (isProduction && !deviceId) {
        warn('⚠️  [PRODUCTION] deviceId cookie not found', {
            hasSignedCookies: !!req.signedCookies,
            signedCookiesKeys: req.signedCookies ? Object.keys(req.signedCookies) : [],
            hasCookies: !!req.cookies,
            cookiesKeys: req.cookies ? Object.keys(req.cookies) : [],
            hasCookieSecret: !!process.env.COOKIE_SECRET
        });
    }

    return deviceId;
};
