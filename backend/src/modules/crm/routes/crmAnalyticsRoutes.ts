import { Router } from "express";
import { getCustomer360, getMarketingAudience, getCRMDashboardSummary } from "../controllers/CustomerAnalyticsController.js";
import { protect } from "../../../middlewares/authMiddleware.js";

const router = Router();

router.use(protect);

router.get("/customer-360/:customerId", getCustomer360);
router.get("/marketing-audience", getMarketingAudience);
router.get("/dashboard-summary", getCRMDashboardSummary);

export default router;
