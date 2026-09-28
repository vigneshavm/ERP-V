import { Request, Response, NextFunction } from "express";
import { error as errorLog, warn } from "../config/logger.js";

/**
 * The only place error responses are written (docs/backend-architecture.md §3-4).
 *
 * Body: { success: false, error: { code, message, details? }, message, code, data? }
 *   - `message`, `code` and `data` at the top level mirror `error.*` for the frontend's existing
 *     `err.response.data.message` / `.code` / `.data` reads; remove once it uses getApiErrorMessage().
 *   - Expected errors (AppError with status < 500, validation, bad ids, duplicates) keep their
 *     message in production -- the user needs it. Unexpected (5xx) errors get a generic message.
 *   - Stack traces are logged, never sent.
 */

interface NormalizedError {
    statusCode: number;
    code: string;
    message: string;
    details?: unknown;
}

const normalize = (err: any): NormalizedError => {
    // Our own errors
    if (err && typeof err.statusCode === "number") {
        return {
            statusCode: err.statusCode,
            code: err.code || (err.statusCode < 500 ? "REQUEST_ERROR" : "INTERNAL_ERROR"),
            message: err.message || "Request failed",
            details: err.data,
        };
    }
    // Mongoose: invalid ObjectId in a filter or path
    if (err?.name === "CastError") {
        return { statusCode: 400, code: "INVALID_ID", message: `Invalid ${err.path || "id"}` };
    }
    // Mongoose: schema validation failed
    if (err?.name === "ValidationError" && err.errors) {
        const details = Object.values(err.errors).map((e: any) => ({ field: e.path, message: e.message }));
        return { statusCode: 400, code: "VALIDATION_ERROR", message: (details[0] as any)?.message || "Validation failed", details };
    }
    // MongoDB duplicate key
    if (err?.code === 11000) {
        const fields = Object.keys(err.keyValue || err.keyPattern || {});
        return { statusCode: 409, code: "DUPLICATE", message: `A record with this ${fields.join(", ") || "value"} already exists`, details: { fields } };
    }
    // body-parser: malformed JSON / body too large
    if (err?.type === "entity.parse.failed") {
        return { statusCode: 400, code: "INVALID_JSON", message: "Request body is not valid JSON" };
    }
    if (err?.type === "entity.too.large") {
        return { statusCode: 413, code: "PAYLOAD_TOO_LARGE", message: "Request body is too large" };
    }
    const statusCode = typeof err?.status === "number" ? err.status : 500;
    return { statusCode, code: statusCode < 500 ? "REQUEST_ERROR" : "INTERNAL_ERROR", message: err?.message || "Internal Server Error" };
};

const errorHandler = (err: any, req: Request, res: Response, next: NextFunction) => {
    if (res.headersSent) {
        next(err);
        return;
    }

    const { statusCode, code, message, details } = normalize(err);
    const meta = { statusCode, code, requestId: req.id, method: req.method, url: req.originalUrl, tenantId: req.tenantId?.toString() };
    if (statusCode >= 500) {
        errorLog(`[${code}] ${message}`, { ...meta, stack: err?.stack });
    } else {
        warn(`[${code}] ${message}`, meta);
    }

    const exposeMessage = statusCode < 500 || process.env.NODE_ENV !== "production";
    const clientMessage = exposeMessage ? message : "An error occurred. Please try again later.";
    const clientDetails = statusCode < 500 ? details : undefined;

    res.status(statusCode).json({
        success: false,
        error: {
            code,
            message: clientMessage,
            ...(clientDetails !== undefined ? { details: clientDetails } : {}),
        },
        // Legacy mirrors for existing frontend reads (see header comment).
        message: clientMessage,
        code,
        ...(clientDetails !== undefined ? { data: clientDetails } : {}),
    });
};

export default errorHandler;
