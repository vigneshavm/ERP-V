import express from "express";
import {
    createLoan,
    getLoans,
    getLoanById,
    recordEmiPayment,
} from "../controllers/LoanController.js";
import { protect } from '@smarterp/shared/middlewares/authMiddleware.js';

const router = express.Router();

router.use(protect); // All routes are protected

router.route("/")
    .post(createLoan)
    .get(getLoans);

router.route("/:id")
    .get(getLoanById);

router.route("/:id/payments")
    .post(recordEmiPayment);

export default router;
