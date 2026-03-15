import jwt from "jsonwebtoken";
import crypto from "crypto";
import { warn, error as logError } from '@smarterp/shared/config/logger.js';
import { IRefreshToken as _IRefreshToken } from '@smarterp/shared/interfaces/IRefreshToken.js';

interface SessionContext {
    ip?: string;
    ua?: string;
}

/**
 * Generate JWT access token with jti (JWT ID) for replay protection
 */
export const generateToken = (userId: string, sessionContext: SessionContext = {}): string => {
    const jti = crypto.randomBytes(16).toString("hex"); // Unique token ID

    return jwt.sign(
        {
            id: userId,
            jti, // Token replay protection
            iat: Math.floor(Date.now() / 1000), // Issued at
            ctx: {
                ip: sessionContext.ip || null,
                ua: sessionContext.ua ? crypto.createHash('sha256').update(sessionContext.ua).digest('hex').substring(0, 16) : null
            }
        },
        process.env.JWT_SECRET as string,
        { expiresIn: "7d" } // 7 days (as per original code, comment said 15m but value was 7d?) - Checking original code: { expiresIn: "7d" } // 15 minutes - production security. Discrepancy. I will keep 7d to match code behavior.
    );
};

/**
 * Generate JWT refresh token with absolute session lifetime
 */
export const generateRefreshToken = (userId: string, sessionStart = new Date()): string => {
    const jti = crypto.randomBytes(16).toString("hex");
    const absoluteExpiry = new Date(sessionStart);
    absoluteExpiry.setDate(absoluteExpiry.getDate() + 30); // 30 days absolute max

    return jwt.sign(
        {
            id: userId,
            jti,
            sessionStart: sessionStart.toISOString(),
            absoluteExpiry: absoluteExpiry.toISOString()
        },
        process.env.JWT_REFRESH_SECRET as string,
        { expiresIn: "7d" } // 7 days rolling, but absolute max is 30 days
    );
};

/**
 * Generate random token for refresh tokens (cryptographically secure)
 */
export const generateRandomToken = (): string => {
    return crypto.randomBytes(40).toString("hex");
};

/**
 * Verify JWT access token with session anomaly detection
 */
export const verifyToken = (token: string, requestContext: SessionContext = {}): any => {
    const decoded: any = jwt.verify(token, process.env.JWT_SECRET as string);

    // Session anomaly detection (non-blocking, log only)
    if (decoded.ctx) {
        const currentUAHash = requestContext.ua
            ? crypto.createHash('sha256').update(requestContext.ua).digest('hex').substring(0, 16)
            : null;

        // IP mismatch detection
        if (decoded.ctx.ip && requestContext.ip && decoded.ctx.ip !== requestContext.ip) {
            warn('Session anomaly: IP mismatch', {
                userId: decoded.id,
                tokenIP: decoded.ctx.ip,
                requestIP: requestContext.ip,
                jti: decoded.jti
            });
        }

        // User-Agent mismatch detection
        if (decoded.ctx.ua && currentUAHash && decoded.ctx.ua !== currentUAHash) {
            warn('Session anomaly: User-Agent mismatch', {
                userId: decoded.id,
                jti: decoded.jti
            });
        }
    }

    return decoded;
};

/**
 * Verify JWT refresh token with absolute session lifetime check
 */
export const verifyRefreshToken = (token: string): any => {
    const decoded: any = jwt.verify(token, process.env.JWT_REFRESH_SECRET as string);

    // Check absolute session lifetime (30 days max)
    if (decoded.absoluteExpiry) {
        const absoluteExpiry = new Date(decoded.absoluteExpiry);
        if (Date.now() > absoluteExpiry.getTime()) {
            throw new Error('Session expired: absolute lifetime exceeded (30 days)');
        }
    }

    return decoded;
};

/**
 * Detect refresh token reuse (security breach indicator)
 */
export const detectRefreshTokenReuse = async (tokenString: string, RefreshTokenModel: any): Promise<boolean> => {
    const storedToken = await RefreshTokenModel.findOne({ token: tokenString });

    if (!storedToken) {
        return false; // Token not found, not reuse
    }

    // If token is already revoked, this is REUSE (security breach)
    if (storedToken.isRevoked) {
        logError('SECURITY ALERT: Refresh token reuse detected', {
            userId: storedToken.user,
            tokenId: storedToken._id,
            revokedAt: storedToken.revokedAt,
            attemptedAt: new Date()
        });

        // Revoke ALL tokens for this user (security breach response)
        await RefreshTokenModel.updateMany(
            { user: storedToken.user, isRevoked: false },
            { isRevoked: true, revokedAt: new Date(), revokeReason: 'token_reuse_detected' }
        );

        return true; // Reuse detected
    }

    return false; // Valid token, not reuse
};

export default {
    generateToken,
    generateRefreshToken,
    generateRandomToken,
    verifyToken,
    verifyRefreshToken,
    detectRefreshTokenReuse,
};
