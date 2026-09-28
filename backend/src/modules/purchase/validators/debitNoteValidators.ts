import { body, param } from "express-validator";

export const DEBIT_NOTE_REASONS = ["RETURN", "PRICE_DIFF", "QUALITY", "SHORTAGE", "OTHER"];
export const DEBIT_NOTE_STATUSES = ["DRAFT", "PENDING", "APPROVED", "REJECTED"];

export const createDebitNoteValidators = [
    body("vendorId").isMongoId().withMessage("Supplier is required"),
    body("reason").isIn(DEBIT_NOTE_REASONS).withMessage(`Reason must be one of: ${DEBIT_NOTE_REASONS.join(", ")}`),
    body("items").isArray({ min: 1 }).withMessage("At least one line is required"),
    body("items.*.name").isString().trim().notEmpty().withMessage("Each line needs a description"),
    body("items.*.qty").isFloat({ gt: 0 }).withMessage("Each line's quantity must be more than 0").toFloat(),
    body("items.*.amount").isFloat({ gt: 0 }).withMessage("Each line's amount must be more than 0").toFloat(),
    body("items.*.itemId").optional({ values: "falsy" }).isMongoId().withMessage("Invalid item"),
    body("status").optional({ values: "falsy" }).isIn(["DRAFT", "PENDING", "APPROVED"]).withMessage("New notes can be DRAFT, PENDING or APPROVED"),
    body("date").optional({ values: "falsy" }).isISO8601().withMessage("Date must be a valid date"),
];

export const debitNoteIdValidators = [param("id").isMongoId().withMessage("Invalid debit note id")];

export const changeDebitNoteStatusValidators = [
    ...debitNoteIdValidators,
    body("status").isIn(DEBIT_NOTE_STATUSES).withMessage(`Status must be one of: ${DEBIT_NOTE_STATUSES.join(", ")}`),
];
