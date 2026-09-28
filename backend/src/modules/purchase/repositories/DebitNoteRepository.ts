import { injectable, singleton } from "tsyringe";
import DebitNote from "../models/DebitNote.js";
import { IDebitNote } from "../models/DebitNote.js";
import { Types } from "mongoose";

@injectable()
@singleton()
export class DebitNoteRepository {
    async create(debitNoteData: Partial<IDebitNote>): Promise<IDebitNote> {
        return DebitNote.create(debitNoteData);
    }

    async findById(id: string, tenantId: Types.ObjectId): Promise<IDebitNote | null> {
        return DebitNote.findOne({ _id: id, tenantId });
    }

    async findByNoteId(noteId: string, tenantId: Types.ObjectId): Promise<IDebitNote | null> {
        return DebitNote.findOne({ noteId, tenantId });
    }

    async findAll(tenantId: Types.ObjectId): Promise<IDebitNote[]> {
        return DebitNote.find({ tenantId }).sort({ createdAt: -1 });
    }

    async findByStatus(status: string, tenantId: Types.ObjectId): Promise<IDebitNote[]> {
        return DebitNote.find({ status, tenantId }).sort({ createdAt: -1 });
    }

    async update(id: string, tenantId: Types.ObjectId, updates: Partial<IDebitNote>): Promise<IDebitNote | null> {
        return DebitNote.findOneAndUpdate(
            { _id: id, tenantId },
            updates,
            { new: true, runValidators: true }
        );
    }

    async delete(id: string, tenantId: Types.ObjectId): Promise<IDebitNote | null> {
        return DebitNote.findOneAndDelete({ _id: id, tenantId });
    }

    async countByTenant(tenantId: Types.ObjectId): Promise<number> {
        return DebitNote.countDocuments({ tenantId });
    }

    /**
     * Atomically moves a note from one of `from` to `to`; null if its status changed meanwhile
     * (e.g. a double-clicked Approve), so side effects of a transition can only run once.
     */
    async transitionStatus(tenantId: Types.ObjectId, id: string, from: IDebitNote["status"][], to: IDebitNote["status"]): Promise<IDebitNote | null> {
        return DebitNote.findOneAndUpdate({ _id: id, tenantId, status: { $in: from } }, { $set: { status: to } }, { new: true });
    }

    /** Cancels a debit note (REJECTED no longer counts in the supplier ledger), recording why. */
    async cancel(tenantId: Types.ObjectId, id: Types.ObjectId | string, reason: string): Promise<IDebitNote | null> {
        const note = await DebitNote.findOne({ _id: id, tenantId });
        if (!note) return null;
        note.status = "REJECTED";
        note.notes = [note.notes, reason].filter(Boolean).join(" | ");
        return note.save();
    }

    /**
     * Next `DN-000001`-style number for the tenant: highest existing number + 1. (A count would
     * re-issue a number after a deletion and hit the per-tenant unique index.)
     */
    async nextNoteId(tenantId: Types.ObjectId): Promise<string> {
        const latest = await DebitNote.findOne({ tenantId, noteId: /^DN-\d{6}$/ })
            .sort({ noteId: -1 })
            .select("noteId")
            .lean<{ noteId: string }>();
        const next = latest ? parseInt(latest.noteId.slice(3), 10) + 1 : 1;
        return `DN-${String(next).padStart(6, "0")}`;
    }
}
