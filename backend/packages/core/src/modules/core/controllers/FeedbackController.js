import asyncHandler from "express-async-handler";
import Feedback from "../models/Feedback.js";
export const submitFeedback = asyncHandler(async (req, res) => {
    const { type, feedback, rating, email } = req.body;
    const tenantId = req.user?.tenantId;
    const userId = req.user?._id;
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
