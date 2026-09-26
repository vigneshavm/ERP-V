import { formatNumber } from '@/utils/formatters';
import type { OutwardChecks } from './gstTypes';
import { rupees } from './gstFormat';

export interface Finding {
    tone: 'warning' | 'info';
    text: string;
}


/** Turns the backend's outward checks into plain findings. Only things that actually happened are listed. */
export function outwardFindings(c: OutwardChecks): Finding[] {
    const out: Finding[] = [];
    if (Math.abs(c.shopHeaderVsLineTax.difference) > 1) {
        out.push({ tone: 'warning', text: `Shop bill lines carry ${rupees(c.shopHeaderVsLineTax.lines)} GST but the bill headers (gst5–gst28) total ${rupees(c.shopHeaderVsLineTax.header)}, a difference of ${rupees(c.shopHeaderVsLineTax.difference)}. Figures here use the lines.` });
    }
    if (Math.abs(c.shopHeaderVsLineValue.difference) > 1) {
        out.push({ tone: 'info', text: `Shop line values differ from bill totals by ${rupees(c.shopHeaderVsLineValue.difference)}, usually bill-level discount or round-off.` });
    }
    if (c.erpZeroRateLines.lines > 0) {
        out.push({ tone: 'warning', text: `${formatNumber(c.erpZeroRateLines.lines)} ERP invoice lines (${rupees(c.erpZeroRateLines.value)}) were recorded with 0% GST or no tax. ERP sales before 17 Sep 2026 could be recorded at 0% even when GST was charged, so check these before filing.` });
    }
    if (c.unknownRate.lines > 0) {
        out.push({ tone: 'warning', text: `${formatNumber(c.unknownRate.lines)} lines (${rupees(c.unknownRate.value)}) have a GST rate that is neither stored nor inferable from their tax. They are shown as "Unknown rate".` });
    }
    if (c.missingHsn.lines > 0) {
        out.push({ tone: 'warning', text: `${formatNumber(c.missingHsn.lines)} lines (${rupees(c.missingHsn.value)}) have no valid HSN code; they appear as "—" in the HSN summary.` });
    }
    if (c.erpReturnsNotDeducted.invoices > 0) {
        out.push({ tone: 'warning', text: `${formatNumber(c.erpReturnsNotDeducted.invoices)} ERP invoices have returns worth ${rupees(c.erpReturnsNotDeducted.value)} that are not deducted here. Issue credit notes for them.` });
    }
    if (c.hsnViaGroupLines > 0) {
        out.push({ tone: 'info', text: `${formatNumber(c.hsnViaGroupLines)} shop lines store an HSN group code; their HSN was read from the HSN master.` });
    }
    if (c.shopInterStateBills > 0) {
        out.push({ tone: 'info', text: `${formatNumber(c.shopInterStateBills)} shop bills are marked inter-state and reported as IGST.` });
    }
    if (c.erpDerivedLines > 0) {
        out.push({ tone: 'info', text: `${formatNumber(c.erpDerivedLines)} ERP lines had no stored tax breakdown; their tax was worked out from the recorded rate.` });
    }
    return out;
}
