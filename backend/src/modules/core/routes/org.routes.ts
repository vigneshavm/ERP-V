import { Router } from "express";
import { protect, authorize } from "../../../middlewares/authMiddleware.js";
import {
  getBranches,
  getBranch,
  createBranch,
  updateBranch,
  deleteBranch,
  getCompanies,
  postCompany,
  putCompany,
  removeCompany,
  getWarehouses,
  postWarehouse,
  putWarehouse,
  removeWarehouse,
  getCounters,
  postCounter,
  removeCounter,
  putCounterSettings,
} from "../controllers/OrgController.js";

// Company / branch / warehouse / counter masters (Textilesoft SQL tables). Changes: owners only.
const owner = authorize("owner", "co-owner");

/** Mounted at /api/branches and /api/stores (both screens show the same branch list). */
export const branchRouter = Router();
branchRouter.use(protect);
branchRouter.get("/", getBranches);
branchRouter.post("/", owner, createBranch);
branchRouter.get("/:id", getBranch);
branchRouter.put("/:id", owner, updateBranch);
branchRouter.delete("/:id", owner, deleteBranch);

export const companyRouter = Router();
companyRouter.use(protect);
companyRouter.get("/", getCompanies);
companyRouter.post("/", owner, postCompany);
companyRouter.put("/:code", owner, putCompany);
companyRouter.delete("/:code", owner, removeCompany);

export const warehouseRouter = Router();
warehouseRouter.use(protect);
warehouseRouter.get("/", getWarehouses);
warehouseRouter.post("/", owner, postWarehouse);
warehouseRouter.put("/:code", owner, putWarehouse);
warehouseRouter.delete("/:code", owner, removeWarehouse);

export const counterRouter = Router();
counterRouter.use(protect);
counterRouter.get("/", getCounters);
counterRouter.post("/", owner, postCounter);
counterRouter.delete("/:name", owner, removeCounter);
counterRouter.put("/:name/settings", owner, putCounterSettings);
