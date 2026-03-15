import express from "express";
import {
    createReturn,
    getAllReturns,
    getReturnById,
    deleteReturn,
} from "../controllers/ReturnController.js";
import { protect } from '@smarterp/shared/middlewares/authMiddleware.js';
import { requirePermission } from '@smarterp/shared/middlewares/rbacMiddleware.js';
import { auditDelete } from '@smarterp/shared/middlewares/auditMiddleware.js';

const router = express.Router();

router.post("/", protect, createReturn);
router.get("/", protect, getAllReturns);
router.get("/:id", protect, getReturnById);
router.delete(
    "/:id",
    protect,
    requirePermission("delete:return"),
    auditDelete("Return", "DELETE_RETURN"),
    deleteReturn
);

export default router;
