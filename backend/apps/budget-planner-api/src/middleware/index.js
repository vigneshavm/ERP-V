"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.validate = exports.buildPage = exports.paginate = exports.authenticate = void 0;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const errorHandler_1 = require("./errorHandler");
const authenticate = async (req, _res, next) => {
    try {
        const header = req.headers.authorization;
        if (!header?.startsWith('Bearer '))
            throw errorHandler_1.AppError.unauthorized('Missing Authorization header');
        const token = header.slice(7);
        req.user = jsonwebtoken_1.default.verify(token, process.env.JWT_SECRET);
        next();
    }
    catch (err) {
        if (err instanceof errorHandler_1.AppError)
            return next(err);
        if (err instanceof jsonwebtoken_1.default.TokenExpiredError)
            return next(errorHandler_1.AppError.unauthorized('Token expired'));
        next(errorHandler_1.AppError.unauthorized('Invalid token'));
    }
};
exports.authenticate = authenticate;
const paginate = (defaultLimit = 20) => (req, _res, next) => {
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
exports.paginate = paginate;
const buildPage = (data, total, p) => ({
    data,
    pagination: {
        total, page: p.page, limit: p.limit,
        totalPages: Math.ceil(total / p.limit),
        hasNext: p.offset + p.limit < total,
        hasPrev: p.page > 1,
    },
});
exports.buildPage = buildPage;
const validate = (chains) => async (req, _res, next) => {
    const { validationResult } = await import('express-validator');
    await Promise.all(chains.map((c) => c.run(req)));
    const result = validationResult(req);
    if (!result.isEmpty()) {
        const errors = result.array().reduce((acc, e) => {
            const f = 'path' in e ? e.path : 'general';
            acc[f] = [...(acc[f] || []), e.msg];
            return acc;
        }, {});
        return next(errorHandler_1.AppError.badRequest('Validation failed', errors));
    }
    next();
};
exports.validate = validate;
