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
import { DayEndRepository } from '@smarterp/shared/repositories/DayEndRepository.js';
import { info } from '@smarterp/shared/config/logger.js';
let DayEndService = class DayEndService {
    repo;
    constructor(repo) {
        this.repo = repo;
    }
    async getDayEndSummary(tenantId, dateStr) {
        const targetDate = dateStr || new Date().toISOString().split('T')[0];
        const startDate = new Date(targetDate);
        startDate.setHours(0, 0, 0, 0);
        const endDate = new Date(targetDate);
        endDate.setHours(23, 59, 59, 999);
        // Opening cash from last reconciliation
        const lastRecon = await this.repo.getLastReconciliation(tenantId);
        const openingCash = lastRecon ? lastRecon.physicalCash : 0;
        // Cash sales and expenses
        const cashSales = await this.repo.aggregateCashSales(tenantId, startDate, endDate);
        const cashExpenses = await this.repo.aggregateCashExpenses(startDate, endDate);
        const expectedCash = openingCash + cashSales - cashExpenses;
        // Pending cheques
        const pendingCheques = await this.repo.findPendingCheques(tenantId, endDate);
        // Supplier alerts
        const suppliers = await this.repo.findSuppliers(tenantId);
        const supplierAlerts = [];
        for (const supplier of suppliers) {
            const balance = await this.repo.aggregateUnpaidBillsForSupplier(supplier._id);
            const creditLimit = supplier.creditLimit || 0;
            if (creditLimit > 0 && balance >= creditLimit * 0.8) {
                supplierAlerts.push({
                    supplierId: supplier._id,
                    businessName: supplier.businessName,
                    balance, creditLimit,
                    percentage: (balance / creditLimit) * 100
                });
            }
        }
        return { openingCash, cashSales, cashExpenses, expectedCash, pendingCheques, supplierAlerts };
    }
    async saveDayEndReconciliation(tenantId, userId, userName, data) {
        const { date, openingCash, cashSales, cashExpenses, expectedCash, physicalCash, variance, clearedChequeIds, notes } = data;
        return this.repo.executeInTransaction(async (session) => {
            const dateKey = new Date(date).setHours(0, 0, 0, 0);
            const recon = await this.repo.upsertReconciliation(tenantId, dateKey, {
                date: new Date(date), openingCash, cashSales, cashExpenses,
                expectedCash, physicalCash, variance, notes,
                performedBy: userId,
                clearedChequesCount: clearedChequeIds?.length || 0,
                status: 'COMPLETED'
            }, session);
            // Clear cheques and update bank balances
            if (clearedChequeIds && clearedChequeIds.length > 0) {
                for (const chequeId of clearedChequeIds) {
                    const cheque = await this.repo.findChequeById(chequeId, tenantId, session);
                    if (cheque && cheque.status !== 'CLEARED') {
                        await this.repo.updateChequeStatus(chequeId, 'CLEARED', session);
                        const txn = await this.repo.createCashbankTransaction({
                            type: cheque.type === 'RECEIVED' ? 'in' : 'out',
                            amount: cheque.amount,
                            fromAccount: cheque.type === 'RECEIVED' ? 'External' : cheque.accountId.toString(),
                            toAccount: cheque.type === 'RECEIVED' ? cheque.accountId.toString() : 'External',
                            description: `Cheque Cleared (Day End): ${cheque.number}`,
                            reference: cheque.number,
                            date: new Date(),
                            userId,
                        }, session);
                        await this.repo.updateBankBalance(cheque.accountId.toString(), cheque.type === 'RECEIVED' ? cheque.amount : -cheque.amount, txn._id, session);
                    }
                }
            }
            info(`Day End Reconciliation saved for ${date} by ${userName}`);
            return recon;
        });
    }
};
DayEndService = __decorate([
    injectable(),
    __param(0, inject(DayEndRepository)),
    __metadata("design:paramtypes", [DayEndRepository])
], DayEndService);
export { DayEndService };
