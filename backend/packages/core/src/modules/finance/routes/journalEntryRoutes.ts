import express from 'express';
import {
    getJournalEntries,
    createJournalEntry,
    getJournalEntryById,
    postJournalEntry,
    voidJournalEntry
} from '../controllers/JournalEntryController.js';
import { protect } from '@smarterp/shared/middlewares/authMiddleware.js';

const router = express.Router();

router.get("/", protect, getJournalEntries);
router.post("/", protect, createJournalEntry);
router.get("/:id", protect, getJournalEntryById);

// PATCH /:id/status replaces POST /:id/post and POST /:id/void.
// Request body: { status: "posted" | "voided" }
// The controller dispatches to the correct handler based on the status value.
router.patch("/:id/status", protect, (req, res, next) => {
    const { status } = req.body;
    if (status === "posted") return postJournalEntry(req, res, next);
    if (status === "voided") return voidJournalEntry(req, res, next);
    return res.status(400).json({ message: 'status must be "posted" or "voided"' });
});

export default router;
