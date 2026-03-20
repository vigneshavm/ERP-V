"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.notFoundHandler = exports.errorHandler = exports.AppError = void 0;
class AppError extends Error {
    statusCode;
    message;
    errors;
    constructor(statusCode, message, errors) {
        super(message);
        this.statusCode = statusCode;
        this.message = message;
        this.errors = errors;
        this.name = 'AppError';
    }
    static badRequest(msg, errors) { return new AppError(400, msg, errors); }
    static unauthorized(msg = 'Unauthorized') { return new AppError(401, msg); }
    static forbidden(msg = 'Forbidden') { return new AppError(403, msg); }
    static notFound(msg = 'Resource not found') { return new AppError(404, msg); }
    static conflict(msg) { return new AppError(409, msg); }
}
exports.AppError = AppError;
const errorHandler = (err, _req, res, _next) => {
    if (err instanceof AppError) {
        res.status(err.statusCode).json({ success: false, message: err.message, ...(err.errors && { errors: err.errors }) });
        return;
    }
    if (err.code === '23505') {
        res.status(409).json({ success: false, message: 'Duplicate entry' });
        return;
    }
    console.error(err);
    res.status(500).json({ success: false, message: 'Internal server error' });
};
exports.errorHandler = errorHandler;
const notFoundHandler = (_req, res) => {
    res.status(404).json({ success: false, message: 'Route not found' });
};
exports.notFoundHandler = notFoundHandler;
