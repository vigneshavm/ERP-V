import express from "express";
import { protect } from "../../../middlewares/authMiddleware.js";
import {
  getUsers,
  patchDiscountLimit,
  putUser,
} from "../controllers/UserSqlController.js";

/** SQL-only: users are Textilesoft's dbo.newuser rows; limits live in dbo.specialcondion. */
const router = express.Router();
router.get("/", protect, getUsers);
router.put("/:id", protect, putUser);
router.patch("/:id/discount-limit", protect, patchDiscountLimit);

export default router;
