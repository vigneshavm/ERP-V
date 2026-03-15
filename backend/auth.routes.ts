import { Router, Request, Response, NextFunction } from 'express';
import { body } from 'express-validator';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { v4 as uuidv4 } from 'uuid';
import rateLimit from 'express-rate-limit';
import { db } from '../../config/database';
import { AppError } from '../../middleware/errorHandler';
import { authenticate, validate } from '../../middleware/index';
import { AuthRequest } from '../../types';

const router = Router();
const limiter = rateLimit({ windowMs: 15 * 60 * 1000, max: 10 });
const ROUNDS = Number(process.env.PIN_HASH_ROUNDS) || 10;

// ─── Service ─────────────────────────────────────────────────────────────────

const sign = (userId: string, email: string) => {
  const jti = uuidv4();
  return {
    accessToken: jwt.sign({ sub: userId, email, jti }, process.env.JWT_SECRET!, { expiresIn: process.env.JWT_EXPIRES_IN || '30m' }),
    refreshToken: jwt.sign({ sub: userId, jti: uuidv4() }, process.env.JWT_REFRESH_SECRET!, { expiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '30d' }),
  };
};

// ─── Routes ──────────────────────────────────────────────────────────────────

/**
 * POST /api/v1/auth/register
 * Create a new personal account.
 */
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
      const exists = await db.query('SELECT id FROM users WHERE email = $1', [email]);
      if (exists.rows.length) throw AppError.conflict('Email already registered');

      const hash = await bcrypt.hash(password, ROUNDS);
      const id = uuidv4();
      await db.query(
        `INSERT INTO users (id, email, password_hash, name, currency) VALUES ($1,$2,$3,$4,$5)`,
        [id, email, hash, name, currency]
      );
      // Seed default categories for new user
      const defaults = [
        { name: 'Food & Drinks', icon: '🍔', color: '#2ECC71', type: 'expense', limit: 5000 },
        { name: 'Transport',     icon: '🚗', color: '#3498DB', type: 'expense', limit: 3000 },
        { name: 'Bills',         icon: '📋', color: '#F1C40F', type: 'expense', limit: 4000 },
        { name: 'Healthcare',    icon: '💊', color: '#E74C3C', type: 'expense', limit: 2000 },
        { name: 'Entertainment', icon: '🎬', color: '#9B59B6', type: 'expense', limit: 2000 },
        { name: 'Salary',        icon: '💰', color: '#27AE60', type: 'income',  limit: 0 },
      ];
      for (const c of defaults) {
        await db.query(
          `INSERT INTO categories (id, user_id, name, icon, color, type, value, limit_amount, over) VALUES ($1,$2,$3,$4,$5,$6,0,$7,false)`,
          [uuidv4(), id, c.name, c.icon, c.color, c.type, c.limit]
        );
      }
      const tokens = sign(id, email);
      res.status(201).json({ success: true, data: { ...tokens, user: { id, email, name, currency } } });
    } catch (err) { next(err); }
  }
);

/**
 * POST /api/v1/auth/login
 */
router.post('/login',
  limiter,
  validate([body('email').isEmail().normalizeEmail(), body('password').notEmpty()]),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { email, password } = req.body;
      const result = await db.query<{ id: string; email: string; password_hash: string; name: string; currency: string; is_active: boolean }>(
        'SELECT id, email, password_hash, name, currency, is_active FROM users WHERE email = $1', [email]
      );
      const user = result.rows[0];
      if (!user || !await bcrypt.compare(password, user.password_hash)) throw AppError.unauthorized('Invalid credentials');
      if (!user.is_active) throw AppError.unauthorized('Account is deactivated');
      await db.query('UPDATE users SET last_login_at = NOW() WHERE id = $1', [user.id]);
      const tokens = sign(user.id, user.email);
      res.json({ success: true, data: { ...tokens, user: { id: user.id, email: user.email, name: user.name, currency: user.currency } } });
    } catch (err) { next(err); }
  }
);

/**
 * POST /api/v1/auth/refresh
 */
router.post('/refresh',
  validate([body('refreshToken').notEmpty()]),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      let payload: { sub: string };
      try { payload = jwt.verify(req.body.refreshToken, process.env.JWT_REFRESH_SECRET!) as any; }
      catch { throw AppError.unauthorized('Invalid or expired refresh token'); }
      const user = await db.query<{ email: string }>('SELECT email FROM users WHERE id = $1 AND is_active = true', [payload.sub]);
      if (!user.rows[0]) throw AppError.unauthorized('User not found');
      const tokens = sign(payload.sub, user.rows[0].email);
      res.json({ success: true, data: tokens });
    } catch (err) { next(err); }
  }
);

/**
 * POST /api/v1/auth/logout
 */
router.post('/logout', authenticate, async (_req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    // In production: blacklist jti in Redis
    res.json({ success: true, message: 'Logged out' });
  } catch (err) { next(err); }
});

/**
 * GET /api/v1/auth/me
 */
router.get('/me', authenticate, async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const result = await db.query(
      'SELECT id, email, name, currency, created_at, last_login_at FROM users WHERE id = $1', [req.user!.sub]
    );
    if (!result.rows[0]) throw AppError.notFound('User not found');
    res.json({ success: true, data: result.rows[0] });
  } catch (err) { next(err); }
});

/**
 * PUT /api/v1/auth/profile  — update name / currency / avatar
 */
router.put('/profile',
  authenticate,
  validate([body('name').optional().trim().notEmpty(), body('currency').optional().isLength({ min: 3, max: 3 })]),
  async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const { name, currency } = req.body;
      const fields: string[] = []; const params: unknown[] = [];
      if (name) { params.push(name); fields.push(`name = $${params.length}`); }
      if (currency) { params.push(currency); fields.push(`currency = $${params.length}`); }
      if (!fields.length) throw AppError.badRequest('No fields to update');
      params.push(req.user!.sub);
      const result = await db.query(`UPDATE users SET ${fields.join(', ')}, updated_at = NOW() WHERE id = $${params.length} RETURNING id, email, name, currency`, params);
      res.json({ success: true, data: result.rows[0] });
    } catch (err) { next(err); }
  }
);

/**
 * POST /api/v1/auth/forgot-password
 */
router.post('/forgot-password',
  limiter,
  validate([body('email').isEmail().normalizeEmail()]),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const result = await db.query<{ id: string }>('SELECT id FROM users WHERE email = $1', [req.body.email]);
      if (result.rows[0]) {
        const token = uuidv4();
        const hash = await bcrypt.hash(token, 8);
        await db.query(
          `INSERT INTO password_reset_tokens (user_id, token, expires_at) VALUES ($1,$2,NOW() + interval '1 hour') ON CONFLICT (user_id) DO UPDATE SET token=$2, expires_at=NOW() + interval '1 hour'`,
          [result.rows[0].id, hash]
        );
        // TODO: send email with token in production
      }
      res.json({ success: true, message: 'If this email is registered, a reset link has been sent' });
    } catch (err) { next(err); }
  }
);

/**
 * POST /api/v1/auth/reset-password
 */
router.post('/reset-password',
  validate([body('token').notEmpty(), body('password').isLength({ min: 8 })]),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const result = await db.query<{ user_id: string; token: string }>(
        'SELECT user_id, token FROM password_reset_tokens WHERE expires_at > NOW()'
      );
      const match = result.rows.find(async r => await bcrypt.compare(req.body.token, r.token));
      if (!match) throw AppError.badRequest('Invalid or expired reset token');
      const hash = await bcrypt.hash(req.body.password, ROUNDS);
      await db.transaction(async (client) => {
        await client.query('UPDATE users SET password_hash = $1 WHERE id = $2', [hash, match.user_id]);
        await client.query('DELETE FROM password_reset_tokens WHERE user_id = $1', [match.user_id]);
      });
      res.json({ success: true, message: 'Password reset successfully' });
    } catch (err) { next(err); }
  }
);

/**
 * POST /api/v1/auth/pin/set   — set or update app PIN lock
 */
router.post('/pin/set',
  authenticate,
  validate([body('pin').isLength({ min: 4, max: 6 }).isNumeric()]),
  async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const hash = await bcrypt.hash(req.body.pin, ROUNDS);
      await db.query('UPDATE users SET pin_hash = $1 WHERE id = $2', [hash, req.user!.sub]);
      res.json({ success: true, message: 'PIN set successfully' });
    } catch (err) { next(err); }
  }
);

/**
 * POST /api/v1/auth/pin/verify  — verify PIN, returns short-lived token
 */
router.post('/pin/verify',
  authenticate,
  validate([body('pin').isLength({ min: 4, max: 6 }).isNumeric()]),
  async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const result = await db.query<{ pin_hash: string }>('SELECT pin_hash FROM users WHERE id = $1', [req.user!.sub]);
      if (!result.rows[0]?.pin_hash) throw AppError.badRequest('No PIN set');
      const valid = await bcrypt.compare(req.body.pin, result.rows[0].pin_hash);
      if (!valid) throw AppError.unauthorized('Incorrect PIN');
      res.json({ success: true, message: 'PIN verified' });
    } catch (err) { next(err); }
  }
);

export default router;
