import { body, param } from "express-validator";

export const createRateRevisionValidators = [
    body("itemId").isMongoId().withMessage("Item is required"),
    body("supplierId").isMongoId().withMessage("Supplier is required"),
    body("batchNumber").isString().trim().notEmpty().withMessage("Batch is required"),
    body("oldRate").isFloat({ min: 0 }).withMessage("Old rate must be 0 or more").toFloat(),
    body("newRate").isFloat({ gt: 0 }).withMessage("New rate must be more than 0").toFloat()
        .custom((newRate, { req }) => newRate > Number(req.body.oldRate)).withMessage("New rate must be higher than old rate"),
    body("affectedQty").isFloat({ gt: 0 }).withMessage("Affected quantity must be more than 0").toFloat(),
    body("reason").optional({ values: "null" }).isString().trim(),
];

export const rateRevisionIdValidators = [param("id").isMongoId().withMessage("Invalid rate revision id")];
