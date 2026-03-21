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
router.post("/forgot-password", passwordResetLimiter, authController.forgotPassword);
router.post("/reset-password", passwordResetLimiter, authController.resetPassword);
router.post("/logout", protect, authController.logout);
// DELETE /sessions replaces POST /force-logout.
// Force-logging-out revokes all session resources — DELETE is the correct verb.
// The request body carries { password } for re-authentication before mass revocation.
router.delete("/sessions", forceLogoutLimiter, authController.forceLogout);
/**
 * Refresh token routes (mounted at /auth/refresh-token):
 *   POST   /api/auth/refresh-token      — exchange refresh token for new token pair
 *   DELETE /api/auth/refresh-token      — revoke specific token (logout current device)
 *   DELETE /api/auth/refresh-token/all  — revoke all tokens (logout all devices)
 */
router.use("/refresh-token", refreshTokenRoutes);
// Protected routes
router.get("/profile", protect, authController.getProfile);
router.get("/me", protect, authController.me);
router.patch("/profile", protect, authController.updateProfile);
router.get("/csrf-token", protect, getCsrfToken);
export default router;
