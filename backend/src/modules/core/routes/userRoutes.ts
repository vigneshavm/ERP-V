import express from "express";
import { getAllUsers, updateUser, deleteUser, updateFinanceSettings } from "../controllers/UserController.js";
import { protect } from "../../../middlewares/authMiddleware.js";

const router = express.Router();

router.get("/", protect, getAllUsers);
router.post("/finance-settings", protect, updateFinanceSettings);
router.put("/:id", protect, updateUser);
router.delete("/:id", protect, deleteUser);

export default router;
