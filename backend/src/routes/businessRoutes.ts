import express from "express";
import { getProfile, updateProfile, syncGoogle } from "../controllers/BusinessController.js";
import { protect } from "../middlewares/authMiddleware.js";

const router = express.Router();

router.get("/profile", protect, getProfile);
router.put("/profile", protect, updateProfile);
router.post("/google/sync", protect, syncGoogle);

export default router;
