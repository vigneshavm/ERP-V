import express from "express";
import {
  getSettings,
  updateSettings,
  updatePassword,
} from "../controllers/SettingsController.js";
import { protect, authorize } from "../../../middlewares/authMiddleware.js";

const router = express.Router();

router.get("/", protect, getSettings);
router.put("/", protect, authorize('owner', 'co-owner', 'admin'), updateSettings);
router.put("/password", protect, updatePassword);

export default router;
