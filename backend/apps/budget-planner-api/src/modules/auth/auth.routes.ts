import { Router, Request, Response, NextFunction } from 'express';
import { body } from 'express-validator';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import rateLimit from 'express-rate-limit';
import { User, PasswordResetToken, Category } from '../../models/index.js';
import { AppError, authenticate, validate, generateResetToken, tokenHandle } from '../../controllers/helpers.js';
import { AuthRequest } from '../../types/index.js';

const router = Router();
const limiter = rateLimit({ windowMs: 15 * 60 * 1000, max: 10 });
const ROUNDS = Number(process.env.PIN_HASH_ROUNDS) || 12; // OWASP minimum for bcrypt

// Default categories seeded on registration — defined once, not inline per request
const DEFAULT_CATEGORIES = [
    { name: 'Food & Drinks', icon: '🍔', color: '#2ECC71', type: 'expense', limitAmount: 5000 },
    { name: 'Transport',     icon: '🚗', color: '#3498DB', type: 'expense', limitAmount: 3000 },
    { name: 'Bills',         icon: '📋', color: '#F1C40F', type: 'expense', limitAmount: 4000 },
    { name: 'Healthcare',    icon: '💊', color: '#E74C3C', type: 'expense', limitAmount: 2000 },
    { name: 'Entertainment', icon: '🎬', color: '#9B59B6', type: 'expense', limitAmount: 2000 },
    { name: 'Salary',        icon: '💰', color: '#27AE60', type: 'income',  limitAmount: 0 },
] as const;

// ─── Service ──────────────────────────────────────────────────────────────────
const sign = (userId: string, email: string) => ({
    accessToken: jwt.sign(
        { sub: userId, email, jti: crypto.randomUUID() },
        process.env.JWT_SECRET!,
        { expiresIn: (process.env.JWT_EXPIRES_IN || '30m') as any },
    ),
    refreshToken: jwt.sign(
        { sub: userId, jti: crypto.randomUUID() },
        process.env.JWT_REFRESH_SECRET!,
        { expiresIn: (process.env.JWT_REFRESH_EXPIRES_IN || '30d') as any },
    ),
});

// ─── Routes ───────────────────────────────────────────────────────────────────

router.post('/register',
    validate([
        body('email').isEmail().normalizeEmail(),
        body('password').isLength({ min: 8 }).withMessage('Min 8 characters'),
        body('name').trim().notEmpty(),
        body('currency').optional().isLength({ min: 3, max: 3 }),
    ]),
    async (req: Request, res: Response, next: NextFunction) => {
        try {
            const { email, password, name, currency = process.env.DEFAULT_CURRENCY || 'INR' } = req.body;
            // Use exists() — cheaper than findOne() when we only need a boolean
            const exists = await User.exists({ email });
            if (exists) throw AppError.conflict('Email already registered');

            const passwordHash = await bcrypt.hash(password, ROUNDS);
            const user = await User.create({ email, passwordHash, name, currency });
            await Category.insertMany(DEFAULT_CATEGORIES.map(c => ({ ...c, userId: user._id })));

            const tokens = sign(user._id.toString(), email);
            res.status(201).json({ success: true, data: { ...tokens, user: { id: user._id, email, name, currency } } });
        } catch (err) { next(err); }
    },
);

router.post('/login',
    limiter,
    validate([body('email').isEmail().normalizeEmail(), body('password').notEmpty()]),
    async (req: Request, res: Response, next: NextFunction) => {
        try {
            const { email, password } = req.body;
            const user = await User.findOne({ email });
            // Always run bcrypt compare even when user not found — prevents timing-based
            // user enumeration. The dummy hash is a valid bcrypt hash that will never match.
            const DUMMY_HASH = '$2a$12$dummyhashtopreventtimingattacks0000000000000000000000u';
            const valid = await bcrypt.compare(password, user ? user.passwordHash : DUMMY_HASH);
            if (!user || !valid) throw AppError.unauthorized('Invalid credentials');
            if (!user.isActive) throw AppError.unauthorized('Account is deactivated');
            // Update lastLoginAt without re-fetching the full document
            await User.findByIdAndUpdate(user._id, { lastLoginAt: new Date() });
            const tokens = sign(user._id.toString(), user.email);
            res.json({ success: true, data: { ...tokens, user: { id: user._id, email: user.email, name: user.name, currency: user.currency } } });
        } catch (err) { next(err); }
    },
);

router.post('/refresh',
    validate([body('refreshToken').notEmpty()]),
    async (req: Request, res: Response, next: NextFunction) => {
        try {
            let payload: { sub: string };
            try { payload = jwt.verify(req.body.refreshToken, process.env.JWT_REFRESH_SECRET!) as any; }
            catch { throw AppError.unauthorized('Invalid or expired refresh token'); }
            const user = await User.findOne({ _id: payload.sub, isActive: true }).select('email');
            if (!user) throw AppError.unauthorized('User not found');
            res.json({ success: true, data: sign(payload.sub, user.email) });
        } catch (err) { next(err); }
    },
);

router.post('/logout', authenticate, async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
        // TODO: blacklist jti in Redis — redis.setEx(`blocklist:${req.user!.jti}`, remainingTtl, '1')
        // Tokens naturally expire after JWT_EXPIRES_IN (default 30m).
        // Wire Redis blocklist before enabling long-lived tokens.
        res.json({ success: true, message: 'Logged out' });
    } catch (err) { next(err); }
});

router.get('/me', authenticate, async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
        const user = await User.findById(req.user!.sub).select('email name currency createdAt lastLoginAt');
        if (!user) throw AppError.notFound('User not found');
        res.json({ success: true, data: user });
    } catch (err) { next(err); }
});

router.put('/profile',
    authenticate,
    validate([
        body('name').optional().trim().notEmpty(),
        body('currency').optional().isLength({ min: 3, max: 3 }),
    ]),
    async (req: AuthRequest, res: Response, next: NextFunction) => {
        try {
            const { name, currency } = req.body;
            const update: Record<string, unknown> = {};
            if (name)     update.name     = name;
            if (currency) update.currency = currency;
            if (!Object.keys(update).length) throw AppError.badRequest('No fields to update');
            const user = await User.findByIdAndUpdate(req.user!.sub, update, { new: true }).select('email name currency');
            res.json({ success: true, data: user });
        } catch (err) { next(err); }
    },
);

router.post('/forgot-password',
    limiter,
    validate([body('email').isEmail().normalizeEmail()]),
    async (req: Request, res: Response, next: NextFunction) => {
        try {
            const user = await User.findOne({ email: req.body.email }).select('_id');
            if (user) {
                const rawToken  = generateResetToken();              // 64-char hex — emailed to user
                const handle    = tokenHandle(rawToken);             // SHA-256 — stored for O(1) lookup
                const tokenHash = await bcrypt.hash(rawToken, 8);   // bcrypt — stored for verification
                await PasswordResetToken.findOneAndUpdate(
                    { userId: user._id },
                    { tokenHandle: handle, tokenHash, expiresAt: new Date(Date.now() + 3_600_000) },
                    { upsert: true },
                );
                // TODO: await emailService.sendPasswordReset(user.email, rawToken);
            }
            // Always return the same response — never reveal whether the email is registered
            res.json({ success: true, message: 'If this email is registered, a reset link has been sent' });
        } catch (err) { next(err); }
    },
);

router.post('/reset-password',
    validate([
        body('token').notEmpty().isLength({ min: 64, max: 64 }),
        body('password').isLength({ min: 8 }),
    ]),
    async (req: Request, res: Response, next: NextFunction) => {
        try {
            // Derive the handle → single indexed lookup, no full-collection scan
            const handle = tokenHandle(req.body.token as string);
            const record = await PasswordResetToken.findOne({
                tokenHandle: handle,
                expiresAt: { $gt: new Date() },
            });
            // Verify raw token against stored bcrypt hash — timing-safe single comparison
            if (!record || !await bcrypt.compare(req.body.token, record.tokenHash))
                throw AppError.badRequest('Invalid or expired reset token');

            const passwordHash = await bcrypt.hash(req.body.password, ROUNDS);
            await Promise.all([
                User.findByIdAndUpdate(record.userId, { passwordHash }),
                PasswordResetToken.deleteOne({ _id: record._id }),
            ]);
            res.json({ success: true, message: 'Password reset successfully' });
        } catch (err) { next(err); }
    },
);

router.post('/pin/set',
    authenticate,
    validate([body('pin').isLength({ min: 4, max: 6 }).isNumeric()]),
    async (req: AuthRequest, res: Response, next: NextFunction) => {
        try {
            const pinHash = await bcrypt.hash(req.body.pin, ROUNDS);
            await User.findByIdAndUpdate(req.user!.sub, { pinHash });
            res.json({ success: true, message: 'PIN set successfully' });
        } catch (err) { next(err); }
    },
);

router.post('/pin/verify',
    authenticate,
    validate([body('pin').isLength({ min: 4, max: 6 }).isNumeric()]),
    async (req: AuthRequest, res: Response, next: NextFunction) => {
        try {
            const user = await User.findById(req.user!.sub).select('pinHash');
            if (!user?.pinHash) throw AppError.badRequest('No PIN set');
            if (!await bcrypt.compare(req.body.pin, user.pinHash)) throw AppError.unauthorized('Incorrect PIN');
            res.json({ success: true, message: 'PIN verified' });
        } catch (err) { next(err); }
    },
);

export default router;
