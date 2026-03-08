import { injectable, inject } from "tsyringe";
import { JournalEntryRepository } from "../../../repositories/JournalEntryRepository.js";
import { AppError } from "../../../utils/AppError.js";
import { info } from "../../../config/logger.js";

@injectable()
export class JournalEntryService {
    constructor(
        @inject(JournalEntryRepository) private repo: JournalEntryRepository
    ) { }

    async getEntries(tenantId?: string, filters?: { startDate?: string; endDate?: string; accountId?: string }): Promise<any[]> {
        const query: any = {};
        if (tenantId) query.tenantId = tenantId;
        if (filters?.startDate || filters?.endDate) {
            query.date = {};
            if (filters.startDate) query.date.$gte = new Date(filters.startDate);
            if (filters.endDate) query.date.$lte = new Date(filters.endDate);
        }
        if (filters?.accountId) query['entries.accountId'] = filters.accountId;

        return this.repo.findAll(query);
    }

    async createEntry(data: any, tenantId: string, userId: string, userName?: string): Promise<any> {
        const { date, description, reference, entries, branchId } = data;

        if (!entries || !Array.isArray(entries) || entries.length < 2) {
            throw new AppError("Journal entry must have at least two line items.", 400);
        }

        const totalDebit = entries.reduce((sum: number, e: any) => sum + (Number(e.debit) || 0), 0);
        const totalCredit = entries.reduce((sum: number, e: any) => sum + (Number(e.credit) || 0), 0);

        if (Math.abs(totalDebit - totalCredit) > 0.01) {
            throw new AppError(
                `Entries are unbalanced. Debit: ${totalDebit}, Credit: ${totalCredit}, Diff: ${totalDebit - totalCredit}`,
                400
            );
        }

        const entry = await this.repo.create({
            tenantId, branchId, date: date || new Date(),
            description, reference, entries,
            status: 'POSTED', createdBy: userId,
        });

        info(`Journal Entry created by ${userName || 'Unknown'}: ${description}`);
        return entry;
    }

    async getEntryById(id: string): Promise<any> {
        const entry = await this.repo.findById(id);
        if (!entry) throw new AppError("Journal Entry not found", 404);
        return entry;
    }
}
