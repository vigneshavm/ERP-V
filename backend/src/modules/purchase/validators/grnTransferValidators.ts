import { body, param, query } from "express-validator";

export const createGRNTransferValidators = [
    body("sourceGrnId").isMongoId().withMessage("Source GRN is required"),
    body("fromWarehouseId").isString().trim().notEmpty().withMessage("From warehouse is required"),
    body("toWarehouseId").isString().trim().notEmpty().withMessage("To warehouse is required"),
    body("items").isArray({ min: 1 }).withMessage("At least one item is required"),
    body("items.*.productId").isMongoId().withMessage("Each line needs an item"),
    body("items.*.quantity").isFloat({ gt: 0 }).withMessage("Each line's quantity must be more than 0").toFloat(),
];

export const listGRNTransferValidators = [query("sourceGrnId").optional({ values: "falsy" }).isMongoId().withMessage("Invalid GRN")];
export const grnTransferIdValidators = [param("id").isMongoId().withMessage("Invalid transfer id")];
