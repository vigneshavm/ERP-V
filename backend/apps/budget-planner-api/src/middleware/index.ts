import { Response, NextFunction, Request } from 'express';
import jwt from 'jsonwebtoken';
import { AuthRequest, JwtPayload, Pagination } from '../types';
import { AppError } from './errorHandler';

export const authenticate = async (req: AuthRequest, _res: Response, next: NextFunction): Promise<void> => {
  try {
    const header = req.headers.authorization;
    if (!header?.startsWith('Bearer ')) throw AppError.unauthorized('Missing Authorization header');
    const token = header.slice(7);
    req.user = jwt.verify(token, process.env.JWT_SECRET!) as JwtPayload;
    next();
  } catch (err) {
    if (err instanceof AppError) return next(err);
    if (err instanceof jwt.TokenExpiredError) return next(AppError.unauthorized('Token expired'));
    next(AppError.unauthorized('Invalid token'));
  }
};

export const paginate = (defaultLimit = 20) =>
  (req: Request, _res: Response, next: NextFunction): void => {
    const page = Math.max(1, Number(req.query.page) || 1);
    const limit = Math.min(100, Math.max(1, Number(req.query.limit) || defaultLimit));
    (req as any).pagination = {
      page, limit, offset: (page - 1) * limit,
      sortBy: (req.query.sortBy as string) || 'created_at',
      sortOrder: (req.query.sortOrder as string)?.toUpperCase() === 'DESC' ? 'DESC' : 'ASC',
      search: (req.query.search as string) || '',
    } as Pagination;
    next();
  };

export const buildPage = <T>(data: T[], total: number, p: Pagination) => ({
  data,
  pagination: {
    total, page: p.page, limit: p.limit,
    totalPages: Math.ceil(total / p.limit),
    hasNext: p.offset + p.limit < total,
    hasPrev: p.page > 1,
  },
});

export const validate = (chains: any[]) =>
  async (req: Request, _res: Response, next: NextFunction): Promise<void> => {
    const { validationResult } = await import('express-validator');
    await Promise.all(chains.map((c: any) => c.run(req)));
    const result = validationResult(req);
    if (!result.isEmpty()) {
      const errors = result.array().reduce<Record<string, string[]>>((acc, e) => {
        const f = 'path' in e ? (e.path as string) : 'general';
        acc[f] = [...(acc[f] || []), e.msg as string];
        return acc;
      }, {});
      return next(AppError.badRequest('Validation failed', errors));
    }
    next();
  };
