import { Response, NextFunction, Request } from "express";
import jwt from "jsonwebtoken";
import crypto from "crypto";
import { ValidationChain, validationResult } from "express-validator";
import { AppError as SharedAppError } from "@smarterp/shared/utils/AppError.js";
import { AuthRequest, JwtPayload, Pagination } from "../types/index.js";

// ─── AppError with static factories ──────────────────────────────────────────
// Shared AppError uses constructor(message, statusCode). We extend it with
// factory methods so route files stay readable without re-implementing the class.
export class AppError extends SharedAppError {
    static badRequest(msg: string)               { return new AppError(msg, 400); }
    static unauthorized(msg = "Unauthorized")    { return new AppError(msg, 401); }
    static forbidden(msg = "Forbidden")          { return new AppError(msg, 403); }
    static notFound(msg = "Resource not found")  { return new AppError(msg, 404); }
    static conflict(msg: string)                 { return new AppError(msg, 409); }
}

// ─── Token utilities ──────────────────────────────────────────────────────────
/** Generate a cryptographically random token (64 hex chars = 32 bytes entropy). */
export const generateResetToken = (): string =>
    crypto.randomBytes(32).toString("hex");

/**
 * Derive a short deterministic lookup handle from a raw token.
 * Store this in the DB index; never store or email the raw token directly after hashing.
 * SHA-256 is appropriate here — it is not the password, just a lookup key.
 */
export const tokenHandle = (rawToken: string): string =>
    crypto.createHash("sha256").update(rawToken).digest("hex");

// ─── Auth ─────────────────────────────────────────────────────────────────────
// Budget Planner uses its own lightweight JWT guard (no device-lock — personal
// finance, single-user accounts). Enterprise/Personal use the shared `protect`
// middleware which enforces device-lock against the ERP User model.
export const authenticate = async (
    req: AuthRequest,
    _res: Response,
    next: NextFunction,
): Promise<void> => {
    try {
        const header = req.headers.authorization;
        if (!header?.startsWith("Bearer "))
            return next(AppError.unauthorized("Missing Authorization header"));
        const token = header.slice(7);
        const decoded = jwt.verify(token, process.env.JWT_SECRET!) as JwtPayload;
        req.user = decoded;
        next();
    } catch (err) {
        if (err instanceof SharedAppError) return next(err);
        if (err instanceof jwt.TokenExpiredError)
            return next(AppError.unauthorized("Token expired"));
        next(AppError.unauthorized("Invalid token"));
    }
};

// ─── Pagination ───────────────────────────────────────────────────────────────
export const paginate =
    (defaultLimit = 20) =>
    (req: Request, _res: Response, next: NextFunction): void => {
        const page  = Math.max(1, Number(req.query.page)  || 1);
        const limit = Math.min(100, Math.max(1, Number(req.query.limit) || defaultLimit));
        (req as any).pagination = {
            page,
            limit,
            offset:    (page - 1) * limit,
            sortBy:    (req.query.sortBy    as string) || "createdAt",
            sortOrder: (req.query.sortOrder as string)?.toLowerCase() === "desc" ? "desc" : "asc",
            search:    (req.query.search    as string) || "",
        } as Pagination;
        next();
    };

export const buildPage = <T>(data: T[], total: number, p: Pagination) => ({
    data,
    pagination: {
        total,
        page:       p.page,
        limit:      p.limit,
        totalPages: Math.ceil(total / p.limit),
        hasNext:    p.offset + p.limit < total,
        hasPrev:    p.page > 1,
    },
});

// ─── Validation ───────────────────────────────────────────────────────────────
// Static top-level import — no dynamic import() overhead per request.
export const validate = (chains: ValidationChain[]) =>
    async (req: Request, _res: Response, next: NextFunction): Promise<void> => {
        await Promise.all(chains.map(c => c.run(req)));
        const result = validationResult(req);
        if (!result.isEmpty()) {
            const msg = result.array().map(e => e.msg).join(", ");
            return next(AppError.badRequest(`Validation failed: ${msg}`));
        }
        next();
    };
