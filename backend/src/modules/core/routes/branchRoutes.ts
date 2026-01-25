import express from "express";
import { getAllBranches, createBranch, getBranch, updateBranch, deleteBranch } from "../controllers/BranchController.js";
import { protect } from "../../../middlewares/authMiddleware.js";

const router = express.Router();

router.use(protect); // All routes protected

router.route("/")
    .get(getAllBranches)
    .post(createBranch);

router.route("/:id")
    .get(getBranch)
    .put(updateBranch)
    .delete(deleteBranch);

export default router;
