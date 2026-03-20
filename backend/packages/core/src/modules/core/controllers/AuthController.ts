import { Request, Response } from 'express';
import crypto from 'crypto';
import { singleton } from 'tsyringe';
import User from '../models/User.js';
import Tenant from '../models/Tenant.js';
import Employee from '@smarterp/core/modules/hr/models/Employee.js'; // Import Employee model
import RefreshToken from '../models/RefreshToken.js';
import { generateToken, generateRandomToken } from '@smarterp/shared/config/jwt.js';
import { sendHtmlEmail, generatePasswordResetEmail } from '@smarterp/shared/utils/emailService.js';
import { generateDeviceId, setDeviceIdCookie, getDeviceIdFromCookie, clearDeviceIdCookie } from '@smarterp/shared/utils/deviceUtils.js';
import { handleLoginAttempt } from '@smarterp/shared/middlewares/rateLimiter.js';
import { info } from '@smarterp/shared/config/logger.js';
import mongoose from 'mongoose';
import { asyncHandler } from '@smarterp/shared/utils/asyncHandler.js';
import { ok, created, paginated } from '@smarterp/shared/utils/response.js';

/**
 * Request interface with authenticated user
 */
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
     * @swagger
     * /api/auth/register:
     *   post:
     *     summary: Register a new shop owner
     *     tags: [Auth]
     *     requestBody:
     *       required: true
     *       content:
     *         application/json:
     *           schema:
     *             type: object
     *             required: [name, email, password, phone]
     *             properties:
     *               name: { type: string }
     *               email: { type: string }
     *               password: { type: string }
     *               phone: { type: string }
     *               shopName: { type: string }
     *               sector: { type: string }
     *     responses:
     *       201:
     *         description: User registered successfully
     *         content:
     *           application/json:
     *             schema:
     *               $ref: '#/components/schemas/AuthResponse'
     *       400:
     *         description: Invalid input or user already exists
     */
    public register = async (req: Request, res: Response): Promise<void> => {
        const { name, email, password, shopName, phone, sector, subdomain, address, city, state, zipCode, gstIn, pan } = req.body;

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

        // Start Transaction for Atomicity
        const session = await User.startSession();
        session.startTransaction();

        // 1. Generate Slug for Tenant
        let generatedSlug = subdomain || shopName.toLowerCase().replace(/[^a-z0-9]/g, '');
        if (!generatedSlug) generatedSlug = `store${Date.now()}`;

        // Check if slug exists
        const existingTenant = await Tenant.findOne({ slug: generatedSlug });
        if (existingTenant) {
            await session.abortTransaction();
            session.endSession();
            res.status(400).json({ message: 'Store URL/Subdomain already taken. Please choose another.' });
            return;
        }

        // Construct Address Object
        const tenantAddress = {
            street: address || '',
            city: city || '',
            state: state || '',
            zipCode: zipCode || '',
            country: 'India'
        };

        // 2. Create Tenant
        const newTenant = await Tenant.create([{
            name: shopName,
            shopName: shopName, // Save shopName explicitly
            slug: generatedSlug,
            ownerId: new mongoose.Types.ObjectId(), // Placeholder, will update after user creation
            status: 'ACTIVE',
            gstNumber: gstIn, // Save GSTIN
            panNumber: pan,   // Save PAN
            address: tenantAddress, // Save Address
            config: {
                theme: {
                    primaryColor: '#007bff',
                    logoUrl: ''
                },
                currency: 'USD' // Default
            }
        }], { session });

        const tenant = newTenant[0];

        // 3. Create User (Owner) linked to Tenant
        const newUser = await User.create([{
            name,
            email,
            password,
            shopName,
            phone,
            sector,
            role: 'owner',
            tenantId: tenant._id,
            gstNumber: gstIn, // Backward compatibility
            shopAddress: `${address}, ${city}, ${state} - ${zipCode}`, // Backward compatibility
            // Subdomain field in User is deprecated in favor of Tenant.slug, but keeping for backward compat if needed
            subdomain: generatedSlug
        }], { session });

        const user = newUser[0];

        // 3b. Create Employee Record for Owner (Auto-onboarding)
        await Employee.create([{
            tenantId: tenant._id,
            name: name,
            role: 'owner', // consistent lowercase
            mobile: phone,
            email: email,
            weeklyOffs: [], // Owners typically work 24/7 or manage their own time
            baseSalary: 0, // Owners take drawings, not usually Salary, but record needed
            wageType: 'MONTHLY',
            isActive: true,
            joiningDate: new Date()
        }], { session });

        // 4. Update Tenant with Owner ID
        tenant.ownerId = user._id as any;
        await tenant.save({ session });

        // Commit Transaction
        await session.commitTransaction();
        session.endSession();

        // Post-creation logic (Tokens, Device ID, etc.)
        if (user) {
            // Generate cryptographically secure deviceId for initial session
            const deviceId = generateDeviceId();
            const userAgent = req.headers['user-agent'] || 'unknown';
            const ipAddress = req.ip || req.socket?.remoteAddress || 'unknown';

            // Use findByIdAndUpdate — not user.save() — so a failure here
            // does not prevent login (user exists, can authenticate normally).
            await User.findByIdAndUpdate(user._id, {
                $set: {
                    activeDeviceId:         deviceId,
                    activeSessionCreatedAt: new Date(),
                    lastLoginIp:            ipAddress,
                    lastLoginUserAgent:     userAgent,
                },
            });

            setDeviceIdCookie(res, deviceId);

            const accessToken = generateToken(user._id.toString());
            const refreshToken = generateRandomToken();

            await RefreshToken.create({
                token: refreshToken,
                user: user._id,
                expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
                createdByIp: req.ip,
                userAgent: req.headers['user-agent'],
            });

            res.status(201).json({
                _id: user._id,
                name: user.name,
                email: user.email,
                tenantId: tenant._id, // Return tenantId for immediate context
                shopName: tenant.shopName || tenant.name, // Return from tenant
                tenantSlug: tenant.slug, // Return slug to frontend
                token: accessToken,
                refreshToken: refreshToken,
            });
        }

    /**
     * @swagger
     * /api/auth/login:
     *   post:
     *     summary: Login existing user
     *     tags: [Auth]
     *     requestBody:
     *       required: true
     *       content:
     *         application/json:
     *           schema:
     *             type: object
     *             required: [email, password]
     *             properties:
     *               email: { type: string }
     *               password: { type: string }
     *     responses:
     *       200:
     *         description: Login successful
     *         content:
     *           application/json:
     *             schema:
     *               $ref: '#/components/schemas/AuthResponse'
     *       401:
     *         description: Invalid credentials
     */
    public login = async (req: Request, res: Response): Promise<void> => {
        const { email, password } = req.body;

        // Validate input
        if (!email || !password) {
            await handleLoginAttempt(req, false);
            res.status(400).json({ message: 'Please enter email and password' });
            return;
        }

        // Find user and populate tenant
        const user = await User.findOne({ email }).populate('tenantId');
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
        // if (user.activeDeviceId && user.activeDeviceId !== existingDeviceId) {
        //     res.status(409).json({
        //         message: 'This account is currently active on another device.',
        //         deviceConflict: true,
        //     });
        //     return;
        // }

        // Determine deviceId to use
        let deviceIdToUse: string;
        if (existingDeviceId && user.activeDeviceId === existingDeviceId) {
            deviceIdToUse = existingDeviceId;
        } else {
            deviceIdToUse = generateDeviceId();
        }

        // Single atomic update — all login state changes in one DB write.
        // Replaces three sequential .save() calls (resetLoginAttempts,
        // recordLogin, activeDeviceId) that could leave the document
        // partially updated if the process crashed between any two saves.
        await User.findByIdAndUpdate(user._id, {
            $set: {
                activeDeviceId:         deviceIdToUse,
                activeSessionCreatedAt: new Date(),
                lastLoginIp:            ipAddress,
                lastLoginUserAgent:     userAgent,
                lastLogin:              new Date(),
                failedLoginAttempts:    0,
                accountLockedUntil:     null,
                lastFailedLogin:        null,
            },
            $push: {
                loginHistory: {
                    $each: [{ timestamp: new Date(), ipAddress, userAgent, success: true }],
                    $slice: -50, // keep last 50 entries
                },
            },
        });

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

        // Get Shop Name from Tenant
        const tenant = user.tenantId as any;
        const shopName = tenant ? (tenant.shopName || tenant.name) : user.shopName;

        // Send response
        res.status(200).json({
            _id: user._id,
            name: user.name,
            email: user.email,
            shopName: shopName,
            gstNumber: user.gstNumber,
            shopAddress: user.shopAddress,
            phone: user.phone,
            role: user.role, // Return user role
            tenantId: tenant ? tenant._id : user.tenantId, // Return only tenantId (extract from populated object)
            token: accessToken,
            refreshToken: refreshToken,
        });

    /**
     * @swagger
     * /api/auth/profile:
     *   get:
     *     summary: Get user profile
     *     tags: [Auth]
     *     security:
     *       - bearerAuth: []
     *     responses:
     *       200:
     *         description: User profile retrieved successfully
     *         content:
     *           application/json:
     *             schema:
     *               $ref: '#/components/schemas/User'
     *       401:
     *         description: Unauthorized
     */
    public getProfile = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
        const user = await User.findById(req.user?._id).select('-password').populate('tenantId');
        if (!user) {
            res.status(404).json({ message: 'User not found' });
            return;
        }
        // Transform tenantId to just the ID if it's a populated object
        const userResponse = user.toObject?.() || user;
        if (userResponse.tenantId && typeof userResponse.tenantId === 'object' && userResponse.tenantId._id) {
            userResponse.tenantId = userResponse.tenantId._id;
        }
        res.status(200).json(userResponse);

    /**
     * @desc Get current auth user alias for /me
     */
    public me = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
        return this.getProfile(req, res);
    };

    /**
     * @swagger
     * /api/auth/profile:
     *   patch:
     *     summary: Update current user profile
     *     tags: [Auth]
     *     security:
     *       - bearerAuth: []
     *     requestBody:
     *       required: true
     *       content:
     *         application/json:
     *           schema:
     *             type: object
     *             properties:
     *               name: { type: string }
     *               email: { type: string }
     *               phone: { type: string }
     *               shopName: { type: string }
     *     responses:
     *       200:
     *         description: Profile updated successfully
     */
    public updateProfile = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
        const userId = req.user?._id;
        const updates = req.body;
        
        // Limit allowed update fields for profile
        const allowedUpdates = ['name', 'email', 'phone', 'shopName'];
        const filteredUpdates: any = {};
        allowedUpdates.forEach(key => {
            if (updates[key] !== undefined) filteredUpdates[key] = updates[key];
        });

        if (Object.keys(filteredUpdates).length === 0) {
            res.status(400).json({ message: 'No valid update fields provided' });
            return;
        }

        const user = await User.findByIdAndUpdate(userId, filteredUpdates, { new: true, runValidators: true }).select('-password');
        if (!user) {
            res.status(404).json({ message: 'User not found' });
            return;
        }

        res.status(200).json({
            message: 'Profile updated successfully',
            user
        });

    /**
     * @swagger
     * /api/auth/forgot-password:
     *   post:
     *     summary: Request password reset link
     *     tags: [Auth]
     *     requestBody:
     *       required: true
     *       content:
     *         application/json:
     *           schema:
     *             type: object
     *             required: [email]
     *             properties:
     *               email: { type: string }
     *     responses:
     *       200:
     *         description: Reset link sent (generic message)
     */
    public forgotPassword = async (req: Request, res: Response): Promise<void> => {
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

        // DEV MODE: Log reset URL to console for easy testing
        if (process.env.NODE_ENV !== 'production') {
            console.log('---------------------------------------------------');
            console.log('🔐 PASSWORD RESET LINK (Dev Mode):');
            console.log(resetUrl);
            console.log('---------------------------------------------------');
        }

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

    /**
     * @swagger
     * /api/auth/force-logout:
     *   post:
     *     summary: Force logout from other devices
     *     tags: [Auth]
     *     requestBody:
     *       required: true
     *       content:
     *         application/json:
     *           schema:
     *             type: object
     *             required: [email, password]
     *             properties:
     *               email: { type: string }
     *               password: { type: string }
     *     responses:
     *       200:
     *         description: Sessions revoked successfully
     *       401:
     *         description: Invalid credentials
     */
    public forceLogout = async (req: Request, res: Response): Promise<void> => {
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

    /**
     * @swagger
     * /api/auth/reset-password:
     *   post:
     *     summary: Reset password using token
     *     tags: [Auth]
     *     requestBody:
     *       required: true
     *       content:
     *         application/json:
     *           schema:
     *             type: object
     *             required: [token, email, password]
     *             properties:
     *               token: { type: string }
     *               email: { type: string }
     *               password: { type: string }
     *     responses:
     *       200:
     *         description: Password reset successful
     *       400:
     *         description: Invalid or expired token
     */
    public resetPassword = async (req: Request, res: Response): Promise<void> => {
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

    /**
     * @swagger
     * /api/auth/logout:
     *   post:
     *     summary: Logout current user
     *     tags: [Auth]
     *     security:
     *       - bearerAuth: []
     *     requestBody:
     *       required: true
     *       content:
     *         application/json:
     *           schema:
     *             type: object
     *             required: [refreshToken]
     *             properties:
     *               refreshToken: { type: string }
     *     responses:
     *       200:
     *         description: Logged out successfully
     */
    public logout = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
        const { refreshToken } = req.body;
        // Two parallel writes — no sequential saves, no race conditions.
        await Promise.all([
            refreshToken
                ? RefreshToken.findOneAndUpdate(
                    { token: refreshToken, user: req.user?._id },
                    { isRevoked: true, revokedAt: new Date() }
                  )
                : Promise.resolve(),
            User.findByIdAndUpdate(
                req.user?._id,
                { $set: { activeDeviceId: null, activeSessionCreatedAt: null } }
            ),
        ]);

        // Clear deviceId cookie
        clearDeviceIdCookie(res);

        res.status(200).json({ message: 'Logged out successfully' });
}
