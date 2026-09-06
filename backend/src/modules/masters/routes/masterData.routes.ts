import { Router } from "express";
import { container } from "tsyringe";
import { MasterDataController } from "../controllers/MasterDataController.js";
import { protect } from "../../../middlewares/authMiddleware.js";

const router = Router();
const masterDataController = container.resolve(MasterDataController);

// "/types" registered before "/:type" so the literal path isn't swallowed as a type value.
router.get("/types", protect, masterDataController.listTypes);
router.get("/:type", protect, masterDataController.list);
router.post("/:type", protect, masterDataController.create);
router.put("/entry/:id", protect, masterDataController.update);
router.delete("/entry/:id", protect, masterDataController.remove);

export default router;
