import express from "express";
import {
    getDebitNotes,
    getDebitNoteById,
    createDebitNote,
    updateDebitNoteStatus,
    deleteDebitNote
} from "../controllers/DebitNoteController.js";
import { protect } from "../../../middlewares/authMiddleware.js";

const router = express.Router();

router.get("/", protect, getDebitNotes);
router.get("/:id", protect, getDebitNoteById);
router.post("/", protect, createDebitNote);
router.put("/:id/status", protect, updateDebitNoteStatus);
router.delete("/:id", protect, deleteDebitNote);

export default router;
