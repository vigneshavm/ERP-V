var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
import { injectable, inject } from "tsyringe";
import { UserRepository } from '@smarterp/shared/repositories/UserRepository.js';
import { RefreshTokenRepository } from '@smarterp/shared/repositories/RefreshTokenRepository.js';
import { AppError } from '@smarterp/shared/utils/AppError.js';
import * as jwtUtils from '@smarterp/shared/config/jwt.js';
import * as deviceUtils from '@smarterp/shared/utils/deviceUtils.js';
import { sendHtmlEmail, generatePasswordResetEmail } from '@smarterp/shared/utils/emailService.js';
import crypto from "crypto";
let AuthService = class AuthService {
    userRepository;
    refreshTokenRepository;
    constructor(userRepository, refreshTokenRepository) {
        this.userRepository = userRepository;
        this.refreshTokenRepository = refreshTokenRepository;
    }
    async register(userData, reqIp, userAgent) {
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
    async login(loginData, reqIp, userAgent, existingDeviceId) {
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
    async forgotPassword(email) {
        const user = await this.userRepository.findByEmail(email);
        if (!user)
            return; // Prevent enumeration
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
    async resetPassword(token, email, password) {
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
    async forceLogout(email, password, _reqIp, _userAgent) {
        const user = await this.userRepository.findByEmail(email);
        if (!user || !(await user.matchPassword(password))) {
            throw new AppError("Invalid credentials", 401);
        }
        await this.refreshTokenRepository.revokeAllForUser(user._id.toString()); // Assuming string ID
        user.activeDeviceId = null;
        user.activeSessionCreatedAt = null;
        await this.userRepository.save(user);
    }
    async getProfile(userId) {
        const user = await this.userRepository.findById(userId);
        if (!user) {
            throw new AppError("User not found", 404);
        }
        return user;
    }
};
AuthService = __decorate([
    injectable(),
    __param(0, inject(UserRepository)),
    __param(1, inject(RefreshTokenRepository)),
    __metadata("design:paramtypes", [UserRepository,
        RefreshTokenRepository])
], AuthService);
export { AuthService };
