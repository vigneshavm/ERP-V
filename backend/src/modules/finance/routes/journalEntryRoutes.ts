import { Router } from "express";
import {
    getJournalEntries,
    createJournalEntry,
    getJournalEntryById
} from "../controllers/JournalEntryController.js";
import { protect } from "../../../middlewares/authMiddleware.js";

const router = Router();

router.get("/", protect, getJournalEntries);
router.post("/", protect, createJournalEntry);
router.get("/:id", protect, getJournalEntryById);

export default router;
