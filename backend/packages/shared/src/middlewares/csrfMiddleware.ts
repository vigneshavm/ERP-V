import crypto from "crypto";
import { Request, Response, NextFunction } from "express";

/**
 * CSRF Protection Middleware
 */

interface CsrfTokenData {
    userId: string;
    expiry: number;
}

// In-memory store for CSRF tokens (use Redis in production for multi-instance)
const csrfTokens = new Map<string, CsrfTokenData>();

// Token expiry: 1 hour
const TOKEN_EXPIRY = 60 * 60 * 1000;

/**
 * Cleanup expired tokens
 */
const cleanupExpiredTokens = () => {
    const now = Date.now();
    for (const [token, data] of csrfTokens.entries()) {
        if (now > data.expiry) {
            csrfTokens.delete(token);
        }
    }
};

/**
 * Generate CSRF token
 */
export const generateCsrfToken = (userId: string): string => {
    const token = crypto.randomBytes(32).toString("hex");
    const expiry = Date.now() + TOKEN_EXPIRY;

    csrfTokens.set(token, { userId, expiry });

    // Cleanup expired tokens periodically
    cleanupExpiredTokens();

    return token;
};

/**
 * Verify CSRF token
 */
export const verifyCsrfToken = (token: string, userId: string): boolean => {
    if (!token || !userId) return false;

    const stored = csrfTokens.get(token);
    if (!stored) return false;

    // Check expiry
    if (Date.now() > stored.expiry) {
        csrfTokens.delete(token);
        return false;
    }

    // Check user match
    if (stored.userId.toString() !== userId.toString()) {
        return false;
    }

    return true;
};

/**
 * Middleware to protect routes from CSRF attacks
 */
export const csrfProtection = (req: Request, res: Response, next: NextFunction) => {
    // Skip CSRF for GET, HEAD, OPTIONS (safe methods)
    if (["GET", "HEAD", "OPTIONS"].includes(req.method)) {
        return next();
    }

    // Get token from header
    const token = req.headers["x-csrf-token"] as string;

    if (!token) {
        res.status(403).json({
            message: "CSRF token missing",
            code: "CSRF_TOKEN_MISSING",
        });
        return;
    }

    // Verify token
    // req.user is populated by protect middleware
    const userId = (req as any).user?._id;

    if (!userId || !verifyCsrfToken(token, userId)) {
        res.status(403).json({
            message: "Invalid CSRF token",
            code: "CSRF_TOKEN_INVALID",
        });
        return;
    }

    next();
};

/**
 * Get CSRF token for current user
 */
export const getCsrfToken = (req: Request, res: Response) => {
    const userId = (req as any).user?._id;
    if (!userId) {
        res.status(401).json({ message: "Authentication required" });
        return;
    }

    const token = generateCsrfToken(userId);

    res.json({ csrfToken: token });
};

export default { csrfProtection, getCsrfToken, generateCsrfToken, verifyCsrfToken };
