import { Router } from "express";
import { createGRN, getGRNs } from "../controllers/GRNController.js";
import { protect } from "../../../middlewares/authMiddleware.js";

const router = Router();

router.use(protect);

router.post("/", createGRN);
router.get("/", getGRNs);

export default router;
