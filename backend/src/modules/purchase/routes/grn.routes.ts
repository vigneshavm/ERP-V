import { Router } from "express";
import { container } from "tsyringe";
import { GRNController } from "../controllers/GRNController.js";
import { protect } from "../../../middlewares/authMiddleware.js";

const router = Router();
const grnController = container.resolve(GRNController);

router.use(protect);

router.post("/", grnController.createGRN);
router.get("/", grnController.getGRNs);

export default router;
