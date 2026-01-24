import { Router } from "express";
import { container } from "tsyringe";
import { AuthController } from "../controllers/AuthController.js";
import { protect } from "../middlewares/authMiddleware.js";
import { authLimiter, passwordResetLimiter, forceLogoutLimiter } from "../middlewares/rateLimiter.js";
import { getCsrfToken } from "../middlewares/csrfMiddleware.js";

const router = Router();
const authController = container.resolve(AuthController);

// Public routes with rate limiting
router.post("/register", authLimiter, authController.register);
router.post("/login", authLimiter, authController.login);
router.post("/force-logout", forceLogoutLimiter, authController.forceLogout);
router.post("/forgot-password", passwordResetLimiter, authController.forgotPassword);
router.post("/reset-password", passwordResetLimiter, authController.resetPassword);

// Protected routes
router.get("/profile", protect, authController.getProfile);
router.get("/csrf-token", protect, getCsrfToken); // CSRF token endpoint

export default router;
