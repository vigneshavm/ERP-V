import { Request, Response, NextFunction } from 'express';

/**
 * Global Express error handler.
 *
 * In development: returns the original error message (never the stack trace).
 * In production:  always returns a generic message regardless of error type.
 *
 * Stack traces are logged server-side but never sent to the client.
 */
const errorHandler = (err: any, req: Request, res: Response, _next: NextFunction): void => {
    const statusCode =
        typeof err.statusCode === 'number' ? err.statusCode :
        typeof err.status     === 'number' ? err.status     : 500;

    const message = err.message || 'Internal Server Error';

    // Server-side logging — always include full detail
    console.error(`[Error] ${statusCode} — ${message} — [${req.method}] ${req.originalUrl}`);
    if (err.stack) console.error(err.stack);

    // Client-facing response
    const isProduction = process.env.NODE_ENV === 'production';
    const clientMessage = isProduction
        ? 'An error occurred. Please try again later.'
        : message; // Dev: show the message; never the stack

    res.status(statusCode).json({
        success: false,
        status:  err.status ?? 'error',
        message: clientMessage,
    });
};

export default errorHandler;
