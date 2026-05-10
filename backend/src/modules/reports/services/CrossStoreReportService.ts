import Invoice from '../../sales/models/Invoice.js';
import Store from '../../store/models/Store.js';
import Item from '../../inventory/models/Item.js';
import { error } from '../../../config/logger.js';

export class CrossStoreReportService {
    static async getConsolidatedDashboard(tenantId: string) {
        try {
            const stores = await Store.find({ tenantId, isActive: true });
            const invoices = await Invoice.find({ tenantId, isDeleted: { $ne: true } });
            const items = await Item.find({ tenantId, isActive: true });

            const storeMetrics = stores.map(store => {
                const storeInvoices = invoices.filter(inv => inv.storeId?.toString() === store._id.toString());
                const totalSales = storeInvoices.reduce((sum, inv) => sum + inv.totalAmount, 0);
                const totalInvoices = storeInvoices.length;

                // Calculate stock value for this store
                let stockValue = 0;
                items.forEach((item: any) => {
                    const level = item.storeLevels?.find((sl: any) => sl.storeId?.toString() === store._id.toString());
                    if (level) {
                        stockValue += (level.qty * item.costPrice);
                    }
                });

                return {
                    storeId: store._id,
                    name: store.name,
                    totalSales,
                    totalInvoices,
                    stockValue
                };
            });

            // Consolidated totals
            const consolidatedSales = storeMetrics.reduce((sum, sm) => sum + sm.totalSales, 0);
            const consolidatedInvoices = storeMetrics.reduce((sum, sm) => sum + sm.totalInvoices, 0);
            const consolidatedStockValue = storeMetrics.reduce((sum, sm) => sum + sm.stockValue, 0);

            return {
                stores: storeMetrics,
                consolidated: {
                    totalSales: consolidatedSales,
                    totalInvoices: consolidatedInvoices,
                    stockValue: consolidatedStockValue
                }
            };
        } catch (err) {
            error(`Error generating cross store report: ${(err as Error).message}`);
            throw err;
        }
    }
}
