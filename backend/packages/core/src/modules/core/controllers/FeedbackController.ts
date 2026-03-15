import { Request, Response } from "express";
import asyncHandler from "express-async-handler";
import Feedback from "../models/Feedback.js";

export const submitFeedback = asyncHandler(async (req: Request, res: Response) => {
    const { type, feedback, rating, email } = req.body;
    const tenantId = (req as any).user?.tenantId;
    const userId = (req as any).user?._id;

    const newFeedback = await Feedback.create({
        tenantId,
        userId,
        type,
        feedback,
        rating,
        email
    });

    res.status(201).json({
        success: true,
        data: newFeedback,
        message: "Thank you for your feedback!"
    });
});
