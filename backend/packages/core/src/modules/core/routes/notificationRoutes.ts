import express from "express";
import {
    getNotifications,
    markAsRead,
    markAllAsRead
} from "../controllers/NotificationController.js";
import { protect } from '@smarterp/shared/middlewares/authMiddleware.js';

const router = express.Router();

router.get("/", protect, getNotifications);
router.patch("/:id/read", protect, markAsRead);
router.patch("/read-all", protect, markAllAsRead);

export default router;
