import React from 'react';
import { Coins, Crown, Gift, Users } from 'lucide-react';
import { formatNumber } from '@/utils/formatters';
import {
    ReportAnalysisCard, ReportAnalysisGrid, ReportKpiGrid, ReportPeriodPicker, ReportRankList, ReportTable, useReportData, useReportPeriod,
} from '../reports/components';
import type { ReportColumn } from '../reports/components';
import { FinancePage } from '../financial/overview/FinancePage';
import { rupees0 } from '../financial/overview/cashBankFormat';
import type { LoyaltyData } from './engagementTypes';

type Member = LoyaltyData['summary']['topMembers'][number];
type Activity = LoyaltyData['activity'][number];

const TYPE_LABEL: Record<string, string> = { EARN: 'Earned', REDEEM: 'Redeemed', EXPIRE: 'Expired', ADJUSTMENT: 'Adjusted', REFUND_REVERSAL: 'Refund reversal', PROMOTIONAL_BONUS: 'Bonus' };
const TYPE_TONE = { Earned: 'success', Bonus: 'success', Redeemed: 'info', Expired: 'neutral', Adjusted: 'warning', 'Refund reversal': 'warning' } as const;

const MEMBER_COLUMNS: ReportColumn<Member>[] = [
    { key: 'name', header: 'Member', value: r => r.name, subtext: r => r.phone || null },
    { key: 'tier', header: 'Tier', type: 'status', value: r => r.tier, statusTones: { Platinum: 'info', Gold: 'warning', Silver: 'neutral', Bronze: 'neutral' } },
    { key: 'points', header: 'Points', type: 'number', value: r => r.points, subtext: r => `worth ${rupees0(r.value)}` },
    { key: 'totalSpend', header: 'Lifetime spend', type: 'currency', fractionDigits: 0, value: r => r.totalSpend || null },
    { key: 'lastPurchase', header: 'Last purchase', type: 'date', value: r => r.lastPurchase },
];
const ACTIVITY_COLUMNS: ReportColumn<Activity>[] = [
    { key: 'date', header: 'Date', type: 'date', value: r => r.date },
    { key: 'customer', header: 'Customer', value: r => r.customer, subtext: r => r.description || null },
    { key: 'type', header: 'Type', type: 'status', value: r => TYPE_LABEL[r.type] ?? r.type, statusTones: TYPE_TONE },
    { key: 'points', header: 'Points', type: 'number', value: r => r.points, cellClassName: r => (r.points < 0 ? 'text-rose-600' : 'text-emerald-600') },
    { key: 'balanceAfter', header: 'Balance after', type: 'number', value: r => r.balanceAfter },
];

/**
 * Growth › Loyalty: members, tiers, points issued and redeemed, and what the unredeemed points are worth, from the
 * ERP's customer points and loyalty ledger. Replaced LoyaltyEngagement, whose member counts, KPIs and members were hardcoded.
 */
const LoyaltyReportPage: React.FC = () => {
    const period = useReportPeriod('this-month');
    const { from, to } = period.period;
    const { data, loading, error, reload } = useReportData<LoyaltyData>('/api/reports/engagement/loyalty', { from, to }, { enabled: Boolean(from && to) });
    const s = data?.summary;

    return (
        <FinancePage
            section="Customer engagement"
            title="Loyalty"
            subtitle="Members, tiers and points, from the points customers actually earn and redeem at billing"
            basis={s ? `Earning: 1 point per ₹${formatNumber(s.rules.spendPerPoint)} spent. Redeeming: ₹${formatNumber(s.rules.rupeesPer100Points)} per 100 points. Members are customers who hold points or have ever earned or redeemed. Tiers follow current points (Platinum 5,000+, Gold 2,000+, Silver 500+, else Bronze). Active = bought in the last 90 days. Sales to members are ERP bills only.` : undefined}
            actions={<ReportPeriodPicker value={period} />}
            loading={loading}
            error={error}
            hasData={Boolean(data)}
            onRefresh={() => reload(true)}
        >
            {data && s && (
                s.members === 0 && data.activity.length === 0 ? (
                    <p className="rounded-md border border-dashed border-slate-300 p-8 text-center text-sm text-slate-500 dark:border-slate-700">
                        No customer has earned loyalty points yet. Points are added when a bill is made for a named customer.
                    </p>
                ) : (
                    <>
                        <ReportKpiGrid items={[
                            { label: 'Members', value: formatNumber(s.members), sub: `${formatNumber(s.activeMembers)} bought in the last 90 days`, icon: <Users className="w-4 h-4" /> },
                            { label: 'Points issued', value: formatNumber(s.period.issued), sub: `${formatNumber(s.period.earners)} customers earned in the period`, icon: <Coins className="w-4 h-4" /> },
                            { label: 'Points redeemed', value: formatNumber(s.period.redeemed), sub: s.period.redemptionRatePct !== null ? `${s.period.redemptionRatePct}% of issued · ${rupees0(s.period.redeemedValue)} discount` : 'None issued in the period', icon: <Gift className="w-4 h-4" /> },
                            { label: 'Unredeemed points', value: formatNumber(s.outstandingPoints), sub: `Worth ${rupees0(s.outstandingValue)} in discounts`, icon: <Crown className="w-4 h-4" /> },
                        ]} />
                        <ReportAnalysisGrid>
                            <ReportAnalysisCard title="Members by tier" subtitle="From current points" autoHeight>
                                <ReportRankList items={s.tiers.map(t => ({ label: `${t.tier} (${formatNumber(t.minPoints)}+ pts) · ${formatNumber(t.points)} pts`, value: t.members, display: `${formatNumber(t.members)} members` }))} />
                            </ReportAnalysisCard>
                            <ReportAnalysisCard title="Sales to members" subtitle="ERP bills in the period" autoHeight>
                                <dl className="grid grid-cols-2 gap-x-6 gap-y-2 text-sm tabular-nums">
                                    <dt className="text-slate-500">Bills to members</dt><dd className="text-right font-bold">{rupees0(s.sales.memberSales)}</dd>
                                    <dt className="text-slate-500">All ERP bills</dt><dd className="text-right">{rupees0(s.sales.totalSales)}</dd>
                                    <dt className="text-slate-500">Members' share</dt><dd className="text-right font-bold">{s.sales.memberSharePct !== null ? `${s.sales.memberSharePct}%` : '—'}</dd>
                                    <dt className="text-slate-500">Expired in period</dt><dd className="text-right">{formatNumber(s.period.expired)} pts</dd>
                                    <dt className="text-slate-500">Members opted in to WhatsApp</dt><dd className="text-right">{formatNumber(s.whatsappOptIn)}</dd>
                                </dl>
                            </ReportAnalysisCard>
                        </ReportAnalysisGrid>
                        <ReportTable title="Highest point balances" subtitle="Top 15 members" columns={MEMBER_COLUMNS} rows={s.topMembers} rowKey={r => r.id} />
                        <ReportTable
                            title="Points activity"
                            subtitle={data.activityTotal > data.activity.length ? `Latest ${formatNumber(data.activity.length)} of ${formatNumber(data.activityTotal)} entries in the period` : `${formatNumber(data.activityTotal)} entries in the period`}
                            columns={ACTIVITY_COLUMNS}
                            rows={data.activity}
                            rowKey={r => r.id}
                            emptyMessage="No points earned or redeemed in this period."
                        />
                    </>
                )
            )}
        </FinancePage>
    );
};

export default LoyaltyReportPage;
