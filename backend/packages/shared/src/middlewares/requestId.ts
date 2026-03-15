import { v4 as uuidv4 } from "uuid";
import { Request, Response, NextFunction } from "express";

/**
 * Request ID middleware
 * Adds unique ID to each request for tracing
 */
export const requestId = (req: Request, res: Response, next: NextFunction) => {
    // Use existing request ID from header or generate new one
    const id = (req.headers["x-request-id"] as string) || uuidv4();

    // Attach to request object (needs type augmentation)
    (req as any).id = id;

    // Add to response headers
    res.setHeader("X-Request-ID", id);

    next();
};

export default requestId;
