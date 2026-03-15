import { Request, Response, NextFunction } from "express";
// import { AppError } from "../utils/AppError.js";

const errorHandler = (err: any, _req: Request, res: Response, _next: NextFunction) => {
    // Prioritize statusCode (numeric) from AppError, else check status if numeric, else 500
    const statusCode = (typeof err.statusCode === 'number') ? err.statusCode : (typeof err.status === 'number' ? err.status : 500);
    const status = err.status || "error"; // For response body (fail/error)
    const message = err.message || "Internal Server Error";

    // Log full error server-side with stack trace
    console.error(`[Error] ${status} - ${message} - [${_req.method}] ${_req.originalUrl}`);
    if (err.stack) {
        console.error(err.stack);
    }

    // CRITICAL: NEVER send stack traces or detailed errors to client
    // Even in development, use generic messages for security
    const isProduction = process.env.NODE_ENV === "production";

    res.status(statusCode).json({
        success: false,
        status,
        message: isProduction
            ? "An error occurred. Please try again later."
            : message, // In dev, show message but never stack
        // Stack trace NEVER sent to client
    });
};

export default errorHandler;
