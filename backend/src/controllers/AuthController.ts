import { Request, Response, NextFunction } from "express";
import { autoInjectable, inject } from "tsyringe";
import { AuthService } from "../services/AuthService.js";
import * as deviceUtils from "../utils/deviceUtils.js";
import { handleLoginAttempt } from "../middlewares/rateLimiter.js";

@autoInjectable()
export class AuthController {
    constructor(@inject(AuthService) private authService: AuthService) { }

    register = async (req: Request, res: Response, next: NextFunction) => {
        try {
            const ip = req.ip || req.connection.remoteAddress || 'unknown';
            const userAgent = (req.headers["user-agent"] as string) || "unknown";

            const result = await this.authService.register(req.body, ip, userAgent);

            deviceUtils.setDeviceIdCookie(res, result.deviceId);

            res.status(201).json({
                _id: result.user._id,
                name: result.user.name,
                email: result.user.email,
                shopName: result.user.shopName,
                phone: result.user.phone,
                token: result.accessToken,
                refreshToken: result.refreshToken,
            });
        } catch (error) {
            next(error);
        }
    }

    login = async (req: Request, res: Response, next: NextFunction) => {
        try {
            const ip = req.ip || req.connection.remoteAddress || 'unknown';
            const userAgent = (req.headers["user-agent"] as string) || "unknown";
            const existingDeviceId = deviceUtils.getDeviceIdFromCookie(req);

            try {
                const result = await this.authService.login(req.body, ip, userAgent, existingDeviceId);

                deviceUtils.setDeviceIdCookie(res, result.deviceId);
                await handleLoginAttempt(req, true);

                res.status(200).json({
                    _id: result.user._id,
                    name: result.user.name,
                    email: result.user.email,
                    shopName: result.user.shopName,
                    gstNumber: result.user.gstNumber,
                    shopAddress: result.user.shopAddress,
                    phone: result.user.phone,
                    token: result.accessToken,
                    refreshToken: result.refreshToken,
                });
            } catch (err) {
                await handleLoginAttempt(req, false);
                throw err;
            }
        } catch (error) {
            next(error);
        }
    }

    getProfile = async (req: Request, res: Response, next: NextFunction) => {
        try {
            // req.user is set by auth middleware
            const userId = (req as any).user._id;
            const user = await this.authService.getProfile(userId);
            // Don't send password
            const userObj = user.toObject();
            delete userObj.password;
            res.status(200).json(userObj);
        } catch (error) {
            next(error);
        }
    }

    forgotPassword = async (req: Request, res: Response, next: NextFunction) => {
        try {
            const { email } = req.body;
            await this.authService.forgotPassword(email);
            res.status(200).json({ message: "If this email exists, a reset link has been sent" });
        } catch (error) {
            next(error);
        }
    }

    resetPassword = async (req: Request, res: Response, next: NextFunction) => {
        try {
            const { token, email, password } = req.body;
            await this.authService.resetPassword(token, email, password);
            res.status(200).json({ message: "Password reset successful. Please log in." });
        } catch (error) {
            next(error);
        }
    }

    forceLogout = async (req: Request, res: Response, next: NextFunction) => {
        try {
            const { email, password } = req.body;
            const ip = req.ip || req.connection.remoteAddress || 'unknown';
            const userAgent = (req.headers["user-agent"] as string) || "unknown";

            await this.authService.forceLogout(email, password, ip, userAgent);
            res.status(200).json({
                message: "All sessions revoked successfully. You can now log in from this device."
            });
        } catch (error) {
            next(error);
        }
    }
}
