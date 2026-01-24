import { Request, Response } from 'express';
import crypto from 'crypto';
import { singleton } from 'tsyringe';
import User from '../models/User.js';
import RefreshToken from '../models/RefreshToken.js';
import { generateToken, generateRefreshToken, generateRandomToken } from '../config/jwt.js';
import { sendHtmlEmail, generatePasswordResetEmail } from '../utils/emailService.js';
import { generateDeviceId, setDeviceIdCookie, getDeviceIdFromCookie } from '../utils/deviceUtils.js';
import { info } from '../config/logger.js';

/**
 * Request interface with authenticated user
 */
interface AuthenticatedRequest extends Request {
    user?: {
        _id: string;
        [key: string]: any;
    };
}

// Simple password strength check for registration
const isStrongPassword = (password: string): boolean => {
    if (!password || password.length < 8) return false;
    const hasUpper = /[A-Z]/.test(password);
    const hasLower = /[a-z]/.test(password);
    const hasNumber = /\d/.test(password);
    const hasSymbol = /[^A-Za-z0-9]/.test(password);
    return hasUpper && hasLower && hasNumber && hasSymbol;
};

const isValidPhone = (phone: string): boolean => /^\d{10}$/.test((phone || '').trim());

@singleton()
export class AuthController {
    /**
     * @desc Register new user (Shop Owner)
     * @route POST /api/auth/register
     */
    public register = async (req: Request, res: Response): Promise<void> => {
        try {
            const { name, email, password, shopName, phone } = req.body;

            // Validate inputs
            if (!name || !email || !password || !phone) {
                res.status(400).json({ message: 'Please fill all required fields' });
                return;
            }

            if (!isValidPhone(phone)) {
                res.status(400).json({ message: 'Phone number must be exactly 10 digits' });
                return;
            }

            if (!isStrongPassword(password)) {
                res.status(400).json({
                    message: 'Password too weak. Use at least 8 characters with uppercase, lowercase, number, and symbol.',
                });
                return;
            }

            // Check if user already exists
            const existingUser = await User.findOne({ email });
            if (existingUser) {
                res.status(400).json({ message: 'User already exists' });
                return;
            }

            // Create new user
            const user = await User.create({
                name,
                email,
                password,
                shopName,
                phone,
            });

            if (user) {
                // Generate cryptographically secure deviceId for initial session
                const deviceId = generateDeviceId();

                // Store audit metadata (IP and UA for logging only)
                const userAgent = req.headers['user-agent'] || 'unknown';
                const ipAddress = req.ip || req.socket?.remoteAddress || 'unknown';

                // Set initial device session
                user.activeDeviceId = deviceId;
                user.activeSessionCreatedAt = new Date();
                user.lastLoginIp = ipAddress;
                user.lastLoginUserAgent = userAgent;
                await user.save();

                // Issue deviceId as secure HttpOnly signed cookie
                setDeviceIdCookie(res, deviceId);

                // Generate tokens
                const accessToken = generateToken(user._id.toString());
                const refreshToken = generateRandomToken();

                // Store refresh token
                await RefreshToken.create({
                    token: refreshToken,
                    user: user._id,
                    expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
                    createdByIp: req.ip,
                    userAgent: req.headers['user-agent'],
                });

                res.status(201).json({
                    _id: user._id,
                    name: user.name,
                    email: user.email,
                    shopName: user.shopName,
                    phone: user.phone,
                    token: accessToken,
                    refreshToken: refreshToken,
                });
            } else {
                res.status(400).json({ message: 'Invalid user data' });
            }
        } catch (error) {
            console.error('Register Error:', error);
            res.status(500).json({ message: 'Server Error', error: (error as Error).message });
        }
    };

    /**
     * @desc Login existing user
     * @route POST /api/auth/login
     */
    public login = async (req: Request, res: Response): Promise<void> => {
        // Import rate limiter handler
        const { handleLoginAttempt } = await import('../middlewares/rateLimiter.js');

        try {
            const { email, password } = req.body;

            // Validate input
            if (!email || !password) {
                await handleLoginAttempt(req, false);
                res.status(400).json({ message: 'Please enter email and password' });
                return;
            }

            // Find user
            const user = await User.findOne({ email });
            if (!user) {
                await handleLoginAttempt(req, false);
                res.status(404).json({ message: 'User not found' });
                return;
            }

            // Check if account is locked
            if (user.isLocked()) {
                res.status(423).json({
                    message: 'Account locked due to too many failed attempts. Try again later.',
                    lockedUntil: user.accountLockedUntil,
                });
                return;
            }

            // Check if account is suspended
            if (user.status === 'suspended') {
                res.status(403).json({
                    message: 'Account suspended. Please contact support.',
                });
                return;
            }

            // Match password
            const isMatch = await user.matchPassword(password);
            if (!isMatch) {
                await user.incLoginAttempts();
                await user.recordFailedLogin(req.ip || req.socket?.remoteAddress || 'unknown', req.headers['user-agent'] || 'unknown');
                await handleLoginAttempt(req, false);
                res.status(401).json({ message: 'Invalid credentials' });
                return;
            }

            // Get deviceId from signed cookie (if exists)
            const existingDeviceId = getDeviceIdFromCookie(req);

            // Store audit metadata
            const userAgent = req.headers['user-agent'] || 'unknown';
            const ipAddress = req.ip || req.socket?.remoteAddress || 'unknown';

            // Check for active session on different device
            if (user.activeDeviceId && user.activeDeviceId !== existingDeviceId) {
                res.status(409).json({
                    message: 'This account is currently active on another device.',
                    deviceConflict: true,
                });
                return;
            }

            // Determine deviceId to use
            let deviceIdToUse: string;
            if (existingDeviceId && user.activeDeviceId === existingDeviceId) {
                deviceIdToUse = existingDeviceId;
            } else {
                deviceIdToUse = generateDeviceId();
            }

            // Reset failed login attempts on successful login
            await user.resetLoginAttempts();

            // Record successful login
            await user.recordLogin(ipAddress, userAgent);

            // Update device session tracking
            user.activeDeviceId = deviceIdToUse;
            user.activeSessionCreatedAt = new Date();
            user.lastLoginIp = ipAddress;
            user.lastLoginUserAgent = userAgent;
            await user.save();

            // Issue deviceId as secure HttpOnly signed cookie
            setDeviceIdCookie(res, deviceIdToUse);

            // Generate tokens
            const accessToken = generateToken(user._id.toString());
            const refreshToken = generateRandomToken();

            // Store refresh token
            await RefreshToken.create({
                token: refreshToken,
                user: user._id,
                expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
                createdByIp: req.ip,
                userAgent: req.headers['user-agent'],
            });

            // Reset rate limit counters on successful login
            await handleLoginAttempt(req, true);

            // Production logging for diagnostics
            if (process.env.NODE_ENV === 'production') {
                info('✅ [LOGIN] User logged in successfully', {
                    userId: user._id,
                    email: user.email,
                    deviceIdPrefix: deviceIdToUse.substring(0, 8) + '...',
                    isNewDevice: deviceIdToUse !== existingDeviceId,
                    ip: ipAddress
                });
            }

            // Send response
            res.status(200).json({
                _id: user._id,
                name: user.name,
                email: user.email,
                shopName: user.shopName,
                gstNumber: user.gstNumber,
                shopAddress: user.shopAddress,
                phone: user.phone,
                token: accessToken,
                refreshToken: refreshToken,
            });
        } catch (error) {
            console.error('Login Error:', error);
            res.status(500).json({ message: 'Server Error', error: (error as Error).message });
        }
    };

    /**
     * @desc Get user profile (Protected)
     * @route GET /api/auth/profile
     */
    public getProfile = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
        try {
            const user = await User.findById(req.user?._id).select('-password');
            if (!user) {
                res.status(404).json({ message: 'User not found' });
                return;
            }
            res.status(200).json(user);
        } catch (error) {
            res.status(500).json({ message: 'Server Error', error: (error as Error).message });
        }
    };

    /**
     * @desc Request password reset link
     * @route POST /api/auth/forgot-password
     */
    public forgotPassword = async (req: Request, res: Response): Promise<void> => {
        try {
            const { email } = req.body;
            if (!email) {
                res.status(400).json({ message: 'Email is required' });
                return;
            }

            const user = await User.findOne({ email });
            if (!user) {
                // Respond success even if user missing to avoid user enumeration
                res.status(200).json({ message: 'If this email exists, a reset link has been sent' });
                return;
            }

            // Generate token
            const resetToken = crypto.randomBytes(32).toString('hex');
            const hashedToken = crypto.createHash('sha256').update(resetToken).digest('hex');

            // Save to user with 1 hour expiry
            user.resetPasswordToken = hashedToken;
            user.resetPasswordExpires = new Date(Date.now() + 60 * 60 * 1000);
            await user.save();

            const baseUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
            const resetUrl = `${baseUrl}/reset-password?token=${resetToken}&email=${encodeURIComponent(email)}`;

            // Generate professional HTML email
            const { html, text } = generatePasswordResetEmail(resetUrl, user.name || 'User');

            const mailSent = await sendHtmlEmail(
                email,
                'Reset your BizzAI password',
                html,
                text
            );

            if (!mailSent) {
                console.error('Failed to send password reset email to:', email);
            }

            // Always return generic success message (security best practice)
            res.status(200).json({ message: 'If this email exists, a reset link has been sent' });
        } catch (error) {
            console.error('Forgot Password Error:', error);
            res.status(500).json({ message: 'Unable to process request. Please try again later.' });
        }
    };

    /**
     * @desc Force logout from previous device and allow new login
     * @route POST /api/auth/force-logout
     * @security HIGH RISK - Strict rate limiting and audit logging required
     */
    public forceLogout = async (req: Request, res: Response): Promise<void> => {
        try {
            const { email, password } = req.body;

            // Generic error message to prevent information leakage
            const genericError = 'Invalid credentials';

            if (!email || !password) {
                res.status(400).json({ message: genericError });
                return;
            }

            // Find and verify user
            const user = await User.findOne({ email });
            if (!user) {
                res.status(401).json({ message: genericError });
                return;
            }

            // Verify password
            const isMatch = await user.matchPassword(password);
            if (!isMatch) {
                res.status(401).json({ message: genericError });
                return;
            }

            // Audit logging (CRITICAL for security monitoring)
            const auditData = {
                userId: user._id,
                email: user.email,
                action: 'FORCE_LOGOUT',
                ip: req.ip || req.socket?.remoteAddress,
                userAgent: req.headers['user-agent'],
                timestamp: new Date(),
            };
            console.warn('SECURITY AUDIT - Force Logout:', JSON.stringify(auditData));

            // Revoke all refresh tokens for this user
            await RefreshToken.updateMany(
                { user: user._id, isRevoked: false },
                { isRevoked: true, revokedAt: new Date() }
            );

            // Clear device session fields
            user.activeDeviceId = null;
            user.activeSessionCreatedAt = null;
            await user.save();

            // Production logging for diagnostics
            if (process.env.NODE_ENV === 'production') {
                info('✅ [FORCE-LOGOUT] Device sessions cleared', {
                    userId: user._id,
                    email: user.email,
                    ip: req.ip || req.socket?.remoteAddress
                });
            }

            res.status(200).json({
                message: 'All sessions revoked successfully. You can now log in from this device.'
            });
        } catch (error) {
            console.error('Force Logout Error:', error);
            res.status(500).json({ message: 'Unable to process request' });
        }
    };

    /**
     * @desc Reset password using token
     * @route POST /api/auth/reset-password
     */
    public resetPassword = async (req: Request, res: Response): Promise<void> => {
        try {
            const { token, email, password } = req.body;
            if (!token || !email || !password) {
                res.status(400).json({ message: 'Token, email and new password are required' });
                return;
            }

            if (!isStrongPassword(password)) {
                res.status(400).json({
                    message: 'Password too weak. Use at least 8 characters with uppercase, lowercase, number, and symbol.',
                });
                return;
            }

            const hashedToken = crypto.createHash('sha256').update(token).digest('hex');

            const user = await User.findOne({
                email,
                resetPasswordToken: hashedToken,
                resetPasswordExpires: { $gt: Date.now() },
            });

            if (!user) {
                res.status(400).json({ message: 'Invalid or expired reset token' });
                return;
            }

            user.password = password;
            user.resetPasswordToken = null;
            user.resetPasswordExpires = null;
            await user.save();

            res.status(200).json({ message: 'Password reset successful. Please log in.' });
        } catch (error) {
            console.error('Reset Password Error:', error);
            res.status(500).json({ message: 'Server Error', error: (error as Error).message });
        }
    };
}
