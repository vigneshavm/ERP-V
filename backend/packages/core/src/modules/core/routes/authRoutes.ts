import { Router } from "express";
import { container } from "tsyringe";
import { AuthController } from "../controllers/AuthController.js";
import refreshTokenRoutes from "./refreshTokenRoutes.js";
import { protect } from '@smarterp/shared/middlewares/authMiddleware.js';
import { authLimiter, passwordResetLimiter, forceLogoutLimiter } from '@smarterp/shared/middlewares/rateLimiter.js';
import { getCsrfToken } from '@smarterp/shared/middlewares/csrfMiddleware.js';

const router = Router();
const authController = container.resolve(AuthController);

// Public routes with rate limiting
router.post("/register", authLimiter, authController.register);
router.post("/login", authLimiter, authController.login);
router.post("/force-logout", forceLogoutLimiter, authController.forceLogout);
router.post("/forgot-password", passwordResetLimiter, authController.forgotPassword);
router.post("/reset-password", passwordResetLimiter, authController.resetPassword);
router.post("/logout", protect, authController.logout);

/**
 * @desc Refresh token routes
 * POST /api/auth/refresh-token/ (refresh)
 * POST /api/auth/refresh-token/revoke (revoke)
 * POST /api/auth/refresh-token/revoke-all (revoke-all)
 */
router.use("/refresh-token", refreshTokenRoutes);

// Protected routes
router.get("/profile", protect, authController.getProfile);
router.get("/me", protect, authController.me);
router.patch("/profile", protect, authController.updateProfile);
router.get("/csrf-token", protect, getCsrfToken); // CSRF token endpoint

export default router;
