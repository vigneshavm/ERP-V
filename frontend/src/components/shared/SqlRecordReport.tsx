import { useEffect, useMemo, useRef, useState } from 'react';
import { isAxiosError } from 'axios';
import { ArrowDown, ArrowUp, ArrowUpDown, ChevronLeft, ChevronRight, Search } from 'lucide-react';
import api from '../../services/api';

interface Data { rows: Record<string, unknown>[]; columns: string[]; page: number; hasMore: boolean; scope: string; group: string[]; dateColumn: string | null }

const LABELS: Record<string, string> = {
  No: 'No.', billno: 'Bill no.', cus_card: 'Card', cus_name: 'Customer', paymenttype: 'Payment', billamt: 'Bill amount',
  tot_qty: 'Qty', tmtr: 'Metres', countername: 'Counter', bill_status: 'Bill status', grn_no: 'GRN no.', sl_no: 'Sl.',
  pname: 'Product', entry_date: 'Entry date', mrp: 'MRP',
};
const label = (c: string): string => LABELS[c] ?? c.replace(/_/g, ' ').replace(/([a-z])([A-Z])/g, '$1 $2').replace(/^./, m => m.toUpperCase());

const DMY = /^(\d{2})\/(\d{2})\/(\d{4})/;
const ISO = /^(\d{4})-(\d{2})-(\d{2})/;
const MONEY = /(amt|amount|rate|mrp|price|total|net|value|discount|gst)$/i;
const isDateColumn = (c: string): boolean => /date/i.test(c);
const isNumber = (v: unknown): boolean => typeof v === 'number' || (typeof v === 'string' && v.trim() !== '' && /^-?\d+(\.\d+)?$/.test(v.trim()));

function showDate(v: string): string {
  const d = DMY.exec(v); if (d) return `${d[1]}-${d[2]}-${d[3]}`;
  const i = ISO.exec(v); if (i) return `${i[3]}-${i[2]}-${i[1]}`;
  return v;
}
function cell(column: string, value: unknown): string {
  if (value === null || value === undefined || String(value).trim() === '') return '—';
  const s = String(value).trim();
  if (isDateColumn(column)) return showDate(s);
  if (isNumber(value) && MONEY.test(column)) return Number(s).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  return s;
}

export default function SqlRecordReport({ report, title }: { report: string; title: string }) {
  const [from, setFrom] = useState(''), [to, setTo] = useState(''), [barcode, setBarcode] = useState(''), [search, setSearch] = useState('');
  const [data, setData] = useState<Data | null>(null), [error, setError] = useState(''), [busy, setBusy] = useState(false);
  const started = useRef(false);
  const [sort, setSort] = useState<{ col: string; dir: 'asc' | 'desc' } | null>(null);

  async function load(page = 1) {
    setBusy(true); setError('');
    try {
      const response = await api.get(`/api/reports/textilesoft/${encodeURIComponent(report)}`, { params: { from: from || undefined, to: to || undefined, barcode: barcode || undefined, page } });
      const value: Data = response.data?.data;
      if (response.data?.success !== true || !value || !Array.isArray(value.rows) || !Array.isArray(value.columns)) throw Error('The server did not return a valid SQL report.');
      setData(value);
    } catch (e: unknown) {
      setData(null);
      setError(isAxiosError(e) ? e.response?.data?.error?.message || e.response?.data?.message || e.message : e instanceof Error ? e.message : 'SQL report unavailable.');
    } finally { setBusy(false); }
  }
  useEffect(() => { if (started.current) return; started.current = true; void load(); /* eslint-disable-next-line react-hooks/exhaustive-deps */ }, []);

  const directory = ['customer-points', 'supplier-view'].includes(report);
  const hasBarcode = ['mrp-rate-change', 'sales-rate-change-entry', 'barcode-wise-discount', 'barcode-rate-change', 'barcode-mtr-rate-change', 'combo-detail', 'brand-patternsizewise-stock-report', 'patternwise-supplier-sizewise-stock', 'pattern-supplier-sizewise-stock-report', 'stock-report', 'new-datewise-stock-report', 'barcode-sales-report', 'barcode-stock-checking', 'purchase-rate-check', 'barcodewise-discount-report', 'pattern-size-sales', 'company-wise', 'salesman', 'sales-gst'].includes(report);

  // A column is numeric (right-aligned) when every filled value in it is a number and it is not an id-like text.
  const numeric = useMemo(() => {
    const out = new Set<string>();
    if (!data) return out;
    for (const c of data.columns) {
      if (isDateColumn(c)) continue;
      const vals = data.rows.map(r => r[c]).filter(v => v !== null && v !== undefined && String(v).trim() !== '');
      if (vals.length && vals.every(isNumber) && (MONEY.test(c) || /qty|mtr|no$|points|stock|^sl/i.test(c) || vals.some(v => String(v).includes('.')))) out.add(c);
    }
    return out;
  }, [data]);

  const rows = useMemo(() => {
    if (!data) return [];
    const q = search.trim().toLowerCase();
    const found = q ? data.rows.filter(r => data.columns.some(c => String(r[c] ?? '').toLowerCase().includes(q))) : data.rows;
    if (!sort) return found;
    const { col, dir } = sort;
    const sign = dir === 'asc' ? 1 : -1;
    const key = (r: Record<string, unknown>): string | number => {
      const v = r[col];
      if (v === null || v === undefined || String(v).trim() === '') return '';
      const t = String(v).trim();
      if (isDateColumn(col)) { const d = DMY.exec(t); return d ? `${d[3]}${d[2]}${d[1]}` : t; }
      return numeric.has(col) && isNumber(v) ? Number(t) : t.toLowerCase();
    };
    return [...found].sort((a, b) => {
      const x = key(a), y = key(b);
      if (x === '' && y !== '') return 1;   // blanks always last
      if (y === '' && x !== '') return -1;
      if (typeof x === 'number' && typeof y === 'number') return (x - y) * sign;
      return String(x).localeCompare(String(y), undefined, { numeric: true }) * sign;
    });
  }, [data, search, sort, numeric]);
  const toggleSort = (c: string) => setSort(cur => (cur?.col !== c ? { col: c, dir: 'asc' } : cur.dir === 'asc' ? { col: c, dir: 'desc' } : null));

  const field = 'h-11 rounded-lg border border-slate-200 bg-white px-3 text-sm text-slate-700 outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200';
  const cap = 'mb-2 block text-[10px] font-black uppercase tracking-widest text-slate-400';

  return (
    <section className="w-full min-w-0 max-w-full space-y-4" aria-label={title}>
      <div className="rounded-2xl border border-slate-200 bg-white p-6 dark:border-slate-700 dark:bg-slate-800">
        <h2 className="mb-5 text-lg font-bold text-slate-900 dark:text-white">{title}</h2>
        <form className="flex flex-wrap items-end gap-4" onSubmit={e => { e.preventDefault(); void load(); }}>
          <label className="block min-w-[240px] flex-1">
            <span className={cap}>Search</span>
            <span className="relative block">
              <Search size={16} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input className={`${field} w-full pl-9`} placeholder="Search these rows…" value={search} onChange={e => setSearch(e.target.value)} />
            </span>
          </label>
          {!directory && (
            <>
              <label className="block w-44"><span className={cap}>From</span><input className={`${field} w-full`} type="date" value={from} onChange={e => setFrom(e.target.value)} /></label>
              <label className="block w-44"><span className={cap}>To</span><input className={`${field} w-full`} type="date" value={to} onChange={e => setTo(e.target.value)} /></label>
            </>
          )}
          {hasBarcode && (
            <label className="block w-56"><span className={cap}>Barcode</span><input className={`${field} w-full`} value={barcode} maxLength={128} onChange={e => setBarcode(e.target.value)} /></label>
          )}
          <button className="h-11 rounded-lg bg-primary px-5 text-sm font-bold text-white disabled:opacity-60" disabled={busy} type="submit">{busy ? 'Loading…' : 'Load records'}</button>
        </form>
        {data && (
          <p className="mt-4 text-xs text-slate-400">
            {rows.length}{search ? ` of ${data.rows.length}` : ''} rows · page {data.page}
            {data.group.length ? ` · sorted by ${data.group.map(label).join(', ')}` : ''}
            {data.dateColumn ? ` · date column: ${label(data.dateColumn)}` : ''}
          </p>
        )}
      </div>

      {error && <p role="alert" className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700 dark:border-red-900 dark:bg-red-950/40 dark:text-red-300">{error}</p>}

      {data && (
        <div className="min-w-0 max-w-full overflow-hidden rounded-2xl border border-slate-200 bg-white dark:border-slate-700 dark:bg-slate-800">
          <div className="overflow-auto">
            <table className="w-full min-w-[720px] table-auto border-collapse text-left">
              <thead className="bg-slate-50 dark:bg-slate-900/50">
                <tr>
                  <th className="w-14 whitespace-nowrap border-b border-slate-200 px-3 py-4 text-left text-[10px] font-black uppercase tracking-widest text-slate-400 dark:border-slate-700">Sl.no</th>
                  {data.columns.map(c => (
                    <th key={c} aria-sort={sort?.col === c ? (sort.dir === 'asc' ? 'ascending' : 'descending') : 'none'} className={`whitespace-nowrap border-b border-slate-200 px-3 py-4 text-[10px] font-black uppercase tracking-widest text-slate-400 dark:border-slate-700 ${numeric.has(c) ? 'text-right' : 'text-left'}`}>
                      <button type="button" onClick={() => toggleSort(c)} className={`inline-flex items-center gap-1 uppercase tracking-widest hover:text-slate-600 dark:hover:text-slate-200 ${sort?.col === c ? 'text-primary' : ''}`}>
                        {label(c)}
                        {sort?.col === c ? (sort.dir === 'asc' ? <ArrowUp size={12} /> : <ArrowDown size={12} />) : <ArrowUpDown size={12} className="opacity-50" />}
                      </button>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
                {rows.map((row, i) => (
                  <tr key={i} className="hover:bg-slate-50/70 dark:hover:bg-slate-900/30">
                    <td className="whitespace-nowrap px-3 py-3 text-left text-xs font-bold tabular-nums text-slate-400">{(data.page - 1) * 500 + i + 1}</td>
                    {data.columns.map(c => (
                      <td key={c} className={`px-3 py-3 text-xs tabular-nums ${numeric.has(c) ? 'whitespace-nowrap text-right font-bold text-slate-800 dark:text-slate-100' : 'min-w-[90px] max-w-[320px] whitespace-normal break-words text-left font-medium text-slate-700 dark:text-slate-300'}`}>{cell(c, row[c])}</td>
                    ))}
                  </tr>
                ))}
                {!rows.length && (
                  <tr><td colSpan={data.columns.length + 1} className="px-5 py-16 text-center text-xs font-bold text-slate-400">No SQL records match these filters.</td></tr>
                )}
              </tbody>
            </table>
          </div>
          <div className="flex items-center justify-between border-t border-slate-100 px-5 py-3 dark:border-slate-700">
            <span className="text-xs text-slate-400">{data.scope}</span>
            <div className="flex gap-2">
              <button className="flex h-9 items-center gap-1 rounded-lg border border-slate-200 px-3 text-xs font-bold text-slate-600 disabled:opacity-40 dark:border-slate-700 dark:text-slate-300" disabled={busy || data.page === 1} onClick={() => void load(data.page - 1)}><ChevronLeft size={14} />Previous</button>
              <button className="flex h-9 items-center gap-1 rounded-lg border border-slate-200 px-3 text-xs font-bold text-slate-600 disabled:opacity-40 dark:border-slate-700 dark:text-slate-300" disabled={busy || !data.hasMore} onClick={() => void load(data.page + 1)}>Next<ChevronRight size={14} /></button>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
