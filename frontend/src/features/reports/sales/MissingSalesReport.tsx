import React, { useState } from 'react';
import { FilterSelect, ReportColumn, ReportPageShell, ReportTable, useReportPeriod, useServerReport } from '../components';
import type { PageInfo } from '../components';

/**
 * Missing Sales — saved ESC / Delete lines from the native Escsave table. Same layout as the other reports:
 * shell (period, filters, export, audit footer) + paged grid. Values repeat across the lines of one bill, so
 * bill-level amounts must not be summed.
 */
const URL = '/api/reports/legacy/missing-sales';

interface MissingRow {
    SmNo: string | number; barcode: string; code: string; productname: string; Mrp: number; qty: number; amt: number;
    Pdisperc: number; Pdisamt: number; Bdisperc: number; Billdisamt: number; Billless: number; Billnetamt: number;
    DateTime: string; counterName: string; LoginName: string; status: string;
}
interface MissingData { items: MissingRow[]; pagination: PageInfo }

const NO_SORT = { sortable: false } as const;
const COLUMNS: ReportColumn<MissingRow>[] = [
    { key: 'DateTime', header: 'Date & time', type: 'datetime', value: r => r.DateTime, ...NO_SORT },
    { key: 'SmNo', header: 'Sm no.', value: r => String(r.SmNo ?? ''), ...NO_SORT },
    { key: 'status', header: 'Status', type: 'status', value: r => r.status, statusTones: { ESC: 'warning', Delete: 'danger' }, ...NO_SORT },
    { key: 'productname', header: 'Product', value: r => r.productname, subtext: r => r.barcode, ...NO_SORT },
    { key: 'code', header: 'Code', value: r => r.code, defaultHidden: true, ...NO_SORT },
    { key: 'Mrp', header: 'MRP', type: 'currency', value: r => r.Mrp, ...NO_SORT },
    { key: 'qty', header: 'Qty', type: 'quantity', value: r => r.qty, ...NO_SORT },
    { key: 'amt', header: 'Line amount', type: 'currency', value: r => r.amt, ...NO_SORT },
    { key: 'Pdisperc', header: 'Product disc %', type: 'percent', value: r => r.Pdisperc, defaultHidden: true, ...NO_SORT },
    { key: 'Pdisamt', header: 'Product disc', type: 'currency', value: r => r.Pdisamt, defaultHidden: true, ...NO_SORT },
    { key: 'Bdisperc', header: 'Bill disc %', type: 'percent', value: r => r.Bdisperc, defaultHidden: true, ...NO_SORT },
    { key: 'Billdisamt', header: 'Bill disc', type: 'currency', value: r => r.Billdisamt, defaultHidden: true, ...NO_SORT },
    { key: 'Billless', header: 'Bill less', type: 'currency', value: r => r.Billless, defaultHidden: true, ...NO_SORT },
    { key: 'Billnetamt', header: 'Bill net (repeats per line)', type: 'currency', value: r => r.Billnetamt, ...NO_SORT },
    { key: 'counterName', header: 'Counter', value: r => r.counterName, ...NO_SORT },
    { key: 'LoginName', header: 'Login', value: r => r.LoginName, ...NO_SORT },
];

const inputCls = 'px-2.5 py-1.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-sm text-slate-700 dark:text-slate-200 outline-none focus:ring-2 focus:ring-[rgb(var(--color-primary)/0.2)]';

export default function MissingSalesReport() {
    const period = useReportPeriod('this-month');
    const [status, setStatus] = useState('');
    const [counter, setCounter] = useState('');
    const [login, setLogin] = useState('');
    const report = useServerReport<MissingData, MissingRow>(
        URL,
        { from: period.period.from, to: period.period.to, status, counter: counter.trim(), login: login.trim() },
        { tableSearch: false, noun: 'lines' },
    );
    const { data, loading, error, reload } = report;
    const active = (status ? 1 : 0) + (counter.trim() ? 1 : 0) + (login.trim() ? 1 : 0);

    return (
        <ReportPageShell<MissingRow>
            reportId="missing-sales"
            period={period}
            filters={{
                activeCount: active,
                onClear: () => { setStatus(''); setCounter(''); setLogin(''); },
                content: (
                    <>
                        <FilterSelect label="Status" value={status} onChange={setStatus} allLabel="All" options={[{ value: '1', label: 'ESC' }, { value: '0', label: 'Delete' }]} />
                        <label className="flex flex-col gap-1 min-w-[10rem]">
                            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Counter</span>
                            <input className={inputCls} value={counter} onChange={e => setCounter(e.target.value)} placeholder="All counters" />
                        </label>
                        <label className="flex flex-col gap-1 min-w-[10rem]">
                            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Login</span>
                            <input className={inputCls} value={login} onChange={e => setLogin(e.target.value)} placeholder="All logins" />
                        </label>
                    </>
                ),
            }}
            note="Saved ESC / deleted lines from the existing SQL Escsave records. Bill-level values repeat on every line of a bill and must not be summed as bill totals. This report does not infer missing bill numbers."
            onRefresh={() => reload(true)}
            loading={loading}
            error={error}
            isEmpty={Boolean(data && data.pagination.total === 0 && active === 0)}
            meta={{ recordCount: data?.pagination.total }}
            export={{ columns: COLUMNS, fetchRows: report.fetchAllRows, filterSummary: [`${period.period.from} to ${period.period.to}`, ...(status ? [`Status: ${status === '1' ? 'ESC' : 'Delete'}`] : []), ...(counter.trim() ? [`Counter: ${counter.trim()}`] : []), ...(login.trim() ? [`Login: ${login.trim()}`] : [])] }}
        >
            <ReportTable
                title="ESC / Delete lines"
                subtitle="Oldest first"
                columns={COLUMNS}
                rowKey={(r, i) => `${r.SmNo}-${r.barcode}-${i}`}
                {...report.tableProps}
                emptyMessage="No ESC or deleted lines for these filters."
            />
        </ReportPageShell>
    );
}
