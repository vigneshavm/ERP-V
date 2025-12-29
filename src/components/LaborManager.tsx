
import React, { useState } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { RootState, AppDispatch, addEmployee, markAttendance, addLaborPayment, ensureBranchRecorded } from '../store';
import { Card } from './Card';
import { TimeEntryModal } from './TimeEntryModal';
import { Users, Plus, CalendarIcon, ChevronLeft, ChevronRight, CheckSquare, ListChecks, Wallet, CheckCircle2, Clock, PieChart, XCircle, IndianRupee, Calculator, X, } from 'lucide-react';
import { formatCurrency, getDaysInMonth, getFirstDayOfMonth, formatDateISO } from '../utils/helpers';
import { Branch, AttendanceStatus } from '../types/common';
import { DailyLog } from '../types/hr';
import { Sector } from '../types/common';
// Helper for ID generation (outside component to satisfy purity rules)
const generateId = () => Math.random().toString(36).substr(2, 9);

export const LaborManager = () => {
  const dispatch = useDispatch<AppDispatch>();
  const { employees, attendance, payments } = useSelector((state: RootState) => state.labor);
  const { currentSector, currentBranch } = useSelector((state: RootState) => state.auth);
  const tenantBranches = useSelector((state: RootState) => state.tenant.branches);

  // -- State --
  const [selectedLaborerId, setSelectedLaborerId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'ATTENDANCE' | 'PAYMENTS'>('ATTENDANCE');

  // View State
  const [currentDate, setCurrentDate] = useState(new Date());
  const [isAddingLaborer, setIsAddingLaborer] = useState(false);
  const [paymentAmount, setPaymentAmount] = useState('');
  const [paymentType, setPaymentType] = useState<'SALARY' | 'ADVANCE'>('ADVANCE');
  const [paymentNote, setPaymentNote] = useState('');

  // Selection Mode State (Calendar)
  const [isSelectionMode, setIsSelectionMode] = useState(false);
  const [selectedDates, setSelectedDates] = useState<Set<string>>(new Set());

  // Time Entry State
  const [editingDate, setEditingDate] = useState<string | null>(null);

  // New Laborer Form State
  const [newEmp, setNewEmp] = useState({ name: '', role: '', dailyRate: '', branch: currentBranch === 'All' ? 'Alpha' : currentBranch });
  const [wageType, setWageType] = useState<'DAILY' | 'MONTHLY'>('DAILY');
  const [monthlyInput, setMonthlyInput] = useState('');

  // -- Computed Values --
  const currentYear = currentDate.getFullYear();
  const currentMonth = currentDate.getMonth();
  const currentMonthName = currentDate.toLocaleString('default', { month: 'long', year: 'numeric' });

  // Filter Employees
  const sectorEmps = employees.filter(e =>
    e.sector === currentSector && (currentBranch === 'All' || e.branchId === currentBranch)
  );

  // Default selection
  if (!selectedLaborerId && sectorEmps.length > 0) {
    setSelectedLaborerId(sectorEmps[0].id);
  }

  const selectedLaborer = sectorEmps.find(l => l.id === selectedLaborerId);

  // Destructure for stable dependencies
  const selectedId = selectedLaborer?.id;
  const selectedDailyRate = selectedLaborer?.dailyRate;

  // Calculate Stats for Selected Month
  const stats = (() => {
    if (!selectedId) return { days: 0, full: 0, half: 0, quarter: 0, absent: 0, earned: 0, paid: 0, balance: 0, totalPaid: 0 };

    // Filter data for this employee
    const empAttendance = attendance.filter(a => a.employeeId === selectedId);
    const empPayments = payments.filter(p => p.employeeId === selectedId);

    let daysCount = 0;
    let full = 0;
    let half = 0;
    let quarter = 0;
    let absent = 0;
    let monthlyAdvance = 0;

    const daysInMonth = getDaysInMonth(currentYear, currentMonth);
    // Loop through days of selected month to calculate EARNINGS for this month
    for (let d = 1; d <= daysInMonth; d++) {
      const dateKey = formatDateISO(currentYear, currentMonth, d);
      const log = empAttendance.find(a => a.date === dateKey);

      if (log) {
        if (log.status === 'PRESENT') { daysCount += 1; full += 1; }
        else if (log.status === 'HALF') { daysCount += 0.5; half += 1; }
        else if (log.status === 'QUARTER') { daysCount += 0.25; quarter += 1; }
        else if (log.status === 'ABSENT') { absent += 1; }

        monthlyAdvance += (log.advanceTaken || 0);
      }
    }

    const totalEarned = daysCount * (selectedDailyRate || 0);

    // Payments in this month
    const monthlyPayments = empPayments.filter(p => {
      const pDate = new Date(p.date);
      return pDate.getMonth() === currentMonth && pDate.getFullYear() === currentYear;
    });

    const totalPaidInMonth = monthlyPayments.reduce((sum, p) => sum + p.amount, 0) + monthlyAdvance;

    // GLOBAL BALANCE CALCULATION (Not just this month)
    // Balance = (All Time Earnings) - (All Time Payments + All Time Advances)
    const allTimeAttendance = attendance.filter(a => a.employeeId === selectedId);
    let allTimeDays = 0;
    let allTimeAdvances = 0;

    allTimeAttendance.forEach(log => {
      let d = 0;
      if (log.status === 'PRESENT') d = 1;
      else if (log.status === 'HALF') d = 0.5;
      else if (log.status === 'QUARTER') d = 0.25;
      allTimeDays += d;
      allTimeAdvances += (log.advanceTaken || 0);
    });

    const allTimeEarned = allTimeDays * (selectedDailyRate || 0);
    const allTimePayments = empPayments.reduce((sum, p) => sum + p.amount, 0);
    const totalPaidAllTime = allTimePayments + allTimeAdvances;
    const balance = allTimeEarned - totalPaidAllTime;

    return {
      days: daysCount,
      full,
      half,
      quarter,
      absent,
      earned: totalEarned, // This month earned
      paid: totalPaidInMonth, // This month paid out
      balance: balance, // Global Net Payable
      totalPaid: totalPaidAllTime
    };
  })();


  // -- Handlers --

  const handleAddLaborer = (e: React.FormEvent) => {
    e.preventDefault();
    // Ensure branch recorded in global branch table (attempt to find in tenant locations first)
    const branchIdentifier = newEmp.branch || (currentBranch === 'All' ? 'Alpha' : currentBranch);
    dispatch(ensureBranchRecorded({ branchId: branchIdentifier }));

    dispatch(addEmployee({
      id: generateId(),
      name: newEmp.name,
      role: newEmp.role,
      dailyRate: parseFloat(newEmp.dailyRate),
      sector: currentSector as Sector,
      branchId: newEmp.branch as Branch,
      systemRole: 'Staff',
      pin: '0000'
    }));
    setIsAddingLaborer(false);
    setNewEmp({ name: '', role: '', dailyRate: '', branch: currentBranch === 'All' ? 'Alpha' : currentBranch });
  };

  const handleMonthlyChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setMonthlyInput(val);
    const monthly = parseFloat(val);
    if (!isNaN(monthly)) {
      const daily = Math.round(monthly / 30);
      setNewEmp({ ...newEmp, dailyRate: daily.toString() });
    } else {
      setNewEmp({ ...newEmp, dailyRate: '' });
    }
  };

  const toggleSelectionMode = () => {
    setIsSelectionMode(!isSelectionMode);
    setSelectedDates(new Set()); // Clear on toggle
  };

  const handleDateClick = (day: number) => {
    if (!selectedLaborer) return;
    const dateKey = formatDateISO(currentYear, currentMonth, day);

    if (isSelectionMode) {
      const newSet = new Set(selectedDates);
      if (newSet.has(dateKey)) {
        newSet.delete(dateKey);
      } else {
        newSet.add(dateKey);
      }
      setSelectedDates(newSet);
    } else {
      setEditingDate(dateKey);
    }
  };

  const handleBulkAction = (status: AttendanceStatus | 'CLEAR') => {
    if (!selectedLaborer) return;

    selectedDates.forEach(dateKey => {
      // Check existing to preserve advanceTaken if any, or create new
      const existing = attendance.find(a => a.employeeId === selectedLaborer.id && a.date === dateKey);

      if (status === 'CLEAR') {
        dispatch(markAttendance({
          id: existing?.id || generateId(),
          employeeId: selectedLaborer.id,
          date: dateKey,
          status: 'ABSENT',
          advanceTaken: existing?.advanceTaken || 0
        }));
      } else {
        dispatch(markAttendance({
          id: existing?.id || generateId(),
          employeeId: selectedLaborer.id,
          date: dateKey,
          status: status,
          advanceTaken: existing?.advanceTaken || 0,
          inTime: status === 'PRESENT' ? '09:00' : undefined,
          outTime: status === 'PRESENT' ? '18:00' : undefined
        }));
      }
    });

    setIsSelectionMode(false);
    setSelectedDates(new Set());
  };

  const handleSaveAttendance = (log: DailyLog | null) => {
    if (!selectedLaborer || !editingDate) return;

    const existing = attendance.find(a => a.employeeId === selectedLaborer.id && a.date === editingDate);

    if (log) {
      dispatch(markAttendance({
        id: existing?.id || generateId(),
        employeeId: selectedLaborer.id,
        date: editingDate,
        status: log.status,
        advanceTaken: existing?.advanceTaken || 0, // Modal doesn't handle advance currently, preserve it
        inTime: log.inTime,
        outTime: log.outTime
      }));
    } else {
      // If null (cleared), set to Absent
      dispatch(markAttendance({
        id: existing?.id || generateId(),
        employeeId: selectedLaborer.id,
        date: editingDate,
        status: 'ABSENT',
        advanceTaken: existing?.advanceTaken || 0
      }));
    }
  };

  const handleAddPayment = () => {
    if (!selectedLaborer || !paymentAmount) return;
    const amount = parseFloat(paymentAmount);
    if (isNaN(amount) || amount <= 0) return;

    dispatch(addLaborPayment({
      id: generateId(),
      employeeId: selectedLaborer.id,
      amount: amount,
      date: new Date().toISOString(),
      type: paymentType,
      note: paymentNote
    }));

    setPaymentAmount('');
    setPaymentNote('');
  };

  const changeMonth = (delta: number) => {
    setCurrentDate(new Date(currentYear, currentMonth + delta, 1));
    setSelectedDates(new Set());
  };

  // -- Calendar Logic --
  const renderCalendar = () => {
    const daysInMonth = getDaysInMonth(currentYear, currentMonth);
    const firstDay = getFirstDayOfMonth(currentYear, currentMonth);
    const blanks = Array(firstDay).fill(null);
    const days = Array.from({ length: daysInMonth }, (_, i) => i + 1);

    return (
      <div className="grid grid-cols-7 gap-1 mb-2 select-none">
        {['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'].map(d => (
          <div key={d} className="text-center text-[10px] font-bold text-slate-400 dark:text-slate-500 py-1 uppercase">{d}</div>
        ))}

        {blanks.map((_, i) => <div key={`blank-${i}`} className="h-9" />)}

        {days.map(day => {
          const dateKey = formatDateISO(currentYear, currentMonth, day);
          // Find log for this specific employee
          const log = attendance.find(a => a.employeeId === selectedLaborerId && a.date === dateKey);
          const status = log?.status;
          const isSelected = selectedDates.has(dateKey);

          let bgClass = 'bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 hover:border-blue-400 dark:hover:border-blue-500';
          let textClass = 'text-slate-700 dark:text-slate-200';
          let icon = null;

          if (status === 'PRESENT') {
            bgClass = 'bg-emerald-100 dark:bg-emerald-900/40 border-emerald-200 dark:border-emerald-800';
            textClass = 'text-emerald-700 dark:text-emerald-300 font-bold';
            icon = <CheckCircle2 className="w-3 h-3" />;
          } else if (status === 'HALF') {
            bgClass = 'bg-amber-100 dark:bg-amber-900/40 border-amber-200 dark:border-amber-800';
            textClass = 'text-amber-700 dark:text-amber-300 font-bold';
            icon = <Clock className="w-3 h-3" />;
          } else if (status === 'QUARTER') {
            bgClass = 'bg-purple-100 dark:bg-purple-900/40 border-purple-200 dark:border-purple-800';
            textClass = 'text-purple-700 dark:text-purple-300 font-bold';
            icon = <PieChart className="w-3 h-3" />;
          } else if (status === 'ABSENT') {
            bgClass = 'bg-rose-50 dark:bg-rose-900/40 border-rose-200 dark:border-rose-800';
            textClass = 'text-rose-400 dark:text-rose-300 font-bold';
            icon = <XCircle className="w-3 h-3" />;
          }

          if (isSelected) {
            bgClass = 'bg-blue-600 border-blue-600 shadow-md ring-2 ring-blue-200 dark:ring-blue-900';
            textClass = 'text-white';
            icon = null;
          }

          return (
            <button
              key={day}
              onClick={() => handleDateClick(day)}
              className={`h-9 w-full flex flex-col items-center justify-center rounded-md border transition-all relative ${bgClass}`}
            >
              <span className={`text-[10px] ${textClass}`}>{day}</span>
              {icon && !isSelected && <div className="mt-0.5">{icon}</div>}
              {isSelected && <div className="absolute top-0.5 right-0.5 w-1.5 h-1.5 bg-white rounded-full"></div>}
              {log?.advanceTaken ? <div className="absolute bottom-0.5 right-0.5 w-1.5 h-1.5 bg-amber-500 rounded-full" title="Advance Taken"></div> : null}
            </button>
          );
        })}
      </div>
    );
  };

  return (
    <div className="flex flex-col lg:flex-row h-full lg:h-[calc(100vh-7rem)] gap-4 animate-in fade-in relative">

      {/* Time Entry Modal */}
      {editingDate && (
        <TimeEntryModal
          key={`${editingDate}-${selectedLaborerId}`}
          isOpen={!!editingDate}
          date={editingDate}
          onClose={() => setEditingDate(null)}
          onSave={handleSaveAttendance}
          initialData={attendance.find(a => a.employeeId === selectedLaborerId && a.date === editingDate)}
        />
      )}

      {/* Sidebar: Labor List */}
      <div className="w-full lg:w-72 flex flex-col gap-3 shrink-0">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-bold text-slate-800 dark:text-white flex items-center gap-2">
            <Users className="text-blue-600 dark:text-blue-400" size={20} /> Laborers
          </h2>
          <button
            onClick={() => setIsAddingLaborer(!isAddingLaborer)}
            className="p-1.5 bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded-lg hover:bg-blue-200 dark:hover:bg-blue-900/50 transition"
          >
            <Plus size={18} />
          </button>
        </div>

        {/* Add Laborer Form */}
        {isAddingLaborer && (
          <Card className="p-3 bg-blue-50 dark:bg-slate-800 border-blue-100 dark:border-slate-700 shadow-md relative z-10">
            <h4 className="font-bold text-blue-800 dark:text-blue-300 mb-2 text-xs">New Laborer Details</h4>
            <form onSubmit={handleAddLaborer} className="space-y-2">
              <input
                type="text"
                placeholder="Full Name"
                value={newEmp.name}
                onChange={e => setNewEmp({ ...newEmp, name: e.target.value })}
                className="w-full p-2 text-xs rounded border border-blue-200 dark:border-slate-600 bg-white dark:bg-slate-900 text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-blue-300"
                autoFocus
              />
              <input
                type="text"
                placeholder="Role"
                value={newEmp.role}
                onChange={e => setNewEmp({ ...newEmp, role: e.target.value })}
                className="w-full p-2 text-xs rounded border border-blue-200 dark:border-slate-600 bg-white dark:bg-slate-900 text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-blue-300"
              />

              <div className="flex bg-white dark:bg-slate-900 rounded border border-blue-200 dark:border-slate-600 overflow-hidden">
                <button
                  type="button"
                  onClick={() => setWageType('DAILY')}
                  className={`flex-1 py-1.5 text-[10px] font-bold transition-colors ${wageType === 'DAILY' ? 'bg-blue-600 text-white' : 'text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800'}`}
                >
                  Daily Rate
                </button>
                <div className="w-px bg-blue-200 dark:bg-slate-600"></div>
                <button
                  type="button"
                  onClick={() => setWageType('MONTHLY')}
                  className={`flex-1 py-1.5 text-[10px] font-bold transition-colors ${wageType === 'MONTHLY' ? 'bg-blue-600 text-white' : 'text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800'}`}
                >
                  Monthly Salary
                </button>
              </div>

              {wageType === 'DAILY' ? (
                <div className="relative">
                  <IndianRupee size={12} className="absolute left-2 top-2.5 text-slate-400" />
                  <input
                    type="number"
                    placeholder="Daily Wage"
                    value={newEmp.dailyRate}
                    onChange={e => setNewEmp({ ...newEmp, dailyRate: e.target.value })}
                    className="w-full pl-6 p-2 text-xs rounded border border-blue-200 dark:border-slate-600 bg-white dark:bg-slate-900 text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-blue-300"
                  />
                </div>
              ) : (
                <div className="space-y-1">
                  <div className="relative">
                    <IndianRupee size={12} className="absolute left-2 top-2.5 text-slate-400" />
                    <input
                      type="number"
                      placeholder="Monthly Salary"
                      value={monthlyInput}
                      onChange={handleMonthlyChange}
                      className="w-full pl-6 p-2 text-xs rounded border border-blue-200 dark:border-slate-600 bg-white dark:bg-slate-900 text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-blue-300"
                    />
                  </div>
                  {newEmp.dailyRate && (
                    <div className="flex items-center gap-1.5 text-[10px] text-blue-700 dark:text-blue-300 bg-blue-100/50 dark:bg-blue-900/30 p-1.5 rounded">
                      <Calculator size={10} />
                      <span>Daily: {formatCurrency(parseFloat(newEmp.dailyRate))} (Calc: /30)</span>
                    </div>
                  )}
                </div>
              )}

              <div className="flex gap-2 mt-1">
                <button type="submit" className="flex-1 bg-blue-600 text-white py-1 rounded text-xs font-medium hover:bg-blue-700">Save</button>
                <button type="button" onClick={() => setIsAddingLaborer(false)} className="flex-1 bg-white dark:bg-slate-700 text-slate-600 dark:text-slate-300 py-1 rounded text-xs font-medium hover:bg-slate-50 dark:hover:bg-slate-600">Cancel</button>
              </div>
            </form>
          </Card>
        )}

        <div className="flex-1 overflow-y-auto space-y-2 custom-scrollbar pr-1">
          {sectorEmps.length === 0 && <p className="text-xs text-slate-400 text-center py-4">No employees in this branch.</p>}
          {sectorEmps.map(l => (
            <button
              key={l.id}
              onClick={() => setSelectedLaborerId(l.id)}
              className={`w-full text-left p-2.5 rounded-lg border transition-all flex justify-between items-center group
                ${selectedLaborerId === l.id
                  ? 'bg-slate-800 dark:bg-slate-700 text-white border-slate-800 dark:border-slate-600 shadow-md'
                  : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600 hover:bg-slate-50 dark:hover:bg-slate-700'}`}
            >
              <div>
                <p className="font-bold text-sm">{l.name}</p>
                <p className={`text-[10px] ${selectedLaborerId === l.id ? 'text-slate-400 dark:text-slate-300' : 'text-slate-500 dark:text-slate-400'}`}>
                  {l.role} • {formatCurrency(l.dailyRate)}/day
                </p>
              </div>
              {selectedLaborerId === l.id && <div className="h-1.5 w-1.5 rounded-full bg-blue-400" />}
            </button>
          ))}
        </div>
      </div>

      {/* Main Content: Details */}
      <div className="flex-1 min-w-0 flex flex-col gap-3">
        {selectedLaborer ? (
          <>
            {/* Header Card */}
            <Card className="p-4 bg-gradient-to-br from-white to-slate-50 dark:from-slate-800 dark:to-slate-800/50 flex flex-col gap-4">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
                <div>
                  <h1 className="text-xl font-bold text-slate-800 dark:text-white">{selectedLaborer.name}</h1>
                  <span className="text-xs text-slate-500 dark:text-slate-400 font-medium">Daily Wage: {formatCurrency(selectedLaborer.dailyRate)}</span>
                </div>

                <div className="flex items-center gap-1 bg-white dark:bg-slate-900 rounded-md border border-slate-200 dark:border-slate-700 p-0.5 shadow-sm">
                  <button onClick={() => changeMonth(-1)} className="p-1 hover:bg-slate-100 dark:hover:bg-slate-800 rounded text-slate-600 dark:text-slate-400"><ChevronLeft size={16} /></button>
                  <span className="min-w-[120px] text-center text-sm font-bold text-slate-700 dark:text-slate-200 select-none">{currentMonthName}</span>
                  <button onClick={() => changeMonth(1)} className="p-1 hover:bg-slate-100 dark:hover:bg-slate-800 rounded text-slate-600 dark:text-slate-400"><ChevronRight size={16} /></button>
                </div>
              </div>

              {/* Stats Grid */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-1.5">
                <div className="p-1.5 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-100 dark:border-blue-900/50 flex flex-col justify-center min-h-[60px]">
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="text-[9px] text-blue-600 dark:text-blue-400 font-bold uppercase tracking-wider leading-none mb-0.5">Work Stats</p>
                      <p className="text-base font-bold text-slate-800 dark:text-slate-100 leading-none">{stats.days} Days</p>
                    </div>
                  </div>
                  <div className="grid grid-cols-4 gap-0.5 mt-1.5 w-full">
                    <span title="Full" className="text-center py-0.5 bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-300 rounded text-[7px] font-bold leading-none">F:{stats.full}</span>
                    <span title="Half" className="text-center py-0.5 bg-amber-100 dark:bg-amber-900/40 text-amber-700 dark:text-amber-300 rounded text-[7px] font-bold leading-none">H:{stats.half}</span>
                    <span title="Qtr" className="text-center py-0.5 bg-purple-100 dark:bg-purple-900/40 text-purple-700 dark:text-purple-300 rounded text-[7px] font-bold leading-none">Q:{stats.quarter}</span>
                    <span title="Abs" className="text-center py-0.5 bg-rose-100 dark:bg-rose-900/40 text-rose-700 dark:text-rose-300 rounded text-[7px] font-bold leading-none">A:{stats.absent}</span>
                  </div>
                </div>
                <div className="p-1.5 bg-emerald-50 dark:bg-emerald-900/20 rounded-lg border border-emerald-100 dark:border-emerald-900/50 flex flex-col justify-center min-h-[60px]">
                  <p className="text-[9px] text-emerald-600 dark:text-emerald-400 font-bold uppercase tracking-wider leading-none mb-0.5">Month Earnings</p>
                  <p className="text-base font-bold text-slate-800 dark:text-slate-100 leading-none">{formatCurrency(stats.earned)}</p>
                </div>
                <div className="p-1.5 bg-amber-50 dark:bg-amber-900/20 rounded-lg border border-amber-100 dark:border-amber-900/50 flex flex-col justify-center min-h-[60px]">
                  <p className="text-[9px] text-amber-600 dark:text-amber-400 font-bold uppercase tracking-wider leading-none mb-0.5">Total Paid (All Time)</p>
                  <p className="text-base font-bold text-slate-800 dark:text-slate-100 leading-none">{formatCurrency(stats.totalPaid)}</p>
                </div>
                <div className={`p-1.5 rounded-lg border flex flex-col justify-center min-h-[60px] ${stats.balance < 0 ? 'bg-red-50 dark:bg-red-900/20 border-red-100 dark:border-red-900/50' : 'bg-slate-100 dark:bg-slate-800 border-slate-200 dark:border-slate-700'}`}>
                  <p className={`text-[9px] font-bold uppercase tracking-wider leading-none mb-0.5 ${stats.balance < 0 ? 'text-red-600 dark:text-red-400' : 'text-slate-600 dark:text-slate-400'}`}>Net Payable (Due)</p>
                  <p className={`text-base font-bold leading-none ${stats.balance < 0 ? 'text-red-700 dark:text-red-300' : 'text-slate-800 dark:text-slate-100'}`}>
                    {formatCurrency(stats.balance)}
                  </p>
                </div>
              </div>
            </Card>

            <div className="flex gap-2">
              <button
                onClick={() => setActiveTab('ATTENDANCE')}
                className={`flex-1 py-2 text-sm font-bold rounded-lg transition-colors ${activeTab === 'ATTENDANCE' ? 'bg-slate-800 dark:bg-slate-200 text-white dark:text-slate-900' : 'bg-white dark:bg-slate-800 text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700'}`}
              >
                Attendance Calendar
              </button>
              <button
                onClick={() => setActiveTab('PAYMENTS')}
                className={`flex-1 py-2 text-sm font-bold rounded-lg transition-colors ${activeTab === 'PAYMENTS' ? 'bg-slate-800 dark:bg-slate-200 text-white dark:text-slate-900' : 'bg-white dark:bg-slate-800 text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700'}`}
              >
                Payments & Payroll
              </button>
            </div>

            {activeTab === 'ATTENDANCE' && (
              <div className="flex-1 min-w-0">
                <Card className="p-4 h-full flex flex-col relative overflow-hidden">
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="font-bold text-slate-700 dark:text-slate-300 flex items-center gap-2 text-sm">
                      <CalendarIcon size={16} /> Attendance Log
                    </h3>
                    <button
                      onClick={toggleSelectionMode}
                      className={`flex items-center gap-1.5 px-2 py-1 rounded text-xs font-bold transition ${isSelectionMode ? 'bg-blue-600 text-white' : 'bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-600'}`}
                    >
                      {isSelectionMode ? <CheckSquare size={14} /> : <ListChecks size={14} />}
                      {isSelectionMode ? 'Done' : 'Select'}
                    </button>
                  </div>
                  <div className="flex-1 overflow-auto">
                    {renderCalendar()}
                  </div>
                  <div className="mt-2 pt-2 border-t border-slate-100 dark:border-slate-700">
                    {isSelectionMode ? (
                      <div className="flex gap-1 animate-in slide-in-from-bottom-2">
                        <button onClick={() => handleBulkAction('PRESENT')} disabled={selectedDates.size === 0} className="flex-1 py-1.5 bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-300 hover:bg-emerald-200 dark:hover:bg-emerald-800 rounded text-[10px] font-bold disabled:opacity-50 transition">Full</button>
                        <button onClick={() => handleBulkAction('HALF')} disabled={selectedDates.size === 0} className="flex-1 py-1.5 bg-amber-100 dark:bg-amber-900/40 text-amber-700 dark:text-amber-300 hover:bg-amber-200 dark:hover:bg-amber-800 rounded text-[10px] font-bold disabled:opacity-50 transition">Half</button>
                        <button onClick={() => handleBulkAction('QUARTER')} disabled={selectedDates.size === 0} className="flex-1 py-1.5 bg-purple-100 dark:bg-purple-900/40 text-purple-700 dark:text-purple-300 hover:bg-purple-200 dark:hover:bg-purple-800 rounded text-[10px] font-bold disabled:opacity-50 transition">Qtr</button>
                        <button onClick={() => handleBulkAction('ABSENT')} disabled={selectedDates.size === 0} className="flex-1 py-1.5 bg-rose-100 dark:bg-rose-900/40 text-rose-700 dark:text-rose-300 hover:bg-rose-200 dark:hover:bg-rose-800 rounded text-[10px] font-bold disabled:opacity-50 transition">Abs</button>
                        <button onClick={() => handleBulkAction('CLEAR')} disabled={selectedDates.size === 0} className="px-2 py-1.5 bg-slate-100 dark:bg-slate-700 text-slate-500 hover:bg-slate-200 dark:hover:bg-slate-600 rounded text-[10px] font-bold disabled:opacity-50 transition"><X size={12} /></button>
                      </div>
                    ) : (
                      <div className="flex justify-center gap-3 text-[10px] text-slate-500 dark:text-slate-400">
                        <div className="flex items-center gap-1"><div className="w-2.5 h-2.5 bg-emerald-100 dark:bg-emerald-900/60 border border-emerald-200 dark:border-emerald-700 rounded" /> Present</div>
                        <div className="flex items-center gap-1"><div className="w-2.5 h-2.5 bg-amber-100 dark:bg-amber-900/60 border border-amber-200 dark:border-amber-700 rounded" /> Half</div>
                        <div className="flex items-center gap-1"><div className="w-2.5 h-2.5 bg-rose-50 dark:bg-rose-900/60 border border-rose-200 dark:border-rose-700 rounded" /> Absent</div>
                        <div className="flex items-center gap-1"><div className="w-1.5 h-1.5 bg-amber-500 rounded-full" /> Adv Taken</div>
                      </div>
                    )}
                  </div>
                </Card>
              </div>
            )}

            {activeTab === 'PAYMENTS' && (
              <div className="flex-1 min-w-0">
                <Card className="flex-1 flex flex-col overflow-hidden h-full bg-slate-50/50 dark:bg-slate-900/30">
                  <div className="p-3 border-b border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800">
                    <h3 className="font-bold text-slate-700 dark:text-slate-300 flex items-center gap-2 text-sm">
                      <Wallet size={16} /> Transaction History
                    </h3>
                  </div>

                  <div className="flex-1 overflow-y-auto p-3 space-y-2 custom-scrollbar">
                    {payments.filter(p => p.employeeId === selectedLaborer.id).length === 0 && (
                      <p className="text-center text-slate-400 text-xs py-8 italic">No payment history found.</p>
                    )}
                    {payments
                      .filter(p => p.employeeId === selectedLaborer.id)
                      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
                      .map(p => (
                        <div key={p.id} className="bg-white dark:bg-slate-800 p-3 rounded-md border border-slate-200 dark:border-slate-700 shadow-sm flex justify-between items-center">
                          <div>
                            <div className="flex items-center gap-2">
                              <span className={`text-[10px] font-bold px-1.5 rounded ${p.type === 'SALARY' ? 'bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-300' : 'bg-amber-100 dark:bg-amber-900/40 text-amber-700 dark:text-amber-300'}`}>
                                {p.type}
                              </span>
                              <span className="text-xs font-bold text-slate-700 dark:text-slate-200">{formatCurrency(p.amount)}</span>
                            </div>
                            <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5">
                              {new Date(p.date).toLocaleDateString()} {p.note && `• ${p.note}`}
                            </p>
                          </div>
                        </div>
                      ))
                    }
                  </div>

                  {/* Add Payment Form */}
                  <div className="p-3 bg-white dark:bg-slate-800 border-t border-slate-200 dark:border-slate-700">
                    <div className="grid grid-cols-2 gap-2 mb-2">
                      <div className="flex bg-slate-100 dark:bg-slate-900 rounded p-0.5">
                        <button onClick={() => setPaymentType('ADVANCE')} className={`flex-1 text-[10px] font-bold rounded py-1 transition ${paymentType === 'ADVANCE' ? 'bg-white dark:bg-slate-700 shadow text-amber-600 dark:text-amber-400' : 'text-slate-500'}`}>Advance</button>
                        <button onClick={() => setPaymentType('SALARY')} className={`flex-1 text-[10px] font-bold rounded py-1 transition ${paymentType === 'SALARY' ? 'bg-white dark:bg-slate-700 shadow text-emerald-600 dark:text-emerald-400' : 'text-slate-500'}`}>Salary</button>
                      </div>
                      <input
                        type="text"
                        placeholder="Note (Optional)"
                        value={paymentNote}
                        onChange={e => setPaymentNote(e.target.value)}
                        className="w-full px-2 py-1 bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-600 rounded text-xs outline-none"
                      />
                    </div>
                    <div className="flex gap-2">
                      <div className="relative flex-1">
                        <IndianRupee className="absolute left-2 top-2 text-slate-400 w-3.5 h-3.5" />
                        <input
                          type="number"
                          value={paymentAmount}
                          onChange={(e) => setPaymentAmount(e.target.value)}
                          placeholder="Amount"
                          className="w-full pl-7 pr-2 py-1.5 border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-900 dark:text-white rounded text-sm outline-none focus:ring-2 focus:ring-blue-500"
                        />
                      </div>
                      <button
                        onClick={handleAddPayment}
                        disabled={!paymentAmount}
                        className="bg-slate-800 dark:bg-slate-700 text-white px-3 py-1.5 rounded text-sm font-bold hover:bg-slate-900 dark:hover:bg-slate-600 disabled:opacity-50 transition-colors"
                      >
                        Add
                      </button>
                    </div>
                  </div>
                </Card>
              </div>
            )}
          </>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center text-slate-400">
            <Users size={40} className="mb-3 text-slate-200 dark:text-slate-700" />
            <p className="text-sm">Select a staff member to manage details</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default LaborManager;
