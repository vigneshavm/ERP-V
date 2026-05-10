import { Router } from "express";
import { container } from "tsyringe";
import { CustomerController } from "../controllers/CustomerController.js";
import { protect } from "../../../middlewares/authMiddleware.js";
import { requirePermission } from "../../../middlewares/rbacMiddleware.js";
import { auditUpdate, auditDelete } from "../../../middlewares/auditMiddleware.js";

const router = Router();
const customerController = container.resolve(CustomerController);

router.post("/", protect, customerController.addCustomer);
router.get("/", protect, customerController.getAllCustomers);
router.get("/:id/transactions", protect, customerController.getCustomerTransactions);
router.get("/:id", protect, customerController.getCustomerById);
router.put(
    "/:id",
    protect,
    auditUpdate("Customer", "UPDATE_CUSTOMER"),
    customerController.updateCustomer
);
router.delete(
    "/:id",
    protect,
    requirePermission("delete:customer"),
    auditDelete("Customer", "DELETE_CUSTOMER"),
    customerController.deleteCustomer
);

export default router;
