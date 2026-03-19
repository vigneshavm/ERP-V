import express from 'express';
import { protect } from '@smarterp/shared/middlewares/authMiddleware.js';
import {
    getAccounts,
    createAccount,
    updateAccount,
    deleteAccount,
    seedAccounts
} from '../controllers/AccountController.js';

const router = express.Router();

router.get("/", protect, getAccounts);
router.post("/", protect, createAccount);

// POST /bulk replaces POST /seed.
// "seed" is an implementation detail; "bulk" describes the operation REST-correctly.
router.post("/bulk", protect, seedAccounts);

router.put("/:id", protect, updateAccount);
router.delete("/:id", protect, deleteAccount);

export default router;
