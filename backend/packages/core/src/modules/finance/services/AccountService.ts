import { injectable, inject } from "tsyringe";
import { ChartOfAccountRepository } from '@smarterp/shared/repositories/ChartOfAccountRepository.js';
import { IChartOfAccount } from '@smarterp/shared/interfaces/IChartOfAccount.js';
import { AppError } from '@smarterp/shared/utils/AppError.js';
import { info } from '@smarterp/shared/config/logger.js';
import mongoose from "mongoose";

@injectable()
export class AccountService {
    constructor(
        @inject(ChartOfAccountRepository) private repo: ChartOfAccountRepository
    ) { }

    async getAccounts(tenantId: string): Promise<IChartOfAccount[]> {
        return this.repo.findAll(tenantId);
    }

    async createAccount(data: any, tenantId: string): Promise<IChartOfAccount> {
        const { code } = data;
        const existing = await this.repo.findByCode(code, tenantId);
        if (existing) throw new AppError("Account code already exists", 400);

        return this.repo.create({ ...data, tenantId: new mongoose.Types.ObjectId(tenantId) });
    }

    async updateAccount(id: string, tenantId: string, data: any): Promise<IChartOfAccount> {
        const updated = await this.repo.update(id, tenantId, data);
        if (!updated) throw new AppError("Account not found", 404);
        return updated;
    }

    async deleteAccount(id: string, tenantId: string): Promise<void> {
        const deleted = await this.repo.delete(id, tenantId);
        if (!deleted) throw new AppError("Account not found or restricted (system account)", 404);
    }

    async seedInitialAccounts(tenantId: string): Promise<void> {
        const initialAccounts: any[] = [
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
}
