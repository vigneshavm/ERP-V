import { body } from "express-validator";

/**
 * Pilot for the backend's first express-validator wiring (the dependency was already installed
 * but unused). Only checks request shape; supplier existence/credit/status checks stay in
 * PurchaseService since they need a DB read.
 */
export const createPurchaseValidators = [
    body("p_vendor_id").isString().trim().notEmpty().withMessage("Supplier (Vendor) is required"),
    body("items").isArray({ min: 1 }).withMessage("At least one item is required"),
    body("items.*.quantity").isNumeric().withMessage("Each item's quantity must be a number"),
    body("items.*.rate").isNumeric().withMessage("Each item's rate must be a number"),
    body("details").isObject().withMessage("Purchase details are required"),
];
