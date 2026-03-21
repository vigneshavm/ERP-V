import jwt from 'jsonwebtoken';
import { AppError } from './errorHandler';
export const authenticate = async (req, _res, next) => {
    try {
        const header = req.headers.authorization;
        if (!header?.startsWith('Bearer '))
            throw AppError.unauthorized('Missing Authorization header');
        const token = header.slice(7);
        req.user = jwt.verify(token, process.env.JWT_SECRET);
        next();
    }
    catch (err) {
        if (err instanceof AppError)
            return next(err);
        if (err instanceof jwt.TokenExpiredError)
            return next(AppError.unauthorized('Token expired'));
        next(AppError.unauthorized('Invalid token'));
    }
};
export const paginate = (defaultLimit = 20) => (req, _res, next) => {
    const page = Math.max(1, Number(req.query.page) || 1);
    const limit = Math.min(100, Math.max(1, Number(req.query.limit) || defaultLimit));
    req.pagination = {
        page, limit, offset: (page - 1) * limit,
        sortBy: req.query.sortBy || 'created_at',
        sortOrder: req.query.sortOrder?.toUpperCase() === 'DESC' ? 'DESC' : 'ASC',
        search: req.query.search || '',
    };
    next();
};
export const buildPage = (data, total, p) => ({
    data,
    pagination: {
        total, page: p.page, limit: p.limit,
        totalPages: Math.ceil(total / p.limit),
        hasNext: p.offset + p.limit < total,
        hasPrev: p.page > 1,
    },
});
export const validate = (chains) => async (req, _res, next) => {
    const { validationResult } = await import('express-validator');
    await Promise.all(chains.map((c) => c.run(req)));
    const result = validationResult(req);
    if (!result.isEmpty()) {
        const errors = result.array().reduce((acc, e) => {
            const f = 'path' in e ? e.path : 'general';
            acc[f] = [...(acc[f] || []), e.msg];
            return acc;
        }, {});
        return next(AppError.badRequest('Validation failed', errors));
    }
    next();
};
