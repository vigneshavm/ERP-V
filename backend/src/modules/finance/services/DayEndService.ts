import { injectable, inject } from "tsyringe";
import { DayEndRepository } from "../../../repositories/DayEndRepository.js";
import { info } from "../../../config/logger.js";
import { ObjectId } from "mongodb";

@injectable()
export class DayEndService {
    constructor(
        @inject(DayEndRepository) private repo: DayEndRepository
    ) { }

    async getDayEndSummary(tenantId: string, dateStr?: string): Promise<any> {
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
        const supplierAlerts: any[] = [];

        for (const supplier of suppliers) {
            const balance = await this.repo.aggregateUnpaidBillsForSupplier(supplier._id);
            const creditLimit = (supplier as any).creditLimit || 0;

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

    async saveDayEndReconciliation(tenantId: string, userId: string, userName: string, data: any): Promise<any> {
        const {
            date, openingCash, cashSales, cashExpenses, expectedCash,
            physicalCash, variance, clearedChequeIds, notes
        } = data;

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

                        await this.repo.updateBankBalance(
                            cheque.accountId.toString(),
                            cheque.type === 'RECEIVED' ? cheque.amount : -cheque.amount,
                            txn._id as ObjectId,
                            session
                        );
                    }
                }
            }

            info(`Day End Reconciliation saved for ${date} by ${userName}`);
            return recon;
        });
    }
}
