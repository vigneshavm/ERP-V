import { v4 as uuidv4 } from "uuid";
import { Request, Response, NextFunction } from "express";

declare global {
    namespace Express {
        interface Request {
            /** Correlation id: the caller's X-Request-ID header, or a generated UUID. */
            id?: string;
        }
    }
}

/**
 * Request ID middleware
 * Adds unique ID to each request for tracing
 */
export const requestId = (req: Request, res: Response, next: NextFunction) => {
    // Use existing request ID from header or generate new one
    const id = (req.headers["x-request-id"] as string) || uuidv4();

    req.id = id;

    // Add to response headers
    res.setHeader("X-Request-ID", id);

    next();
};

export default requestId;
