import express from "express";
import { getShopSettings, updateShopSettings } from "../controllers/ShopController.js";
import { protect } from "../middlewares/authMiddleware.js";

const router = express.Router();

router.get("/settings", protect, getShopSettings);
router.put("/settings", protect, updateShopSettings);

export default router;
