import { logger } from '@/shared/lib/logger';
import React, { useState, useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { RootState, AppDispatch } from "@/app/store/store";
import {
    Save,
    Plus,
    Calendar as CalendarIcon,
    CheckCircle2,
    Info,
    TrendingUp,
    TrendingDown,
    Loader2,
    PlusCircle,
    Edit2,
    Trash2,
    Pencil,
    XCircle,
    Shield,
    Users,
    Banknote,
    CreditCard,
    ChevronDown
} from 'lucide-react';
import {
    fetchSalaryComponents,
    createSalaryComponent,
    updateSalaryComponent,
    deleteSalaryComponent,
    fetchSalaryStructure,
    fetchAllSalaryStructures,
    fetchAttendanceSummary,
    processIndividualPayout,
    SalaryComponent
} from "@/entities/people/model/payrollSlice";
import { getAccounts } from "@/entities/finance/model/cashbankSlice";
import api from "@/shared/api/api";

const AllowanceManager: React.FC = () => {
    const dispatch = useDispatch<AppDispatch>();
    // Revert to local state for employees since employeeSlice does not exist
    const [employees, setEmployees] = useState<any[]>([]);

    const { components, structures, attendance, loading } = useSelector((state: RootState) => state.payroll);
    const { accounts } = useSelector((state: RootState) => state.cashbank);

    const [selectedDate, setSelectedDate] = useState({ month: new Date().getMonth(), year: new Date().getFullYear() });
    const [selectedBenefitId, setSelectedBenefitId] = useState<string>('ALL');
    const [selectedEmployeeId, setSelectedEmployeeId] = useState<string>('ALL');
    const [payoutFrequency, setPayoutFrequency] = useState<'Monthly' | 'Weekly'>('Monthly');
    const [activeTab, setActiveTab] = useState<'breakdown' | 'list'>('breakdown');

    const [showModal, setShowModal] = useState(false);
    const [editingId, setEditingId] = useState<string | null>(null);
    const [formData, setFormData] = useState<Partial<SalaryComponent>>({
        name: '',
        type: 'EARNING',
        calculationType: 'FLAT',
        defaultValue: 0,
        isTaxable: true,
        isActive: true
    });

    useEffect(() => {
        dispatch(fetchSalaryComponents());
        dispatch(fetchAllSalaryStructures());
        dispatch(fetchAttendanceSummary(selectedDate));
        dispatch(getAccounts());

        // Load employees locally
        const loadEmployees = async () => {
            try {
                const res = await api.get('/hr/employees');
                if (res.data.success) setEmployees(res.data.data);
            } catch (e) {
                logger.error("Failed to load employees");
            }
        };
        loadEmployees();
    }, [dispatch, selectedDate]);

    const handleOpenAdd = () => {
        setEditingId(null);
        setFormData({
            name: '',
            type: 'EARNING',
            calculationType: 'FLAT',
            defaultValue: 0,
            isTaxable: true,
            isActive: true
        });
        setShowModal(true);
    };

    const handleOpenEdit = (comp: SalaryComponent) => {
        setEditingId(comp._id);
        setFormData({ ...comp });
        setShowModal(true);
    };

    const handleDelete = async (id: string, name: string) => {
        if (window.confirm(`Are you sure you want to delete "${name}"? This may affect existing payroll records.`)) {
            try {
                await dispatch(deleteSalaryComponent(id)).unwrap();
            } catch (err) {
                logger.error("Delete failed:", err);
                alert("Failed to delete component. It might be in use.");
            }
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            if (editingId) {
                await dispatch(updateSalaryComponent({ id: editingId, data: formData })).unwrap();
            } else {
                await dispatch(createSalaryComponent(formData)).unwrap();
            }
            setShowModal(false);
        } catch (err) {
            logger.error("Operation failed:", err);
        }
    };

    const handlePayment = async (employeeId: string, bankName: string, workedDays: number) => {
        if (!accounts || accounts.length === 0) {
            alert("No payment accounts found. Please set up a Cash account in Finance -> Cash & Bank.");
            return;
        }

        // Prioritize Cash account if available
        const cashAccount = accounts.find(a => a.accountType === 'Cash');
        const targetAccount = cashAccount || accounts[0];

        const accountId = targetAccount._id;
        const paymentMode = targetAccount.accountType === 'Cash' ? 'CASH' : 'BANK_TRANSFER';
        const isWeekly = payoutFrequency === 'Weekly';

        // Use Cash terminology if paymentMode IS Cash, or generic if bankName is provided
        const paymentLabel = paymentMode === 'CASH' ? 'Cash Payment' : `Payment via ${bankName}`;

        // Directly process payment without confirmation popup
        try {
            await dispatch(processIndividualPayout({
                employeeId,
                month: selectedDate.month,
                year: selectedDate.year,
                paymentMode,
                accountId,
                overrideWorkedDays: isWeekly ? workedDays : undefined,
                force: isWeekly // Allow multiple weekly payments
            })).unwrap();
            alert("Payment Processed Successfully!");
            // Refresh data
            dispatch(fetchAttendanceSummary(selectedDate));
        } catch (err: any) {
            alert(`Payment Failed: ${err}`);
        }
    };

    const earnings = components.filter(c => c.type === 'EARNING');
    const deductions = components.filter(c => c.type === 'DEDUCTION');
    const isTeaAllowanceSelected = earnings.find(c => c._id === selectedBenefitId)?.name === 'Tea Allowance';

    return (
        <div className="space-y-10 animate-in fade-in duration-500">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-2xl font-bold text-main">Allowance Management</h2>
                    <p className="text-muted dark:text-muted text-sm">Define earnings and deductions for your staff payroll.</p>
                </div>
                <button
                    onClick={handleOpenAdd}
                    className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-bold shadow-sm transition-all"
                >
                    <PlusCircle className="w-5 h-5" />
                    Add New Component
                </button>
            </div>

            {/* Tabs */}
            <div className="flex border-b border-default dark:border-default">
                <button
                    onClick={() => setActiveTab('breakdown')}
                    className={`px-6 py-3 text-sm font-bold transition-all border-b-2 ${activeTab === 'breakdown'
                        ? 'border-blue-600 text-blue-600'
                        : 'border-transparent text-muted hover:text-secondary'
                        }`}
                >
                    Employee Benefit Breakdown
                </button>
                <button
                    onClick={() => setActiveTab('list')}
                    className={`px-6 py-3 text-sm font-bold transition-all border-b-2 ${activeTab === 'list'
                        ? 'border-blue-600 text-blue-600'
                        : 'border-transparent text-muted hover:text-secondary'
                        }`}
                >
                    Allowance Configuration
                </button>
            </div>

            {loading && components.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-20 bg-white dark:bg-[var(--erp-card)] rounded-xl border border-default dark:border-default border-dashed">
                    <Loader2 className="w-10 h-10 animate-spin text-blue-500 mb-4" />
                    <p className="text-muted dark:text-muted font-bold">Synchronizing Components...</p>
                </div>
            ) : (
                <>
                    {activeTab === 'breakdown' && (
                        <div className="bg-white dark:bg-[var(--erp-card)] rounded-2xl border border-default dark:border-default overflow-hidden shadow-sm animate-in slide-in-from-bottom-4 duration-500">
                            <div className="p-6 border-b border-default dark:border-default flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                                <div>
                                    <h3 className="text-lg font-bold text-main">Employee Benefit Breakdown</h3>
                                    <div className="flex items-center gap-3 mt-1">
                                        <p className="text-sm text-muted">Overview of calculated allowances. Payments are processed via Cash.</p>
                                    </div>
                                </div>

                                <div className="flex items-center gap-3">
                                    <div className="flex items-center gap-2 bg-[var(--erp-bg-sunken)] dark:bg-[var(--erp-bg)] px-3 py-1.5 rounded-lg border border-default dark:border-default shadow-sm transition-all focus-within:ring-2 focus-within:ring-blue-500/20">
                                        <CalendarIcon className="w-4 h-4 text-blue-500" />
                                        <select
                                            className="bg-transparent text-sm font-bold text-secondary dark:text-slate-200 outline-none cursor-pointer"
                                            value={selectedDate.month}
                                            onChange={(e) => setSelectedDate({ ...selectedDate, month: parseInt(e.target.value) })}
                                        >
                                            {Array.from({ length: 12 }, (_, i) => (
                                                <option key={i} value={i} className="dark:bg-[var(--erp-card)]">{new Date(0, i).toLocaleString('default', { month: 'long' })}</option>
                                            ))}
                                        </select>
                                        <div className="h-4 w-px bg-slate-200 dark:bg-slate-700 mx-1"></div>
                                        <input
                                            type="number"
                                            className="bg-transparent text-sm font-bold text-secondary dark:text-slate-200 w-16 outline-none text-center"
                                            value={selectedDate.year}
                                            onChange={(e) => setSelectedDate({ ...selectedDate, year: parseInt(e.target.value) })}
                                        />
                                    </div>

                                    <div className="flex items-center gap-2 bg-[var(--erp-bg-sunken)] dark:bg-[var(--erp-bg)] px-3 py-1.5 rounded-lg border border-default dark:border-default shadow-sm transition-all focus-within:ring-2 focus-within:ring-blue-500/20">
                                        <Users className="w-4 h-4 text-blue-500" />
                                        <select
                                            className="bg-transparent text-sm font-bold text-secondary dark:text-slate-200 outline-none cursor-pointer"
                                            value={selectedEmployeeId}
                                            onChange={(e) => setSelectedEmployeeId(e.target.value)}
                                        >
                                            <option value="ALL">All Employees</option>
                                            {employees.map(emp => (
                                                <option key={emp._id} value={emp._id}>{emp.name}</option>
                                            ))}
                                        </select>
                                    </div>

                                    <div className="flex items-center gap-2 bg-[var(--erp-bg-sunken)] dark:bg-[var(--erp-bg)] px-3 py-1.5 rounded-lg border border-default dark:border-default shadow-sm transition-all focus-within:ring-2 focus-within:ring-emerald-500/20">
                                        <TrendingUp className="w-4 h-4 text-emerald-500" />
                                        <select
                                            className="bg-transparent text-sm font-bold text-secondary dark:text-slate-200 outline-none cursor-pointer"
                                            value={selectedBenefitId}
                                            onChange={(e) => setSelectedBenefitId(e.target.value)}
                                        >
                                            <option value="ALL">All Benefits</option>
                                            {earnings.map(c => (
                                                <option key={c._id} value={c._id}>{c.name}</option>
                                            ))}
                                        </select>
                                    </div>

                                    <div className="flex bg-[var(--erp-bg-sunken)] dark:bg-slate-700 p-1 rounded-lg">
                                        <button
                                            onClick={() => setPayoutFrequency('Monthly')}
                                            className={`px-3 py-1 text-xs font-bold rounded-md transition-all ${payoutFrequency === 'Monthly' ? 'bg-white dark:bg-slate-600 shadow text-blue-600 dark:text-blue-400' : 'text-muted dark:text-muted hover:text-secondary'}`}
                                        >
                                            Monthly
                                        </button>
                                        <button
                                            onClick={() => setPayoutFrequency('Weekly')}
                                            className={`px-3 py-1 text-xs font-bold rounded-md transition-all ${payoutFrequency === 'Weekly' ? 'bg-white dark:bg-slate-600 shadow text-blue-600 dark:text-blue-400' : 'text-muted dark:text-muted hover:text-secondary'}`}
                                        >
                                            Weekly
                                        </button>
                                    </div>
                                </div>
                            </div>

                            <div className="overflow-x-auto">
                                <table className="w-full text-left border-collapse min-w-[1000px]">
                                    <thead>
                                        <tr className="bg-[var(--erp-bg-sunken)] dark:bg-[var(--erp-bg)]/50">
                                            <th className="px-6 py-4 text-[10px] font-bold text-muted uppercase tracking-widest border-b border-default dark:border-default">Employee</th>
                                            <th className="px-6 py-4 text-[10px] font-bold text-muted uppercase tracking-widest border-b border-default dark:border-default">Worked Days</th>
                                            {!isTeaAllowanceSelected && <th className="px-6 py-4 text-[10px] font-bold text-muted uppercase tracking-widest border-b border-default dark:border-default">Prorated Basic</th>}
                                            {earnings.filter(c => selectedBenefitId === 'ALL' || c._id === selectedBenefitId).map(c => (
                                                <th key={c._id} className="px-6 py-4 text-[10px] font-bold text-emerald-500 uppercase tracking-widest border-b border-default dark:border-default">
                                                    {c.name} {isTeaAllowanceSelected && '(Rate)'}
                                                </th>
                                            ))}
                                            {!isTeaAllowanceSelected && <th className="px-6 py-4 text-[10px] font-bold text-blue-600 dark:text-blue-400 uppercase tracking-widest border-b border-default dark:border-default bg-blue-50/30 dark:bg-blue-900/10">Selection Total</th>}
                                            {isTeaAllowanceSelected && <th className="px-6 py-4 text-[10px] font-bold text-blue-600 dark:text-blue-400 uppercase tracking-widest border-b border-default dark:border-default bg-blue-50/30 dark:bg-blue-900/10">Total Amount</th>}
                                            {!isTeaAllowanceSelected && <th className="px-6 py-4 text-[10px] font-bold text-main uppercase tracking-widest border-b border-default dark:border-default bg-[var(--erp-bg-sunken)]/50 dark:bg-[var(--erp-card)]/50">Total Payout</th>}
                                            <th className="px-6 py-4 text-[10px] font-bold text-muted uppercase tracking-widest border-b border-default dark:border-default">Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
                                        {employees.filter(e => selectedEmployeeId === 'ALL' || e._id === selectedEmployeeId).map(emp => {
                                            const structure = structures[emp._id];
                                            const attRecord = attendance.find((a: any) => (typeof a.employeeId === 'string' ? a.employeeId : a.employeeId._id) === emp._id);

                                            const daysInMonth = new Date(selectedDate.year, selectedDate.month + 1, 0).getDate();
                                            // Determine Effective Worked Days based on Frequency
                                            // Weekly limit logic: Consider leaves only (assumes standard 7 day week - leaves)
                                            // If daily attendance is available, use that. Else default to 7.
                                            const defaultWeeklyDays = 7;
                                            const effectiveWorkedDays = payoutFrequency === 'Weekly' ? (attRecord ? attRecord.workedDays : defaultWeeklyDays) : (attRecord ? attRecord.workedDays : daysInMonth);

                                            // Display Prorated Days if Monthly, else Fixed
                                            const displayDays = effectiveWorkedDays;

                                            const baseSalary = emp.baseSalary || 0;
                                            const basic = (baseSalary / daysInMonth) * effectiveWorkedDays;

                                            // Calculate ALL earnings for the Total Payout regardless of filter
                                            let totalEarningsSum = 0;
                                            let selectedEarningsSum = 0;
                                            earnings.forEach(c => {
                                                const sComp = structure?.components.find((sc: any) =>
                                                    (typeof sc.componentId === 'string' ? sc.componentId : sc.componentId._id) === c._id
                                                );
                                                const value = sComp ? sComp.amount : (c.name === 'Tea Allowance' ? 15 : 0);
                                                let amount = 0;
                                                if (c.calculationType === 'PERCENTAGE') {
                                                    amount = (basic * value) / 100;
                                                } else {
                                                    // Special calculation for Tea Allowance: Rate * Days
                                                    if (c.name === 'Tea Allowance') {
                                                        amount = value * effectiveWorkedDays;
                                                    } else {
                                                        // Prorate flat amount for others
                                                        amount = (value / daysInMonth) * effectiveWorkedDays;
                                                    }
                                                }
                                                totalEarningsSum += amount;
                                                if (selectedBenefitId === 'ALL' || c._id === selectedBenefitId) {
                                                    selectedEarningsSum += amount;
                                                }
                                            });

                                            return (
                                                <tr key={emp._id} className="hover:bg-[var(--erp-bg-sunken)]/50 dark:hover:bg-[var(--erp-bg)]/10 transition-colors">
                                                    <td className="px-6 py-4">
                                                        <div className="font-bold text-main whitespace-nowrap">{emp.name}</div>
                                                        <div className="text-[10px] font-medium text-muted uppercase flex items-center gap-2 mt-0.5">
                                                            <Shield className="w-2.5 h-2.5" /> {emp.role}
                                                        </div>
                                                    </td>
                                                    <td className="px-6 py-4">
                                                        <div className="flex items-center gap-2">
                                                            <span className={`px-2 py-0.5 rounded text-xs font-bold ${displayDays < daysInMonth ? 'bg-orange-100 text-orange-600' : 'bg-emerald-100 text-emerald-600'}`}>
                                                                {displayDays} {payoutFrequency === 'Monthly' ? `/ ${daysInMonth - displayDays}` : '(Fixed)'}
                                                            </span>
                                                            <span className="text-[10px] text-muted font-medium whitespace-nowrap">P / L</span>
                                                        </div>
                                                    </td>
                                                    {!isTeaAllowanceSelected && (
                                                        <td className="px-6 py-4">
                                                            <div className="font-mono text-sm font-bold text-secondary dark:text-muted">₹{Math.round(basic).toLocaleString()}</div>
                                                            {displayDays < daysInMonth && <div className="text-[9px] font-bold text-orange-500 uppercase tracking-tighter">Prorated</div>}
                                                        </td>
                                                    )}
                                                    {earnings.filter(c => selectedBenefitId === 'ALL' || c._id === selectedBenefitId).map(c => {
                                                        const sComp = structure?.components.find((sc: any) =>
                                                            (typeof sc.componentId === 'string' ? sc.componentId : sc.componentId._id) === c._id
                                                        );

                                                        let amount = 0;
                                                        const value = sComp ? sComp.amount : (c.name === 'Tea Allowance' ? 15 : 0);

                                                        if (c.calculationType === 'PERCENTAGE') {
                                                            amount = (basic * value) / 100;
                                                        } else {
                                                            if (c.name === 'Tea Allowance') {
                                                                amount = value * effectiveWorkedDays;
                                                            } else {
                                                                // Prorate flat amount
                                                                amount = (value / daysInMonth) * effectiveWorkedDays;
                                                            }
                                                        }

                                                        return (
                                                            <td key={c._id} className="px-6 py-4 font-mono text-sm text-emerald-600 dark:text-emerald-400 whitespace-nowrap">
                                                                {amount > 0 ? `₹${Math.round(amount).toLocaleString()}` : '-'}
                                                            </td>
                                                        );
                                                    })}
                                                    <td className="px-6 py-4 font-bold text-blue-600 dark:text-blue-400 bg-blue-50/30 dark:bg-blue-900/10">
                                                        <div className="font-mono">₹{Math.round(isTeaAllowanceSelected ? selectedEarningsSum : selectedEarningsSum + basic).toLocaleString()}</div>
                                                        <div className="text-[9px] text-blue-400 font-medium uppercase mt-0.5 tracking-tighter whitespace-nowrap">
                                                            {isTeaAllowanceSelected ? 'Total Amount' : 'Selection Total'}
                                                        </div>
                                                    </td>
                                                    {!isTeaAllowanceSelected && (
                                                        <td className="px-6 py-4 font-bold text-main bg-[var(--erp-bg-sunken)]/50 dark:bg-[var(--erp-bg)]/10">
                                                            <div className="text-blue-600 dark:text-blue-400">₹{Math.round(totalEarningsSum + basic).toLocaleString()}</div>
                                                            <div className="text-[9px] text-muted font-medium uppercase mt-0.5 tracking-tighter whitespace-nowrap">Gross Estimate</div>
                                                        </td>
                                                    )}
                                                    <td className="px-6 py-4">
                                                        <div className="flex items-center gap-2">
                                                            <button
                                                                onClick={() => handlePayment(emp._id, accounts[0]?.bankName || 'Cash', effectiveWorkedDays)}
                                                                className="flex items-center gap-1.5 bg-blue-600 hover:bg-blue-700 text-white px-3 py-1.5 rounded-lg text-xs font-bold transition-all shadow-sm shadow-blue-500/20"
                                                            >
                                                                <Banknote className="w-3.5 h-3.5" />
                                                                Pay
                                                            </button>
                                                        </div>
                                                    </td>
                                                </tr>
                                            );
                                        })}
                                    </tbody>
                                    <tfoot className="bg-[var(--erp-bg-sunken)] dark:bg-[var(--erp-bg)]/50 border-t-2 border-default dark:border-default">
                                        <tr className="font-bold">
                                            <td className="px-6 py-4 text-main uppercase tracking-wider">Total</td>
                                            <td className="px-6 py-4 border-b border-transparent text-muted font-mono text-[10px]">
                                                {employees.filter(e => selectedEmployeeId === 'ALL' || e._id === selectedEmployeeId).reduce((sum, emp) => {
                                                    const attRecord = attendance.find((a: any) => (typeof a.employeeId === 'string' ? a.employeeId : a.employeeId._id) === emp._id);
                                                    return sum + (attRecord ? attRecord.workedDays : new Date(selectedDate.year, selectedDate.month + 1, 0).getDate());
                                                }, 0)} d
                                            </td>
                                            {!isTeaAllowanceSelected && (
                                                <td className="px-6 py-4 text-main font-mono">
                                                    ₹{Math.round(employees.filter(e => selectedEmployeeId === 'ALL' || e._id === selectedEmployeeId).reduce((sum, emp) => {
                                                        const attRecord = attendance.find((a: any) => (typeof a.employeeId === 'string' ? a.employeeId : a.employeeId._id) === emp._id);
                                                        const daysInMonth = new Date(selectedDate.year, selectedDate.month + 1, 0).getDate();
                                                        const workedDays = attRecord ? attRecord.workedDays : daysInMonth;
                                                        return sum + ((emp.baseSalary || 0) / daysInMonth) * workedDays;
                                                    }, 0)).toLocaleString()}
                                                </td>
                                            )}
                                            {earnings.filter(c => selectedBenefitId === 'ALL' || c._id === selectedBenefitId).map(c => {
                                                const total = employees.filter(e => selectedEmployeeId === 'ALL' || e._id === selectedEmployeeId).reduce((sum, emp) => {
                                                    const structure = structures[emp._id];
                                                    const attRecord = attendance.find((a: any) => (typeof a.employeeId === 'string' ? a.employeeId : a.employeeId._id) === emp._id);
                                                    const daysInMonth = new Date(selectedDate.year, selectedDate.month + 1, 0).getDate();
                                                    const workedDays = attRecord ? attRecord.workedDays : daysInMonth;
                                                    const basic = ((emp.baseSalary || 0) / daysInMonth) * workedDays;

                                                    const sComp = structure?.components.find((sc: any) =>
                                                        (typeof sc.componentId === 'string' ? sc.componentId : sc.componentId._id) === c._id
                                                    );
                                                    const value = sComp ? sComp.amount : (c.name === 'Tea Allowance' ? 15 : 0);
                                                    return sum + (c.calculationType === 'PERCENTAGE' ? (basic * value) / 100 : value);
                                                }, 0);

                                                return (
                                                    <td key={c._id} className="px-6 py-4 text-emerald-600 dark:text-emerald-400 font-mono">
                                                        ₹{Math.round(total).toLocaleString()}
                                                    </td>
                                                );
                                            })}
                                            <td className="px-6 py-4 text-blue-600 dark:text-blue-400 font-mono bg-blue-50/30 dark:bg-blue-900/10">
                                                ₹{Math.round(employees.filter(e => selectedEmployeeId === 'ALL' || e._id === selectedEmployeeId).reduce((sum, emp) => {
                                                    const structure = structures[emp._id];
                                                    const attRecord = attendance.find((a: any) => (typeof a.employeeId === 'string' ? a.employeeId : a.employeeId._id) === emp._id);
                                                    const daysInMonth = new Date(selectedDate.year, selectedDate.month + 1, 0).getDate();
                                                    const workedDays = attRecord ? attRecord.workedDays : daysInMonth;
                                                    const basic = ((emp.baseSalary || 0) / daysInMonth) * workedDays;

                                                    let selectedEarningsSum = 0;
                                                    earnings.forEach(c => {
                                                        if (selectedBenefitId === 'ALL' || c._id === selectedBenefitId) {
                                                            const sComp = structure?.components.find((sc: any) =>
                                                                (typeof sc.componentId === 'string' ? sc.componentId : sc.componentId._id) === c._id
                                                            );
                                                            const value = sComp ? sComp.amount : (c.name === 'Tea Allowance' ? 15 : 0);
                                                            if (c.calculationType === 'PERCENTAGE') {
                                                                selectedEarningsSum += (basic * value) / 100;
                                                            } else {
                                                                if (c.name === 'Tea Allowance') {
                                                                    selectedEarningsSum += value * workedDays;
                                                                } else {
                                                                    selectedEarningsSum += (value / daysInMonth) * workedDays;
                                                                }
                                                            }
                                                        }
                                                    });
                                                    return sum + (isTeaAllowanceSelected ? selectedEarningsSum : selectedEarningsSum + basic);
                                                }, 0)).toLocaleString()}
                                            </td>
                                            {!isTeaAllowanceSelected && (
                                                <td className="px-6 py-4 text-blue-600 dark:text-blue-400 font-mono bg-[var(--erp-bg-sunken)]/50 dark:bg-[var(--erp-card)]/50">
                                                    ₹{Math.round(employees.filter(e => selectedEmployeeId === 'ALL' || e._id === selectedEmployeeId).reduce((sum, emp) => {
                                                        const structure = structures[emp._id];
                                                        const attRecord = attendance.find((a: any) => (typeof a.employeeId === 'string' ? a.employeeId : a.employeeId._id) === emp._id);
                                                        const daysInMonth = new Date(selectedDate.year, selectedDate.month + 1, 0).getDate();
                                                        const workedDays = attRecord ? attRecord.workedDays : daysInMonth;
                                                        const basic = ((emp.baseSalary || 0) / daysInMonth) * workedDays;

                                                        let earningsSum = 0;
                                                        earnings.forEach(c => {
                                                            const sComp = structure?.components.find((sc: any) =>
                                                                (typeof sc.componentId === 'string' ? sc.componentId : sc.componentId._id) === c._id
                                                            );
                                                            const value = sComp ? sComp.amount : (c.name === 'Tea Allowance' ? 15 : 0);
                                                            if (c.calculationType === 'PERCENTAGE') {
                                                                earningsSum += (basic * value) / 100;
                                                            } else {
                                                                if (c.name === 'Tea Allowance') {
                                                                    earningsSum += value * workedDays;
                                                                } else {
                                                                    earningsSum += (value / daysInMonth) * workedDays;
                                                                }
                                                            }
                                                        });
                                                        return sum + basic + earningsSum;
                                                    }, 0)).toLocaleString()}
                                                </td>
                                            )}
                                            <td className="px-6 py-4 border-b border-transparent"></td>
                                        </tr>
                                    </tfoot>
                                </table>
                            </div>
                            {attendance.length === 0 && (
                                <div className="p-4 bg-blue-50 dark:bg-blue-900/10 border-t border-blue-100 dark:border-blue-900/20 flex items-center gap-3">
                                    <Info className="w-5 h-5 text-blue-500 shrink-0" />
                                    <div className="text-xs text-blue-700 dark:text-blue-400 font-medium">
                                        No attendance summaries found for this month. Calculations are shown based on full working days ({new Date(selectedDate.year, selectedDate.month + 1, 0).getDate()} days).
                                    </div>
                                </div>
                            )}
                        </div>
                    )}

                    {activeTab === 'list' && (
                        <div className="grid lg:grid-cols-2 gap-8 animate-in slide-in-from-bottom-4 duration-500">
                            {/* Earnings Section */}
                            <div className="space-y-4">
                                <div className="flex items-center gap-2 text-emerald-600 dark:text-emerald-400 font-bold uppercase tracking-wider text-sm px-1">
                                    <TrendingUp className="w-4 h-4" />
                                    Earnings (Allowances)
                                </div>
                                <div className="grid gap-3">
                                    {earnings.length === 0 ? (
                                        <div className="p-8 text-center bg-white dark:bg-[var(--erp-card)] rounded-xl border border-dashed border-default dark:border-default text-muted">
                                            No earnings defined.
                                        </div>
                                    ) : (
                                        earnings.map(comp => (
                                            <ComponentCard
                                                key={comp._id}
                                                component={comp}
                                                onEdit={() => handleOpenEdit(comp)}
                                                onDelete={() => handleDelete(comp._id, comp.name)}
                                            />
                                        ))
                                    )}
                                </div>
                            </div>

                            {/* Deductions Section */}
                            <div className="space-y-4">
                                <div className="flex items-center gap-2 text-rose-600 dark:text-rose-400 font-bold uppercase tracking-wider text-sm px-1">
                                    <TrendingDown className="w-4 h-4" />
                                    Deductions
                                </div>
                                <div className="grid gap-3">
                                    {deductions.length === 0 ? (
                                        <div className="p-8 text-center bg-white dark:bg-[var(--erp-card)] rounded-xl border border-dashed border-default dark:border-default text-muted">
                                            No deductions defined.
                                        </div>
                                    ) : (
                                        deductions.map(comp => (
                                            <ComponentCard
                                                key={comp._id}
                                                component={comp}
                                                onEdit={() => handleOpenEdit(comp)}
                                                onDelete={() => handleDelete(comp._id, comp.name)}
                                            />
                                        ))
                                    )}
                                </div>
                            </div>
                        </div>
                    )}
                </>
            )}

            {/* Form Modal */}
            {showModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[var(--erp-bg)]/60 backdrop-blur-sm animate-in fade-in">
                    <div className="bg-white dark:bg-[var(--erp-card)] rounded-2xl shadow-2xl w-full max-w-md overflow-hidden border border-default dark:border-default">
                        <div className="p-6 border-b border-default dark:border-default bg-[var(--erp-bg-sunken)] dark:bg-[var(--erp-bg)]/50 flex items-center justify-between">
                            <h3 className="text-lg font-bold text-main dark:text-main flex items-center gap-2">
                                {editingId ? <Pencil className="w-5 h-5 text-blue-600" /> : <PlusCircle className="w-5 h-5 text-blue-600" />}
                                {editingId ? 'Edit Component' : 'New Salary Component'}
                            </h3>
                            <button onClick={() => setShowModal(false)} className="text-muted hover:text-secondary dark:hover:text-slate-200">
                                <XCircle className="w-6 h-6" />
                            </button>
                        </div>
                        <form onSubmit={handleSubmit} className="p-6 space-y-4">
                            <div>
                                <label className="block text-xs font-bold text-muted uppercase mb-1">Component Name</label>
                                <input
                                    required
                                    className="w-full px-3 py-2 border border-default dark:border-default bg-white dark:bg-[var(--erp-bg)] rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-sm dark:text-main"
                                    placeholder="e.g., Basic Salary, HRA, Provident Fund"
                                    value={formData.name}
                                    onChange={e => setFormData({ ...formData, name: e.target.value })}
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs font-bold text-muted uppercase mb-1">Type</label>
                                    <select
                                        className="w-full px-3 py-2 border border-default dark:border-default bg-white dark:bg-[var(--erp-bg)] rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-sm dark:text-main"
                                        value={formData.type}
                                        onChange={e => setFormData({ ...formData, type: e.target.value as any })}
                                    >
                                        <option value="EARNING">Earning</option>
                                        <option value="DEDUCTION">Deduction</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-muted uppercase mb-1">Calculation</label>
                                    <select
                                        className="w-full px-3 py-2 border border-default dark:border-default bg-white dark:bg-[var(--erp-bg)] rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-sm dark:text-main"
                                        value={formData.calculationType}
                                        onChange={e => setFormData({ ...formData, calculationType: e.target.value as any })}
                                    >
                                        <option value="FLAT">Flat Amount</option>
                                        <option value="PERCENTAGE">% of Basic</option>
                                    </select>
                                </div>
                            </div>

                            <div>
                                <label className="block text-xs font-bold text-muted uppercase mb-1">Default Value</label>
                                <input
                                    type="number"
                                    className="w-full px-3 py-2 border border-default dark:border-default bg-white dark:bg-[var(--erp-bg)] rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-sm dark:text-main"
                                    placeholder="0"
                                    value={formData.defaultValue}
                                    onChange={e => setFormData({ ...formData, defaultValue: parseFloat(e.target.value) || 0 })}
                                />
                            </div>

                            <div className="flex gap-4 p-3 bg-[var(--erp-bg-sunken)] dark:bg-[var(--erp-bg)]/50 rounded-xl border border-default dark:border-default">
                                <label className="flex items-center gap-2 cursor-pointer group">
                                    <input
                                        type="checkbox"
                                        className="w-4 h-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                                        checked={formData.isTaxable}
                                        onChange={e => setFormData({ ...formData, isTaxable: e.target.checked })}
                                    />
                                    <span className="text-xs font-medium text-secondary dark:text-muted group-hover:text-main dark:group-hover:text-slate-200 transition-colors">Is Taxable</span>
                                </label>
                                <label className="flex items-center gap-2 cursor-pointer group">
                                    <input
                                        type="checkbox"
                                        className="w-4 h-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                                        checked={formData.isActive}
                                        onChange={e => setFormData({ ...formData, isActive: e.target.checked })}
                                    />
                                    <span className="text-xs font-medium text-secondary dark:text-muted group-hover:text-main dark:group-hover:text-slate-200 transition-colors">Is Active</span>
                                </label>
                            </div>

                            <div className="flex gap-3 pt-4">
                                <button
                                    type="button"
                                    onClick={() => setShowModal(false)}
                                    className="flex-1 px-4 py-2 border border-default dark:border-default text-secondary dark:text-muted rounded-lg font-bold hover:bg-[var(--erp-bg-sunken)] dark:hover:bg-slate-700 transition-colors"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    className="flex-1 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-bold shadow-sm transition-all shadow-blue-500/20 flex items-center justify-center gap-2"
                                >
                                    {editingId ? <Save className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
                                    {editingId ? 'Save Changes' : 'Create Component'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

const ComponentCard = ({
    component,
    onEdit,
    onDelete
}: {
    component: SalaryComponent,
    onEdit: () => void,
    onDelete: () => void
}) => {
    return (
        <div className="bg-white dark:bg-[var(--erp-card)] p-4 rounded-xl shadow-sm border border-default dark:border-default group hover:shadow-md transition-all flex items-center justify-between">
            <div className="flex items-center gap-4">
                <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold transition-colors ${component.type === 'EARNING'
                    ? 'bg-emerald-50 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 group-hover:bg-emerald-100'
                    : 'bg-rose-50 dark:bg-rose-900/30 text-rose-600 dark:text-rose-400 group-hover:bg-rose-100'
                    }`}>
                    {component.name.charAt(0)}
                </div>
                <div>
                    <h4 className="font-bold text-main dark:text-main flex items-center gap-2">
                        {component.name}
                        {!component.isActive && <span className="text-[10px] bg-[var(--erp-bg-sunken)] dark:bg-slate-700 text-muted px-1.5 py-0.5 rounded uppercase tracking-wider">Inactive</span>}
                    </h4>
                    <div className="flex items-center gap-3 text-xs text-muted dark:text-muted mt-0.5">
                        <span className="font-mono bg-[var(--erp-bg-sunken)] dark:bg-[var(--erp-bg)] px-1 rounded border border-default dark:border-default">
                            {component.calculationType === 'FLAT' ? 'Fixed ₹' : `${component.defaultValue}% of Basic`}
                        </span>
                        {component.calculationType === 'FLAT' && <span>₹{component.defaultValue.toLocaleString()}</span>}
                        <span className="text-muted dark:text-secondary">|</span>
                        <span className={`flex items-center gap-1 ${component.isTaxable ? 'text-amber-600 dark:text-amber-400' : 'text-muted'}`}>
                            <CheckCircle2 className="w-3 h-3" />
                            {component.isTaxable ? 'Taxable' : 'Non-Taxable'}
                        </span>
                    </div>
                </div>
            </div>
            <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                <button
                    onClick={onEdit}
                    className="p-2 text-muted hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/30 rounded-lg transition-all"
                >
                    <Pencil className="w-4 h-4" />
                </button>
                <button
                    onClick={onDelete}
                    className="p-2 text-muted hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-900/30 rounded-lg transition-all"
                >
                    <Trash2 className="w-4 h-4" />
                </button>
            </div>
        </div>
    );
};

export default AllowanceManager;
