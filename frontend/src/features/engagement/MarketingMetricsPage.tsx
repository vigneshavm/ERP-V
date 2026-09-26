import React from 'react';
import { Megaphone, MessageCircle, UserPlus, Users } from 'lucide-react';
import { formatNumber } from '@/utils/formatters';
import {
    ReportAnalysisCard, ReportAnalysisGrid, ReportKpiGrid, ReportPeriodPicker, ReportRankList, ReportTable, useReportData, useReportPeriod,
} from '../reports/components';
import type { ReportColumn } from '../reports/components';
import { FinancePage } from '../financial/overview/FinancePage';
import { rupees0 } from '../financial/overview/cashBankFormat';
import type { MarketingMetricsData } from './engagementTypes';

type SpendRow = MarketingMetricsData['spend']['entries'][number];

const SEGMENT_LABEL: Record<string, string> = { NEW: 'New', OCCASIONAL: 'Occasional', REGULAR: 'Regular', LOYAL: 'Loyal', HIGH_VALUE: 'High value', INACTIVE: 'Inactive' };

const SPEND_COLUMNS: ReportColumn<SpendRow>[] = [
    { key: 'date', header: 'Date', type: 'date', value: r => r.date },
    { key: 'expenseNo', header: 'Expense', value: r => r.expenseNo, subtext: r => r.description || null },
    { key: 'amount', header: 'Amount', type: 'currency', value: r => r.amount },
];

/**
 * Growth › Marketing metrics: what the ERP actually records about marketing: spend (expenses in the Marketing
 * category), campaigns, new customers, consent and segments. No ROI: no bill records a campaign or channel, so
 * revenue can't be attributed. Replaced MarketingMetrics, whose spend, ROI, funnel and branches were hardcoded.
 */
const MarketingMetricsPage: React.FC = () => {
    const period = useReportPeriod('this-month');
    const { from, to } = period.period;
    const { data, loading, error, reload } = useReportData<MarketingMetricsData>('/api/reports/engagement/marketing', { from, to }, { enabled: Boolean(from && to) });

    return (
        <FinancePage
            section="Marketing"
            title="Marketing metrics"
            subtitle="Marketing spend and your customer base, from ERP records"
            basis="Spend = expenses recorded under the Marketing category. Return on marketing isn't shown because no bill records which campaign or channel brought the customer; spend and sales are listed side by side only."
            actions={<ReportPeriodPicker value={period} />}
            loading={loading}
            error={error}
            hasData={Boolean(data)}
            onRefresh={() => reload(true)}
        >
            {data && (
                <>
                    <ReportKpiGrid items={[
                        { label: 'Marketing spend', value: rupees0(data.spend.total), sub: `${formatNumber(data.spend.count)} Marketing expenses`, icon: <Megaphone className="w-4 h-4" /> },
                        { label: 'New customers', value: formatNumber(data.newCustomers), sub: 'Added in the period', icon: <UserPlus className="w-4 h-4" /> },
                        { label: 'WhatsApp campaigns', value: formatNumber(data.campaigns), sub: data.connections.whatsapp ? 'WhatsApp account connected' : 'Not sent: no WhatsApp account connected', icon: <MessageCircle className="w-4 h-4" /> },
                        { label: 'Opted in to marketing', value: formatNumber(data.optIn.any), sub: `WhatsApp ${formatNumber(data.optIn.whatsapp)} · SMS ${formatNumber(data.optIn.sms)} · email ${formatNumber(data.optIn.email)}`, icon: <Users className="w-4 h-4" /> },
                    ]} />
                    <ReportAnalysisGrid>
                        <ReportAnalysisCard title="Customers by segment" subtitle="All customers, as segmented in the customer master" autoHeight empty={data.segments.length === 0}>
                            <ReportRankList items={data.segments.map(s => ({ label: SEGMENT_LABEL[s.segment] ?? s.segment, value: s.customers, display: formatNumber(s.customers) }))} />
                        </ReportAnalysisCard>
                        <ReportAnalysisCard title="Spend and sales in the period" subtitle="Side by side; not attributed" autoHeight>
                            <dl className="grid grid-cols-2 gap-x-6 gap-y-2 text-sm tabular-nums">
                                <dt className="text-slate-500">Marketing spend</dt><dd className="text-right font-bold">{rupees0(data.spend.total)}</dd>
                                <dt className="text-slate-500">ERP sales</dt><dd className="text-right">{rupees0(data.erpSales.value)}</dd>
                                <dt className="text-slate-500">ERP bills</dt><dd className="text-right">{formatNumber(data.erpSales.bills)}</dd>
                                <dt className="text-slate-500">Spend per new customer</dt><dd className="text-right">{data.newCustomers ? rupees0(data.spend.total / data.newCustomers) : '—'}</dd>
                            </dl>
                        </ReportAnalysisCard>
                    </ReportAnalysisGrid>
                    <ReportTable
                        title="Marketing expenses"
                        subtitle={data.spend.count > data.spend.entries.length ? `Latest ${data.spend.entries.length} of ${formatNumber(data.spend.count)}` : undefined}
                        columns={SPEND_COLUMNS}
                        rows={data.spend.entries}
                        rowKey={r => r.id}
                        emptyMessage="No expenses recorded under the Marketing category in this period."
                    />
                </>
            )}
        </FinancePage>
    );
};

export default MarketingMetricsPage;
