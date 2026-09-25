import React from 'react';
import { CalendarClock, MessageCircle, Send, Users } from 'lucide-react';
import { formatNumber } from '@/utils/formatters';
import { ReportKpiGrid, ReportPeriodPicker, ReportTable, useReportData, useReportPeriod } from '../reports/components';
import type { ReportColumn } from '../reports/components';
import { FinancePage } from '../financial/overview/FinancePage';
import type { WhatsAppCampaignRow, WhatsAppCampaignsData } from './engagementTypes';

const STATUS_LABEL: Record<string, string> = { scheduled: 'Scheduled', completed: 'Completed', failed: 'Failed' };

/**
 * Growth › Marketing › WhatsApp: the campaigns saved in the ERP. Nothing in the ERP sends them or records delivery,
 * so delivery columns appear only when some delivery counts were actually recorded. Replaced WhatsAppMarketing,
 * whose campaigns, revenue, coupons and store locations were hardcoded.
 */
const WhatsAppCampaignsPage: React.FC = () => {
    const period = useReportPeriod('last-3-months');
    const { from, to } = period.period;
    const { data, loading, error, reload } = useReportData<WhatsAppCampaignsData>('/api/reports/engagement/whatsapp-campaigns', { from, to }, { enabled: Boolean(from && to) });

    const columns: ReportColumn<WhatsAppCampaignRow>[] = [
        { key: 'created', header: 'Created', type: 'date', value: r => r.created },
        { key: 'name', header: 'Campaign', value: r => r.name, subtext: r => (r.message.length > 80 ? `${r.message.slice(0, 80)}…` : r.message) || null },
        { key: 'groups', header: 'Audience', value: r => r.groups.join(', ') || '—' },
        { key: 'scheduled', header: 'Scheduled for', type: 'date', value: r => r.scheduled },
        { key: 'status', header: 'Status', type: 'status', value: r => STATUS_LABEL[r.status] ?? r.status, statusTones: { Scheduled: 'info', Completed: 'success', Failed: 'danger' } },
        ...(data?.deliveryTracked ? [
            { key: 'sent', header: 'Sent', type: 'number', value: (r: WhatsAppCampaignRow) => r.sent },
            { key: 'delivered', header: 'Delivered', type: 'number', value: (r: WhatsAppCampaignRow) => r.delivered },
            { key: 'read', header: 'Read', type: 'number', value: (r: WhatsAppCampaignRow) => r.read },
            { key: 'failed', header: 'Failed', type: 'number', value: (r: WhatsAppCampaignRow) => r.failed },
        ] as ReportColumn<WhatsAppCampaignRow>[] : []),
    ];

    return (
        <FinancePage
            section="Marketing"
            title="WhatsApp campaigns"
            subtitle="Campaigns saved in the ERP and who has agreed to receive WhatsApp messages"
            basis="Audience counts customers with a phone number who opted in to WhatsApp marketing. Campaign revenue isn't shown: no bill records which campaign brought the customer."
            actions={<ReportPeriodPicker value={period} />}
            loading={loading}
            error={error}
            hasData={Boolean(data)}
            onRefresh={() => reload(true)}
        >
            {data && (
                <>
                    {!data.deliveryTracked && (
                        <p className="rounded-md border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800 dark:border-amber-900/50 dark:bg-amber-950/30 dark:text-amber-200">
                            Messages aren't sent from the ERP yet{data.connection.connected ? '' : ' and no WhatsApp Business account is connected'}, so there are no sent, delivered or read figures. Campaigns below are saved drafts and schedules.
                        </p>
                    )}
                    <ReportKpiGrid items={[
                        { label: 'Campaigns', value: formatNumber(data.counts.total), sub: 'Created in the period', icon: <MessageCircle className="w-4 h-4" /> },
                        { label: 'Scheduled', value: formatNumber(data.counts.scheduled), icon: <CalendarClock className="w-4 h-4" /> },
                        { label: 'Completed', value: formatNumber(data.counts.completed), sub: data.counts.failed ? `${formatNumber(data.counts.failed)} failed` : undefined, icon: <Send className="w-4 h-4" /> },
                        { label: 'Opted-in audience', value: formatNumber(data.audience.whatsappOptIn), sub: 'Customers who agreed to WhatsApp', icon: <Users className="w-4 h-4" /> },
                    ]} />
                    <ReportTable title="Campaigns" subtitle="Newest first" columns={columns} rows={data.campaigns} rowKey={r => r.id} emptyMessage="No WhatsApp campaigns created in this period." />
                </>
            )}
        </FinancePage>
    );
};

export default WhatsAppCampaignsPage;
