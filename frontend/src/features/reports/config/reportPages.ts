import type React from 'react';
import type { ComingSoonReportType, ReportType } from './reportViews';
import SalesReport from '../sales/SalesReport';
import ReturnsAuditReport from '../returns/ReturnsAuditReport';
import ExpenseAnalysisReport from '../expenses/ExpenseAnalysisReport';
import DayBookReport from '../finance/DayBookReport';
import AllTransactionsReport from '../finance/AllTransactionsReport';
import CashFlowReport from '../finance/CashFlowReport';
import ProfitLossReport from '../finance/ProfitLossReport';
import BillWiseProfitReport from '../finance/BillWiseProfitReport';
import PartyStatementReport from '../PartyStatementReport';
import PartyPnlReport from '../PartyPnlReport';
import AllPartiesReport from '../AllPartiesReport';
import PartyItemsReport from '../PartyItemsReport';
import SalesByPartyReport from '../SalesByPartyReport';
import PurchaseByPartyReport from '../PurchaseByPartyReport';
import SalesByPartyGroupReport from '../SalesByPartyGroupReport';
import PurchaseByPartyGroupReport from '../PurchaseByPartyGroupReport';
import StockStatusReport from '../StockStatusReport';
import LowStockReport from '../LowStockReport';
import DeadStockReport from '../DeadStockReport';
import CityWiseStockReport from '../CityWiseStockReport';
import RackWiseStockReport from '../RackWiseStockReport';
import Gstr1Report from '../gst/Gstr1Report';
import Gstr3bReport from '../gst/Gstr3bReport';
import Gstr9Report from '../gst/Gstr9Report';
import PurchaseGstRegister from '../gst/PurchaseGstRegister';
import BrandWiseSalesReport from '../BrandWiseSalesReport';
import CategoryWiseSalesReport from '../CategoryWiseSalesReport';
import CounterWiseSalesReport from '../CounterWiseSalesReport';
import SalesCounterWiseSalesReport from '../SalesCounterWiseSalesReport';
import HourlyBillingReport from '../HourlyBillingReport';
import DailySalesReport from '../DailySalesReport';
import ProductWiseSalesReport from '../ProductWiseSalesReport';

/**
 * Report type → page. Every page is a ReportPageShell reading a report API; none has a sample-data fallback.
 * `satisfies` makes a missing page for any non-coming-soon type a compile error.
 */
export const REPORT_PAGES = {
    REPORT_SALES: SalesReport,
    REPORT_RETURNS_AUDIT: ReturnsAuditReport,
    REPORT_EXPENSE_ANALYSIS: ExpenseAnalysisReport,
    DAY_BOOK: DayBookReport,
    REPORT_ALL_TRANSACTIONS: AllTransactionsReport,
    REPORT_CASH_FLOW: CashFlowReport,
    PROFIT_LOSS: ProfitLossReport,
    REPORT_BILL_PROFIT: BillWiseProfitReport,
    REPORT_PARTY_STATEMENT: PartyStatementReport,
    REPORT_PARTY_PNL: PartyPnlReport,
    REPORT_ALL_PARTIES: AllPartiesReport,
    REPORT_PARTY_ITEMS: PartyItemsReport,
    REPORT_SALES_BY_PARTY: SalesByPartyReport,
    REPORT_PURCHASE_BY_PARTY: PurchaseByPartyReport,
    REPORT_SALES_BY_PARTY_GROUP: SalesByPartyGroupReport,
    REPORT_PURCHASE_BY_PARTY_GROUP: PurchaseByPartyGroupReport,
    REPORT_STOCK_STATUS: StockStatusReport,
    REPORT_LOW_STOCK: LowStockReport,
    REPORT_DEAD_STOCK: DeadStockReport,
    REPORT_CITY_WISE_STOCK: CityWiseStockReport,
    REPORT_RACK_WISE_STOCK: RackWiseStockReport,
    REPORT_GSTR1: Gstr1Report,
    REPORT_GSTR3B: Gstr3bReport,
    REPORT_GSTR9: Gstr9Report,
    REPORT_PURCHASE_GST_REGISTER: PurchaseGstRegister,
    REPORT_BRAND_WISE: BrandWiseSalesReport,
    REPORT_CATEGORY_WISE: CategoryWiseSalesReport,
    REPORT_COUNTER_WISE: CounterWiseSalesReport,
    REPORT_SALES_COUNTER_WISE: SalesCounterWiseSalesReport,
    REPORT_HOURLY_BILLING: HourlyBillingReport,
    REPORT_DAILY_SALES: DailySalesReport,
    REPORT_PRODUCT_WISE: ProductWiseSalesReport,
} satisfies Record<Exclude<ReportType, ComingSoonReportType>, React.ComponentType>;

export const reportPageFor = (view: ReportType): React.ComponentType | null =>
    (REPORT_PAGES as Partial<Record<ReportType, React.ComponentType>>)[view] ?? null;
