"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const express_validator_1 = require("express-validator");
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const uuid_1 = require("uuid");
const express_rate_limit_1 = __importDefault(require("express-rate-limit"));
const database_1 = require("../../config/database");
const errorHandler_1 = require("../../middleware/errorHandler");
const index_1 = require("../../middleware/index");
const router = (0, express_1.Router)();
const limiter = (0, express_rate_limit_1.default)({ windowMs: 15 * 60 * 1000, max: 10 });
const ROUNDS = Number(process.env.PIN_HASH_ROUNDS) || 10;
// ─── Service ─────────────────────────────────────────────────────────────────
const sign = (userId, email) => {
    const jti = (0, uuid_1.v4)();
    return {
        accessToken: jsonwebtoken_1.default.sign({ sub: userId, email, jti }, process.env.JWT_SECRET, { expiresIn: process.env.JWT_EXPIRES_IN || '30m' }),
        refreshToken: jsonwebtoken_1.default.sign({ sub: userId, jti: (0, uuid_1.v4)() }, process.env.JWT_REFRESH_SECRET, { expiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '30d' }),
    };
};
// ─── Routes ──────────────────────────────────────────────────────────────────
/**
 * POST /api/v1/auth/register
 * Create a new personal account.
 */
router.post('/register', (0, index_1.validate)([
    (0, express_validator_1.body)('email').isEmail().normalizeEmail(),
    (0, express_validator_1.body)('password').isLength({ min: 8 }).withMessage('Min 8 characters'),
    (0, express_validator_1.body)('name').trim().notEmpty(),
    (0, express_validator_1.body)('currency').optional().isLength({ min: 3, max: 3 }),
]), async (req, res, next) => {
    try {
        const { email, password, name, currency = process.env.DEFAULT_CURRENCY || 'INR' } = req.body;
        const exists = await database_1.db.query('SELECT id FROM users WHERE email = $1', [email]);
        if (exists.rows.length)
            throw errorHandler_1.AppError.conflict('Email already registered');
        const hash = await bcryptjs_1.default.hash(password, ROUNDS);
        const id = (0, uuid_1.v4)();
        await database_1.db.query(`INSERT INTO users (id, email, password_hash, name, currency) VALUES ($1,$2,$3,$4,$5)`, [id, email, hash, name, currency]);
        // Seed default categories for new user
        const defaults = [
            { name: 'Food & Drinks', icon: '🍔', color: '#2ECC71', type: 'expense', limit: 5000 },
            { name: 'Transport', icon: '🚗', color: '#3498DB', type: 'expense', limit: 3000 },
            { name: 'Bills', icon: '📋', color: '#F1C40F', type: 'expense', limit: 4000 },
            { name: 'Healthcare', icon: '💊', color: '#E74C3C', type: 'expense', limit: 2000 },
            { name: 'Entertainment', icon: '🎬', color: '#9B59B6', type: 'expense', limit: 2000 },
            { name: 'Salary', icon: '💰', color: '#27AE60', type: 'income', limit: 0 },
        ];
        for (const c of defaults) {
            await database_1.db.query(`INSERT INTO categories (id, user_id, name, icon, color, type, value, limit_amount, over) VALUES ($1,$2,$3,$4,$5,$6,0,$7,false)`, [(0, uuid_1.v4)(), id, c.name, c.icon, c.color, c.type, c.limit]);
        }
        const tokens = sign(id, email);
        res.status(201).json({ success: true, data: { ...tokens, user: { id, email, name, currency } } });
    }
    catch (err) {
        next(err);
    }
});
/**
 * POST /api/v1/auth/login
 */
router.post('/login', limiter, (0, index_1.validate)([(0, express_validator_1.body)('email').isEmail().normalizeEmail(), (0, express_validator_1.body)('password').notEmpty()]), async (req, res, next) => {
    try {
        const { email, password } = req.body;
        const result = await database_1.db.query('SELECT id, email, password_hash, name, currency, is_active FROM users WHERE email = $1', [email]);
        const user = result.rows[0];
        if (!user || !await bcryptjs_1.default.compare(password, user.password_hash))
            throw errorHandler_1.AppError.unauthorized('Invalid credentials');
        if (!user.is_active)
            throw errorHandler_1.AppError.unauthorized('Account is deactivated');
        await database_1.db.query('UPDATE users SET last_login_at = NOW() WHERE id = $1', [user.id]);
        const tokens = sign(user.id, user.email);
        res.json({ success: true, data: { ...tokens, user: { id: user.id, email: user.email, name: user.name, currency: user.currency } } });
    }
    catch (err) {
        next(err);
    }
});
/**
 * POST /api/v1/auth/refresh
 */
router.post('/refresh', (0, index_1.validate)([(0, express_validator_1.body)('refreshToken').notEmpty()]), async (req, res, next) => {
    try {
        let payload;
        try {
            payload = jsonwebtoken_1.default.verify(req.body.refreshToken, process.env.JWT_REFRESH_SECRET);
        }
        catch {
            throw errorHandler_1.AppError.unauthorized('Invalid or expired refresh token');
        }
        const user = await database_1.db.query('SELECT email FROM users WHERE id = $1 AND is_active = true', [payload.sub]);
        if (!user.rows[0])
            throw errorHandler_1.AppError.unauthorized('User not found');
        const tokens = sign(payload.sub, user.rows[0].email);
        res.json({ success: true, data: tokens });
    }
    catch (err) {
        next(err);
    }
});
/**
 * POST /api/v1/auth/logout
 */
router.post('/logout', index_1.authenticate, async (_req, res, next) => {
    try {
        // In production: blacklist jti in Redis
        res.json({ success: true, message: 'Logged out' });
    }
    catch (err) {
        next(err);
    }
});
/**
 * GET /api/v1/auth/me
 */
router.get('/me', index_1.authenticate, async (req, res, next) => {
    try {
        const result = await database_1.db.query('SELECT id, email, name, currency, created_at, last_login_at FROM users WHERE id = $1', [req.user.sub]);
        if (!result.rows[0])
            throw errorHandler_1.AppError.notFound('User not found');
        res.json({ success: true, data: result.rows[0] });
    }
    catch (err) {
        next(err);
    }
});
/**
 * PUT /api/v1/auth/profile  — update name / currency / avatar
 */
router.put('/profile', index_1.authenticate, (0, index_1.validate)([(0, express_validator_1.body)('name').optional().trim().notEmpty(), (0, express_validator_1.body)('currency').optional().isLength({ min: 3, max: 3 })]), async (req, res, next) => {
    try {
        const { name, currency } = req.body;
        const fields = [];
        const params = [];
        if (name) {
            params.push(name);
            fields.push(`name = $${params.length}`);
        }
        if (currency) {
            params.push(currency);
            fields.push(`currency = $${params.length}`);
        }
        if (!fields.length)
            throw errorHandler_1.AppError.badRequest('No fields to update');
        params.push(req.user.sub);
        const result = await database_1.db.query(`UPDATE users SET ${fields.join(', ')}, updated_at = NOW() WHERE id = $${params.length} RETURNING id, email, name, currency`, params);
        res.json({ success: true, data: result.rows[0] });
    }
    catch (err) {
        next(err);
    }
});
/**
 * POST /api/v1/auth/forgot-password
 */
router.post('/forgot-password', limiter, (0, index_1.validate)([(0, express_validator_1.body)('email').isEmail().normalizeEmail()]), async (req, res, next) => {
    try {
        const result = await database_1.db.query('SELECT id FROM users WHERE email = $1', [req.body.email]);
        if (result.rows[0]) {
            const token = (0, uuid_1.v4)();
            const hash = await bcryptjs_1.default.hash(token, 8);
            await database_1.db.query(`INSERT INTO password_reset_tokens (user_id, token, expires_at) VALUES ($1,$2,NOW() + interval '1 hour') ON CONFLICT (user_id) DO UPDATE SET token=$2, expires_at=NOW() + interval '1 hour'`, [result.rows[0].id, hash]);
            // TODO: send email with token in production
        }
        res.json({ success: true, message: 'If this email is registered, a reset link has been sent' });
    }
    catch (err) {
        next(err);
    }
});
/**
 * POST /api/v1/auth/reset-password
 */
router.post('/reset-password', (0, index_1.validate)([(0, express_validator_1.body)('token').notEmpty(), (0, express_validator_1.body)('password').isLength({ min: 8 })]), async (req, res, next) => {
    try {
        const result = await database_1.db.query('SELECT user_id, token FROM password_reset_tokens WHERE expires_at > NOW()');
        const match = result.rows.find(async (r) => await bcryptjs_1.default.compare(req.body.token, r.token));
        if (!match)
            throw errorHandler_1.AppError.badRequest('Invalid or expired reset token');
        const hash = await bcryptjs_1.default.hash(req.body.password, ROUNDS);
        await database_1.db.transaction(async (client) => {
            await client.query('UPDATE users SET password_hash = $1 WHERE id = $2', [hash, match.user_id]);
            await client.query('DELETE FROM password_reset_tokens WHERE user_id = $1', [match.user_id]);
        });
        res.json({ success: true, message: 'Password reset successfully' });
    }
    catch (err) {
        next(err);
    }
});
/**
 * POST /api/v1/auth/pin/set   — set or update app PIN lock
 */
router.post('/pin/set', index_1.authenticate, (0, index_1.validate)([(0, express_validator_1.body)('pin').isLength({ min: 4, max: 6 }).isNumeric()]), async (req, res, next) => {
    try {
        const hash = await bcryptjs_1.default.hash(req.body.pin, ROUNDS);
        await database_1.db.query('UPDATE users SET pin_hash = $1 WHERE id = $2', [hash, req.user.sub]);
        res.json({ success: true, message: 'PIN set successfully' });
    }
    catch (err) {
        next(err);
    }
});
/**
 * POST /api/v1/auth/pin/verify  — verify PIN, returns short-lived token
 */
router.post('/pin/verify', index_1.authenticate, (0, index_1.validate)([(0, express_validator_1.body)('pin').isLength({ min: 4, max: 6 }).isNumeric()]), async (req, res, next) => {
    try {
        const result = await database_1.db.query('SELECT pin_hash FROM users WHERE id = $1', [req.user.sub]);
        if (!result.rows[0]?.pin_hash)
            throw errorHandler_1.AppError.badRequest('No PIN set');
        const valid = await bcryptjs_1.default.compare(req.body.pin, result.rows[0].pin_hash);
        if (!valid)
            throw errorHandler_1.AppError.unauthorized('Incorrect PIN');
        res.json({ success: true, message: 'PIN verified' });
    }
    catch (err) {
        next(err);
    }
});
exports.default = router;
