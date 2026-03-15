import { Router } from "express";
import controller from "../controllers/PersonalTransactionController.js";
import { protect } from '@smarterp/shared/middlewares/authMiddleware.js';
import { cacheMiddleware } from '@smarterp/shared/config/cache.js';

const router = Router();

router.get("/", protect, cacheMiddleware(300), controller.getAll);
router.post("/", protect, controller.create);
router.put("/:id", protect, controller.update);
router.delete("/:id", protect, controller.delete);

export default router;
