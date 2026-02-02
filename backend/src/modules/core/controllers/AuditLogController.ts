import { Request, Response } from "express";
import asyncHandler from "express-async-handler";
import AuditLog from "../models/AuditLog.js";

// @desc    Get audit logs
// @route   GET /api/audit-logs
// @access  Private (Admin/Owner)
export const getAuditLogs = asyncHandler(async (req: Request, res: Response) => {
    const tenantId = (req as any).user.tenantId;
    const { entity, action, user, startDate, endDate, limit = 50, page = 1 } = req.query;

    const query: any = { tenantId };

    if (entity) query.entity = entity;
    if (action) query.action = action;
    if (user) query.user = user;

    if (startDate || endDate) {
        query.createdAt = {};
        if (startDate) query.createdAt.$gte = new Date(startDate as string);
        if (endDate) query.createdAt.$lte = new Date(endDate as string);
    }

    const pageSize = Number(limit);
    const skip = (Number(page) - 1) * pageSize;

    const logs = await AuditLog.find(query)
        .populate('user', 'name email')
        .sort({ createdAt: -1 })
        .limit(pageSize)
        .skip(skip);

    const total = await AuditLog.countDocuments(query);

    res.json({
        success: true,
        data: logs,
        pagination: {
            page: Number(page),
            limit: pageSize,
            total,
            pages: Math.ceil(total / pageSize)
        }
    });
});
