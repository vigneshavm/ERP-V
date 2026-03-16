var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
import { injectable, inject } from "tsyringe";
import { JournalEntryRepository } from '@smarterp/shared/repositories/JournalEntryRepository.js';
import { ChartOfAccountRepository } from '@smarterp/shared/repositories/ChartOfAccountRepository.js';
import { AppError } from '@smarterp/shared/utils/AppError.js';
import { info } from '@smarterp/shared/config/logger.js';
let JournalEntryService = class JournalEntryService {
    repo;
    accountRepo;
    constructor(repo, accountRepo) {
        this.repo = repo;
        this.accountRepo = accountRepo;
    }
    async getEntries(tenantId, filters) {
        const query = {};
        if (tenantId)
            query.tenantId = tenantId;
        if (filters?.startDate || filters?.endDate) {
            query.date = {};
            if (filters.startDate)
                query.date.$gte = new Date(filters.startDate);
            if (filters.endDate)
                query.date.$lte = new Date(filters.endDate);
        }
        if (filters?.accountId)
            query['entries.accountId'] = filters.accountId;
        return this.repo.findAll(query);
    }
    async createEntry(data, tenantId, userId, userName) {
        const { date, description, reference, entries, branchId } = data;
        if (!entries || !Array.isArray(entries) || entries.length < 2) {
            throw new AppError("Journal entry must have at least two line items.", 400);
        }
        const totalDebit = entries.reduce((sum, e) => sum + (Number(e.debit) || 0), 0);
        const totalCredit = entries.reduce((sum, e) => sum + (Number(e.credit) || 0), 0);
        if (Math.abs(totalDebit - totalCredit) > 0.01) {
            throw new AppError(`Entries are unbalanced. Debit: ${totalDebit}, Credit: ${totalCredit}, Diff: ${totalDebit - totalCredit}`, 400);
        }
        const entry = await this.repo.create({
            tenantId, branchId, date: date || new Date(),
            description, reference, entries,
            status: 'POSTED', createdBy: userId,
        });
        info(`Journal Entry created by ${userName || 'Unknown'}: ${description}`);
        return entry;
    }
    async getEntryById(id) {
        const entry = await this.repo.findById(id);
        if (!entry)
            throw new AppError("Journal Entry not found", 404);
        return entry;
    }
    async postEntry(id, tenantId, userId) {
        const entry = await this.repo.findById(id);
        if (!entry)
            throw new AppError("Journal Entry not found", 404);
        if (entry.status === 'POSTED')
            throw new AppError("Entry already posted", 400);
        // Update balances in COA
        for (const line of entry.entries) {
            const amount = (line.debit || 0) - (line.credit || 0);
            if (amount !== 0) {
                // Find account by name or ID (entries store accountId which might be name or ID)
                let account = await this.accountRepo.findById(line.accountId, tenantId);
                if (!account) {
                    account = await this.accountRepo.findByCode(line.accountId, tenantId);
                }
                if (account) {
                    await this.accountRepo.updateBalance(account._id.toString(), amount);
                }
            }
        }
        await this.repo.updateStatus(id, 'POSTED');
        info(`Journal Entry ${id} posted by ${userId}`);
        return { ...entry, status: 'POSTED' };
    }
    async voidEntry(id, tenantId, userId) {
        const entry = await this.repo.findById(id);
        if (!entry)
            throw new AppError("Journal Entry not found", 404);
        if (entry.status === 'VOID')
            throw new AppError("Entry already voided", 400);
        // Reverse balances if it was previously posted
        if (entry.status === 'POSTED') {
            for (const line of entry.entries) {
                const amount = (line.debit || 0) - (line.credit || 0);
                if (amount !== 0) {
                    let account = await this.accountRepo.findById(line.accountId, tenantId);
                    if (!account) {
                        account = await this.accountRepo.findByCode(line.accountId, tenantId);
                    }
                    if (account) {
                        await this.accountRepo.updateBalance(account._id.toString(), -amount);
                    }
                }
            }
        }
        await this.repo.updateStatus(id, 'VOID');
        info(`Journal Entry ${id} voided by ${userId}`);
        return { ...entry, status: 'VOID' };
    }
};
JournalEntryService = __decorate([
    injectable(),
    __param(0, inject(JournalEntryRepository)),
    __param(1, inject(ChartOfAccountRepository)),
    __metadata("design:paramtypes", [JournalEntryRepository,
        ChartOfAccountRepository])
], JournalEntryService);
export { JournalEntryService };
