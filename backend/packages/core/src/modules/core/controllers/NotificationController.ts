import { Request, Response } from "express";
import asyncHandler from "express-async-handler";
import Notification from "../models/Notification.js";

// @desc    Get all notifications for user
// @route   GET /api/notifications
// @access  Private
export const getNotifications = asyncHandler(async (req: Request, res: Response) => {
    const userId = req.user!._id;
    const { unreadOnly } = req.query;

    const query: any = { recipient: userId };
    if (unreadOnly === 'true') {
        query.readAt = null;
    }

    const notifications = await Notification.find(query)
        .sort({ createdAt: -1 })
        .limit(50); // Limit to last 50 for now

    const unreadCount = await Notification.countDocuments({ recipient: userId, readAt: null });

    res.json({
        success: true,
        data: notifications,
        unreadCount
    });
});

// @desc    Mark notification as read
// @route   PATCH /api/notifications/:id/read
// @access  Private
export const markAsRead = asyncHandler(async (req: Request, res: Response) => {
    const notificationId = req.params.id;
    const userId = req.user!._id;

    const notification = await Notification.findOne({ _id: notificationId, recipient: userId });

    if (!notification) {
        res.status(404);
        throw new Error("Notification not found");
    }

    notification.readAt = new Date();
    await notification.save();

    res.json({ success: true, data: notification });
});

// @desc    Mark all notifications as read
// @route   PATCH /api/notifications/read-all
// @access  Private
export const markAllAsRead = asyncHandler(async (req: Request, res: Response) => {
    const userId = req.user!._id;

    await Notification.updateMany(
        { recipient: userId, readAt: null },
        { $set: { readAt: new Date() } }
    );

    res.json({ success: true, message: "All notifications marked as read" });
});
