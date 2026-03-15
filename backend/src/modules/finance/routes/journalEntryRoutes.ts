import express from 'express';
import { 
    getJournalEntries, 
    createJournalEntry, 
    getJournalEntryById,
    postJournalEntry,
    voidJournalEntry
} from '../controllers/JournalEntryController.js';
import { protect } from "../../../middlewares/authMiddleware.js";

const router = express.Router();

router.get("/", protect, getJournalEntries);
router.post("/", protect, createJournalEntry);
router.get("/:id", protect, getJournalEntryById);
router.post("/:id/post", protect, postJournalEntry);
router.post("/:id/void", protect, voidJournalEntry);

export default router;
