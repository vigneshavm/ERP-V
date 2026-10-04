import { injectable, singleton } from "tsyringe";
import {
    createDebitNote,
    findDebitNoteById,
    findDebitNoteByNoteId,
    listDebitNotes,
    listDebitNotesByStatus,
    transitionDebitNoteStatus,
    cancelDebitNote,
    nextDebitNoteId,
    deleteDebitNote,
    type DebitNoteEntry,
    type DebitNoteStatus,
} from "../../../integrations/textilesoft/erpDebitNote.js";

@injectable()
@singleton()
export class DebitNoteRepository {
    async create(data: Parameters<typeof createDebitNote>[0]): Promise<DebitNoteEntry> {
        return createDebitNote(data);
    }

    async findById(id: string, _tenantId?: unknown): Promise<DebitNoteEntry | null> {
        return findDebitNoteById(id);
    }

    async findByNoteId(noteId: string, _tenantId?: unknown): Promise<DebitNoteEntry | null> {
        return findDebitNoteByNoteId(noteId);
    }

    async findAll(_tenantId?: unknown): Promise<DebitNoteEntry[]> {
        return listDebitNotes();
    }

    async findByStatus(status: DebitNoteStatus, _tenantId?: unknown): Promise<DebitNoteEntry[]> {
        return listDebitNotesByStatus(status);
    }

    /**
     * Atomically moves a note from one of `from` to `to`; null if its status changed meanwhile
     * (e.g. a double-clicked Approve), so side effects of a transition can only run once.
     */
    async transitionStatus(_tenantId: unknown, id: string, from: DebitNoteStatus[], to: DebitNoteStatus): Promise<DebitNoteEntry | null> {
        return transitionDebitNoteStatus(id, from, to);
    }

    /** Cancels a debit note (REJECTED no longer counts in the supplier ledger), recording why. */
    async cancel(_tenantId: unknown, id: string, reason: string): Promise<DebitNoteEntry | null> {
        return cancelDebitNote(id, reason);
    }

    async delete(id: string, _tenantId?: unknown): Promise<DebitNoteEntry | null> {
        const note = await findDebitNoteById(id);
        if (!note) return null;
        await deleteDebitNote(id);
        return note;
    }

    /** Next `DN-000001`-style number: highest existing number + 1. */
    async nextNoteId(_tenantId?: unknown): Promise<string> {
        return nextDebitNoteId();
    }
}
