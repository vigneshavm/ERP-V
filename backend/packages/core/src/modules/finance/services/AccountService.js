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
import { ChartOfAccountRepository } from '@smarterp/shared/repositories/ChartOfAccountRepository.js';
import { AppError } from '@smarterp/shared/utils/AppError.js';
import { info } from '@smarterp/shared/config/logger.js';
import mongoose from "mongoose";
let AccountService = class AccountService {
    repo;
    constructor(repo) {
        this.repo = repo;
    }
    async getAccounts(tenantId) {
        return this.repo.findAll(tenantId);
    }
    async createAccount(data, tenantId) {
        const { code } = data;
        const existing = await this.repo.findByCode(code, tenantId);
        if (existing)
            throw new AppError("Account code already exists", 400);
        return this.repo.create({ ...data, tenantId: new mongoose.Types.ObjectId(tenantId) });
    }
    async updateAccount(id, tenantId, data) {
        const updated = await this.repo.update(id, tenantId, data);
        if (!updated)
            throw new AppError("Account not found", 404);
        return updated;
    }
    async deleteAccount(id, tenantId) {
        const deleted = await this.repo.delete(id, tenantId);
        if (!deleted)
            throw new AppError("Account not found or restricted (system account)", 404);
    }
    async seedInitialAccounts(tenantId) {
        const initialAccounts = [
            // Assets
            { code: '1000', name: 'Cash', type: 'Asset', subtype: 'Cash', isSystem: true },
            { code: '1100', name: 'Accounts Receivable', type: 'Asset', subtype: 'Accounts Receivable', isSystem: true },
            { code: '1200', name: 'Inventory', type: 'Asset', subtype: 'Inventory', isSystem: true },
            // Liabilities
            { code: '2000', name: 'Accounts Payable', type: 'Liability', subtype: 'Accounts Payable', isSystem: true },
            // Equity
            { code: '3000', name: 'Retained Earnings', type: 'Equity', subtype: 'Equity', isSystem: true },
            // Income
            { code: '4000', name: 'Sales', type: 'Income', subtype: 'Income', isSystem: true },
            // Expenses
            { code: '5000', name: 'Cost of Goods Sold', type: 'Expense', subtype: 'Cost of Goods Sold', isSystem: true },
            { code: '5100', name: 'General & Administrative Expenses', type: 'Expense', subtype: 'Expense', isSystem: true },
        ];
        for (const acc of initialAccounts) {
            const existing = await this.repo.findByCode(acc.code, tenantId);
            if (!existing) {
                await this.repo.create({ ...acc, tenantId: new mongoose.Types.ObjectId(tenantId) });
            }
        }
        info(`Initial Chart of Accounts seeded for tenant ${tenantId}`);
    }
};
AccountService = __decorate([
    injectable(),
    __param(0, inject(ChartOfAccountRepository)),
    __metadata("design:paramtypes", [ChartOfAccountRepository])
], AccountService);
export { AccountService };
