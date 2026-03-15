import { Request, Response, NextFunction } from "express";

/**
 * Request timeout middleware
 * Prevents requests from hanging indefinitely
 */

const DEFAULT_TIMEOUT = 30000; // 30 seconds

export const requestTimeout = (timeout = DEFAULT_TIMEOUT) => {
    return (req: Request, res: Response, next: NextFunction) => {
        // Set timeout for this request
        req.setTimeout(timeout, () => {
            // Request timed out
            const error: any = new Error("Request Timeout");
            error.status = 408;
            error.code = "REQUEST_TIMEOUT";

            // Log timeout
            console.error(`Request timeout: ${req.method} ${req.originalUrl}`);

            // Send timeout response if headers not sent
            if (!res.headersSent) {
                res.status(408).json({
                    success: false,
                    status: 408,
                    message: "Request timeout. Please try again.",
                });
            }
        });

        // Set response timeout
        res.setTimeout(timeout, () => {
            console.error(`Response timeout: ${req.method} ${req.originalUrl}`);
        });

        next();
    };
};

export default requestTimeout;
