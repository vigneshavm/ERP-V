import { body, param } from "express-validator";

const REFUND_METHODS = ["credit", "cash", "bank_transfer", "adjust_next_bill"];

export const createPurchaseReturnValidators = [
    body("supplierId").isMongoId().withMessage("Supplier is required"),
    body("items").isArray({ min: 1 }).withMessage("At least one item is required"),
    body("items.*.productName").isString().trim().notEmpty().withMessage("Each item needs a product name"),
    body("items.*.quantity").isFloat({ gt: 0 }).withMessage("Each item's quantity must be more than 0").toFloat(),
    body("items.*.rate").isFloat({ min: 0 }).withMessage("Each item's rate must be 0 or more").toFloat(),
    body("items.*.tax").optional({ values: "null" }).isFloat({ min: 0 }).withMessage("Tax must be 0 or more").toFloat(),
    body("items.*.itemId").optional({ values: "falsy" }).isMongoId().withMessage("Invalid item"),
    body("items.*.serializedUnitId").optional({ values: "falsy" }).isMongoId().withMessage("Invalid serialized unit"),
    body("grnId").optional({ values: "falsy" }).isMongoId().withMessage("Invalid GRN"),
    body("billId").optional({ values: "falsy" }).isMongoId().withMessage("Invalid bill"),
    body("refundMethod").optional({ values: "falsy" }).isIn(REFUND_METHODS).withMessage(`Refund method must be one of: ${REFUND_METHODS.join(", ")}`),
    body("bankAccount")
        .if(body("refundMethod").equals("bank_transfer"))
        .isMongoId().withMessage("Choose the bank account the refund went into"),
    body("discount").optional({ values: "null" }).isFloat({ min: 0 }).withMessage("Discount must be 0 or more").toFloat(),
    body("returnDate").optional({ values: "falsy" }).isISO8601().withMessage("Return date must be a valid date"),
];

export const purchaseReturnIdValidators = [
    param("id").isMongoId().withMessage("Invalid purchase return id"),
];
