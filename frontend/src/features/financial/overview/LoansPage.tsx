import React, { useState } from 'react';
import { CalendarClock, HandCoins, Plus, Wallet } from 'lucide-react';
import api from '@/services/api';
import { formatNumber } from '@/utils/formatters';
import { ReportKpiGrid, ReportTable, useReportData } from '../../reports/components';
import type { ReportColumn } from '../../reports/components';
import { FinancePage } from './FinancePage';
import { LOAN_HEALTH_LABEL, LOAN_HEALTH_TONE, dateText, emiFor, rupees0 } from './cashBankFormat';
import type { LoanRow, LoansData } from './cashBankTypes';

const today = () => new Date(Date.now() + 5.5 * 3_600_000).toISOString().slice(0, 10);
const errorText = (err: unknown, fallback: string) => (err as { response?: { data?: { message?: string } } })?.response?.data?.message || fallback;

const input = 'w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-900';
const Field: React.FC<{ label: string; children: React.ReactNode }> = ({ label, children }) => (
    <label className="block space-y-1 text-xs font-bold text-slate-600 dark:text-slate-300">{label}{children}</label>
);

const Dialog: React.FC<{ title: string; onClose: () => void; children: React.ReactNode }> = ({ title, onClose, children }) => (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" onClick={onClose}>
        <div role="dialog" aria-modal="true" aria-label={title} className="w-full max-w-md rounded-lg border border-slate-200 bg-white p-5 shadow-2xl dark:border-slate-700 dark:bg-slate-800" onClick={e => e.stopPropagation()}>
            <h2 className="mb-4 text-base font-bold text-slate-900 dark:text-white">{title}</h2>
            {children}
        </div>
    </div>
);

const Actions: React.FC<{ busy: boolean; error: string; onCancel: () => void; submit: string }> = ({ busy, error, onCancel, submit }) => (
    <>
        {error && <p className="text-sm font-medium text-rose-600">{error}</p>}
        <div className="flex justify-end gap-2 pt-2">
            <button type="button" onClick={onCancel} className="rounded-md px-3 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-700">Cancel</button>
            <button type="submit" disabled={busy} className="rounded-md bg-primary px-3 py-2 text-xs font-bold text-white disabled:opacity-50">{busy ? 'Saving…' : submit}</button>
        </div>
    </>
);

const AddLoanDialog: React.FC<{ onClose: () => void; onSaved: () => void }> = ({ onClose, onSaved }) => {
    const [f, setF] = useState({ name: '', principal: '', rate: '', months: '', start: today(), emi: '', total: '' });
    const [busy, setBusy] = useState(false);
    const [error, setError] = useState('');
    const suggestedEmi = emiFor(Number(f.principal), Number(f.rate), Number(f.months));
    const emi = f.emi ? Number(f.emi) : suggestedEmi;
    const total = f.total ? Number(f.total) : emi * Number(f.months || 0);
    const set = (k: keyof typeof f) => (e: React.ChangeEvent<HTMLInputElement>) => setF(p => ({ ...p, [k]: e.target.value }));

    const submit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!f.name.trim() || !(Number(f.principal) > 0) || !(Number(f.months) > 0) || !(emi > 0)) { setError('Enter a name, amount, term and EMI.'); return; }
        setBusy(true); setError('');
        try {
            await api.post('/api/loans', { name: f.name.trim(), principalAmount: Number(f.principal), interestRate: Number(f.rate) || 0, termMonths: Number(f.months), emiAmount: emi, totalPendingAmount: total, startDate: f.start });
            onSaved();
        } catch (err) {
            setError(errorText(err, 'Could not save the loan.'));
            setBusy(false);
        }
    };

    return (
        <Dialog title="Add loan" onClose={onClose}>
            <form onSubmit={submit} className="space-y-3">
                <Field label="Name"><input className={input} value={f.name} onChange={set('name')} placeholder="e.g. SBI business loan" /></Field>
                <div className="grid grid-cols-2 gap-3">
                    <Field label="Loan amount (₹)"><input className={input} inputMode="decimal" value={f.principal} onChange={set('principal')} /></Field>
                    <Field label="Interest % per year"><input className={input} inputMode="decimal" value={f.rate} onChange={set('rate')} /></Field>
                    <Field label="Term (months)"><input className={input} inputMode="numeric" value={f.months} onChange={set('months')} /></Field>
                    <Field label="Start date"><input className={input} type="date" value={f.start} onChange={set('start')} /></Field>
                    <Field label={`EMI (₹)${suggestedEmi ? ` · calc. ${formatNumber(suggestedEmi)}` : ''}`}><input className={input} inputMode="decimal" value={f.emi} onChange={set('emi')} placeholder={suggestedEmi ? String(suggestedEmi) : ''} /></Field>
                    <Field label="Total payable (₹)"><input className={input} inputMode="decimal" value={f.total} onChange={set('total')} placeholder={total ? String(total) : ''} /></Field>
                </div>
                <p className="text-xs text-slate-500">EMI k is due k months after the start date. Total payable is EMI × months unless you change it; each EMI recorded reduces it.</p>
                <Actions busy={busy} error={error} onCancel={onClose} submit="Add loan" />
            </form>
        </Dialog>
    );
};

const PayDialog: React.FC<{ loan: LoanRow; banks: LoansData['banks']; onClose: () => void; onSaved: () => void }> = ({ loan, banks, onClose, onSaved }) => {
    const [f, setF] = useState({ date: today(), amount: String(loan.emi), method: 'BankTransfer', bank: banks[0]?.id ?? '', ref: '' });
    const [busy, setBusy] = useState(false);
    const [error, setError] = useState('');
    const needsBank = f.method !== 'Cash';

    const submit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!(Number(f.amount) > 0)) { setError('Enter the amount paid.'); return; }
        if (needsBank && !f.bank) { setError('Pick the bank account it was paid from.'); return; }
        setBusy(true); setError('');
        try {
            await api.post(`/api/loans/${loan.id}/payments`, { paymentDate: f.date, amountPaid: Number(f.amount), paymentMethod: f.method, bankAccountId: needsBank ? f.bank : undefined, referenceNumber: f.ref || undefined });
            onSaved();
        } catch (err) {
            setError(errorText(err, 'Could not record the payment.'));
            setBusy(false);
        }
    };

    return (
        <Dialog title={`Record EMI · ${loan.name}`} onClose={onClose}>
            <form onSubmit={submit} className="space-y-3">
                <div className="grid grid-cols-2 gap-3">
                    <Field label="Paid on"><input className={input} type="date" value={f.date} onChange={e => setF(p => ({ ...p, date: e.target.value }))} /></Field>
                    <Field label="Amount (₹)"><input className={input} inputMode="decimal" value={f.amount} onChange={e => setF(p => ({ ...p, amount: e.target.value }))} /></Field>
                    <Field label="Paid by">
                        <select className={input} value={f.method} onChange={e => setF(p => ({ ...p, method: e.target.value }))}>
                            <option value="BankTransfer">Bank transfer</option><option value="Cheque">Cheque</option><option value="Cash">Cash</option>
                        </select>
                    </Field>
                    {needsBank && (
                        <Field label="From account">
                            <select className={input} value={f.bank} onChange={e => setF(p => ({ ...p, bank: e.target.value }))}>
                                {banks.length === 0 && <option value="">No bank accounts</option>}
                                {banks.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
                            </select>
                        </Field>
                    )}
                </div>
                <Field label="Reference (UTR / cheque no.)"><input className={input} value={f.ref} onChange={e => setF(p => ({ ...p, ref: e.target.value }))} /></Field>
                <p className="text-xs text-slate-500">A bank or cheque payment is taken off that account's ERP balance; a cash payment is recorded as cash out.</p>
                <Actions busy={busy} error={error} onCancel={onClose} submit="Record payment" />
            </form>
        </Dialog>
    );
};

/** Finance › Loans: every loan with EMIs paid, due and overdue, from /api/loans records. Replaced a hardcoded list. */
const LoansPage: React.FC = () => {
    const { data, loading, error, reload } = useReportData<LoansData>('/api/reports/finance/loans', {});
    const [adding, setAdding] = useState(false);
    const [paying, setPaying] = useState<LoanRow | null>(null);
    const saved = () => { setAdding(false); setPaying(null); reload(true); };

    const columns: ReportColumn<LoanRow>[] = [
        { key: 'name', header: 'Loan', value: r => r.name, subtext: r => `${rupees0(r.principal)} at ${r.interestRate}% · ${r.termMonths} months from ${dateText(r.startDate)}` },
        { key: 'emi', header: 'EMI', type: 'currency', fractionDigits: 0, value: r => r.emi },
        { key: 'paid', header: 'Paid', type: 'currency', fractionDigits: 0, value: r => r.paid, subtext: r => `${r.payments} of ${r.termMonths} EMIs${r.lastPayment ? ` · last ${dateText(r.lastPayment)}` : ''}` },
        { key: 'pending', header: 'Pending', type: 'currency', fractionDigits: 0, value: r => r.pending, subtext: r => `${r.paidPct}% repaid` },
        { key: 'nextDue', header: 'Next EMI', type: 'date', value: r => r.nextDue, subtext: r => (r.overdueEmis ? `${r.overdueEmis} overdue` : null), cellClassName: r => (r.overdueEmis ? 'text-rose-600 font-bold' : undefined) },
        { key: 'health', header: 'Status', type: 'status', value: r => LOAN_HEALTH_LABEL[r.health], statusTones: LOAN_HEALTH_TONE },
    ];

    return (
        <FinancePage
            title="Loans"
            subtitle="Business loans, EMIs paid and what is due"
            basis="EMI k is due k months after the loan's start date; an EMI counts as overdue when fewer EMIs are recorded than have fallen due."
            actions={<button type="button" onClick={() => setAdding(true)} className="inline-flex items-center gap-1.5 rounded-md bg-primary px-3 py-2 text-xs font-bold text-white"><Plus className="h-3.5 w-3.5" /> Add loan</button>}
            loading={loading}
            error={error}
            hasData={Boolean(data)}
            onRefresh={() => reload(true)}
        >
            {data && (
                <>
                    <ReportKpiGrid items={[
                        { label: 'Outstanding', value: rupees0(data.totals.pending), sub: `${formatNumber(data.totals.active)} active loan${data.totals.active === 1 ? '' : 's'}`, icon: <Wallet className="w-4 h-4" /> },
                        { label: 'EMIs per month', value: rupees0(data.totals.monthlyEmi), icon: <CalendarClock className="w-4 h-4" /> },
                        { label: 'Repaid so far', value: rupees0(data.totals.paid), icon: <HandCoins className="w-4 h-4" /> },
                        { label: 'Overdue', value: formatNumber(data.totals.overdue), sub: data.totals.overdue ? 'Loans with an EMI not recorded' : 'Nothing overdue', tone: data.totals.overdue ? 'negative' : 'positive', icon: <CalendarClock className="w-4 h-4" /> },
                    ]} />
                    <ReportTable
                        title="Loans"
                        columns={columns}
                        rows={data.loans}
                        rowKey={r => r.id}
                        emptyMessage="No loans recorded. Use Add loan to start tracking EMIs."
                        rowActions={r => (r.health === 'closed' ? null : (
                            <button type="button" onClick={() => setPaying(r)} className="rounded-md border border-slate-200 px-2.5 py-1 text-[11px] font-bold hover:bg-slate-50 dark:border-slate-700 dark:hover:bg-slate-700">Record EMI</button>
                        ))}
                    />
                </>
            )}
            {adding && <AddLoanDialog onClose={() => setAdding(false)} onSaved={saved} />}
            {paying && data && <PayDialog loan={paying} banks={data.banks.filter(b => b.type !== 'Cash')} onClose={() => setPaying(null)} onSaved={saved} />}
        </FinancePage>
    );
};

export default LoansPage;
