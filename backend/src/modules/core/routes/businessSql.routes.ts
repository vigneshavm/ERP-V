import express from "express";
import {
  getProfile,
  updateProfile,
  getSetupStatus,
} from "../controllers/BusinessController.js";
import { protect } from "../../../middlewares/authMiddleware.js";

/** SQL-only subset of /api/business: company details come from Textilesoft's companydetail. */
const router = express.Router();
router.get("/profile", protect, getProfile);
router.put("/profile", protect, updateProfile);
router.get("/setup", protect, getSetupStatus);

export default router;
