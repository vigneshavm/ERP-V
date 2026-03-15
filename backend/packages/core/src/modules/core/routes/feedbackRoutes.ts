import express from "express";
import { submitFeedback } from "../controllers/FeedbackController.js";
import { protect } from '@smarterp/shared/middlewares/authMiddleware.js';

const router = express.Router();

router.post("/", protect, submitFeedback);

export default router;
