import { Request, Response, NextFunction } from 'express';

export class AppError extends Error {
  constructor(public statusCode: number, public message: string, public errors?: Record<string, string[]>) {
    super(message);
    this.name = 'AppError';
  }
  static badRequest(msg: string, errors?: Record<string, string[]>) { return new AppError(400, msg, errors); }
  static unauthorized(msg = 'Unauthorized') { return new AppError(401, msg); }
  static forbidden(msg = 'Forbidden') { return new AppError(403, msg); }
  static notFound(msg = 'Resource not found') { return new AppError(404, msg); }
  static conflict(msg: string) { return new AppError(409, msg); }
}

export const errorHandler = (err: Error, _req: Request, res: Response, _next: NextFunction): void => {
  if (err instanceof AppError) {
    res.status(err.statusCode).json({ success: false, message: err.message, ...(err.errors && { errors: err.errors }) });
    return;
  }
  if ((err as any).code === '23505') {
    res.status(409).json({ success: false, message: 'Duplicate entry' });
    return;
  }
  console.error(err);
  res.status(500).json({ success: false, message: 'Internal server error' });
};

export const notFoundHandler = (_req: Request, res: Response): void => {
  res.status(404).json({ success: false, message: 'Route not found' });
};
