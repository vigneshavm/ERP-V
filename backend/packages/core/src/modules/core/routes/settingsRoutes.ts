import express from "express";
import {
  getSettings,
  updateSettings,
  updatePassword,
} from "../controllers/SettingsController.js";
import { protect } from '@smarterp/shared/middlewares/authMiddleware.js';

const router = express.Router();

router.get("/", protect, getSettings);
router.put("/", protect, updateSettings);
router.put("/password", protect, updatePassword);

export default router;
