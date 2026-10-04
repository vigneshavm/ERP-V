import express from "express";
import auth from "./auth.routes.js";
import user from "./user.routes.js";
import business from "./business.routes.js";
import health from "./health.routes.js";
import refreshToken from "./refreshToken.routes.js";
import report from "./report.routes.js";
import settings from "./settings.routes.js";
import shop from "./shop.routes.js";
import { branchRouter } from "./org.routes.js";
import auditLog from "./auditLog.routes.js";
import admin from "./admin.routes.js";

const router = express.Router();

router.use("/auth", auth);
router.use("/users", user);
router.use("/business", business);
router.use("/health", health);
router.use("/refresh-token", refreshToken);
router.use("/reports", report);
router.use("/settings", settings);
router.use("/shop", shop);
router.use("/branches", branchRouter);
router.use("/audit-logs", auditLog);
router.use("/admin", admin);

export default router;
