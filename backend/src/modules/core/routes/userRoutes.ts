import express from "express";
import { getAllUsers, updateUser, deleteUser, updateUserDiscountLimit } from "../controllers/UserController.js";
import { protect } from "../../../middlewares/authMiddleware.js";

const router = express.Router();

router.get("/", protect, getAllUsers);
router.put("/:id", protect, updateUser);
router.delete("/:id", protect, deleteUser);
router.patch("/:id/discount-limit", protect, updateUserDiscountLimit);

export default router;
