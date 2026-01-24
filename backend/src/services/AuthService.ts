import { injectable, inject } from "tsyringe";
import { UserRepository } from "../repositories/UserRepository.js";
import { RefreshTokenRepository } from "../repositories/RefreshTokenRepository.js";
import { IUser } from "../interfaces/IUser.js";
import { AppError } from "../utils/AppError.js";
import * as jwtUtils from "../config/jwt.js";
import * as deviceUtils from "../utils/deviceUtils.js";
import { sendHtmlEmail, generatePasswordResetEmail } from "../utils/emailService.js";
import crypto from "crypto";

@injectable()
export class AuthService {
    constructor(
        @inject(UserRepository) private userRepository: UserRepository,
        @inject(RefreshTokenRepository) private refreshTokenRepository: RefreshTokenRepository
    ) { }

    async register(userData: any, reqIp: string, userAgent: string): Promise<{ user: IUser, accessToken: string, refreshToken: string, deviceId: string }> {
        const { name, email, password, shopName, phone } = userData;

        const existingUser = await this.userRepository.findByEmail(email);
        if (existingUser) {
            throw new AppError("User already exists", 400);
        }

        // Logic for strong password check could be here or in validator

        const deviceId = deviceUtils.generateDeviceId();

        const user = await this.userRepository.create({
            name, email, password, shopName, phone,
            activeDeviceId: deviceId,
            activeSessionCreatedAt: new Date(),
            lastLoginIp: reqIp,
            lastLoginUserAgent: userAgent
        });

        const accessToken = jwtUtils.generateToken(user._id.toString());
        const refreshToken = jwtUtils.generateRandomToken();

        await this.refreshTokenRepository.create({
            token: refreshToken,
            user: user._id.toString(),
            expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
            createdByIp: reqIp,
            userAgent: userAgent
        });

        return { user, accessToken, refreshToken, deviceId };
    }

    async login(loginData: any, reqIp: string, userAgent: string, existingDeviceId: string | null): Promise<{ user: IUser, accessToken: string, refreshToken: string, deviceId: string }> {
        const { email, password } = loginData;

        const user = await this.userRepository.findByEmail(email);
        if (!user) {
            throw new AppError("Invalid credentials", 401);
        }

        if (user.isLocked()) {
            throw new AppError(`Account locked until ${user.accountLockedUntil}`, 423);
        }

        if (user.status === 'suspended') {
            throw new AppError("Account suspended", 403);
        }

        const isMatch = await user.matchPassword(password);
        if (!isMatch) {
            await user.incLoginAttempts();
            await user.recordFailedLogin(reqIp, userAgent);
            throw new AppError("Invalid credentials", 401);
        }

        // Device Check
        if (user.activeDeviceId && user.activeDeviceId !== existingDeviceId) {
            // Conflict
            throw new AppError("This account is currently active on another device.", 409);
        }

        let deviceIdToUse = existingDeviceId;
        if (!deviceIdToUse || user.activeDeviceId !== deviceIdToUse) {
            deviceIdToUse = deviceUtils.generateDeviceId();
        }

        await user.resetLoginAttempts();
        await user.recordLogin(reqIp, userAgent);

        user.activeDeviceId = deviceIdToUse;
        user.activeSessionCreatedAt = new Date();
        user.lastLoginIp = reqIp;
        user.lastLoginUserAgent = userAgent;
        await this.userRepository.save(user);

        const accessToken = jwtUtils.generateToken(user._id.toString());
        const refreshToken = jwtUtils.generateRandomToken();

        await this.refreshTokenRepository.create({
            token: refreshToken,
            user: user._id.toString(),
            expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
            createdByIp: reqIp,
            userAgent: userAgent
        });

        return { user, accessToken, refreshToken, deviceId: deviceIdToUse };
    }

    async forgotPassword(email: string): Promise<void> {
        const user = await this.userRepository.findByEmail(email);
        if (!user) return; // Prevent enumeration

        const resetToken = crypto.randomBytes(32).toString("hex");
        const hashedToken = crypto.createHash("sha256").update(resetToken).digest("hex");

        user.resetPasswordToken = hashedToken;
        user.resetPasswordExpires = new Date(Date.now() + 60 * 60 * 1000);
        await this.userRepository.save(user);

        const baseUrl = process.env.FRONTEND_URL || "http://localhost:5173";
        const resetUrl = `${baseUrl}/reset-password?token=${resetToken}&email=${encodeURIComponent(email)}`;

        const { html, text } = generatePasswordResetEmail(resetUrl, user.name);
        await sendHtmlEmail(email, "Reset your BizzAI password", html, text);
    }

    async resetPassword(token: string, email: string, password: string): Promise<void> {
        const hashedToken = crypto.createHash("sha256").update(token).digest("hex");

        // Custom query via model directly or add to repo... let's assume we can use repo or model
        // We need to find user by email + token + expiry
        // Since repo method doesn't exist, we'll fetch by email and verify manually or add method to repo.
        // For strict layered arch, adding to repo is better, but fetching by email is fine for now.
        const user = await this.userRepository.findByEmail(email);

        if (!user ||
            user.resetPasswordToken !== hashedToken ||
            !user.resetPasswordExpires ||
            user.resetPasswordExpires.getTime() < Date.now()) {
            throw new AppError("Invalid or expired reset token", 400);
        }

        user.password = password; // Will be hashed by pre-save hook
        user.resetPasswordToken = null;
        user.resetPasswordExpires = null;
        await this.userRepository.save(user);
    }

    async forceLogout(email: string, password: string, reqIp: string, userAgent: string): Promise<void> {
        const user = await this.userRepository.findByEmail(email);
        if (!user || !(await user.matchPassword(password))) {
            throw new AppError("Invalid credentials", 401);
        }

        await this.refreshTokenRepository.revokeAllForUser(user._id.toString()); // Assuming string ID

        user.activeDeviceId = null;
        user.activeSessionCreatedAt = null;
        await this.userRepository.save(user);
    }

    async getProfile(userId: string): Promise<IUser> {
        const user = await this.userRepository.findById(userId);
        if (!user) {
            throw new AppError("User not found", 404);
        }
        return user;
    }
}
