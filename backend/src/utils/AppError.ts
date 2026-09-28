export class AppError extends Error {
    public readonly statusCode: number;
    public readonly status: string;
    public readonly isOperational: boolean;
    public readonly code?: string;
    /** Optional structured details for the client (e.g. credit-limit figures). */
    public readonly data?: unknown;

    constructor(message: string, statusCode: number, code?: string, data?: unknown) {
        super(message);

        this.statusCode = statusCode;
        this.status = `${statusCode}`.startsWith('4') ? 'fail' : 'error';
        this.isOperational = true;
        this.code = code;
        this.data = data;

        Error.captureStackTrace(this, this.constructor);
    }
}
