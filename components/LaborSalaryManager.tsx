
import React, { useState, useMemo } from 'react';
import { Card } from './Card';
import { TimeEntryModal } from './TimeEntryModal';
import { Users, Plus, CalendarIcon, ChevronLeft, ChevronRight, CheckSquare, ListChecks, Wallet, Trash2, CheckCircle2, Clock, PieChart, XCircle, IndianRupee, Calculator, X } from 'lucide-react';
import { formatCurrency, getDaysInMonth, getFirstDayOfMonth, formatDateISO } from '../utils/helpers';

export interface Payment {
  id: string;
  date: string;
  amount: number;
  note?: string;
}

export interface DailyLog {
  status: AttendanceStatus;
  inTime: string;
  outTime: string;
  duration: number; // in hours
}

export type AttendanceStatus = 'PRESENT' | 'HALF' | 'QUARTER' | 'ABSENT';

export interface AttendanceRecord {
  [dateIso: string]: DailyLog;
}
export interface Laborer {
  id: string;
  name: string;
  dailyWage: number;
  phone?: string;
  role?: string;
}

export const LaborSalaryManager = () => {
  // -- State --
  const [laborers, setLaborers] = useState<Laborer[]>([
    { id: '1', name: 'Raju Kumar', dailyWage: 800, role: 'Master' },
    { id: '2', name: 'Sunil Singh', dailyWage: 500, role: 'Helper' },
  ]);

  const [selectedLaborerId, setSelectedLaborerId] = useState<string>(laborers[0]?.id);
  const [attendanceData, setAttendanceData] = useState<Record<string, AttendanceRecord>>({});
  const [paymentData, setPaymentData] = useState<Record<string, Payment[]>>({});

  // View State
  const [currentDate, setCurrentDate] = useState(new Date());
  const [isAddingLaborer, setIsAddingLaborer] = useState(false);
  const [newPaymentAmount, setNewPaymentAmount] = useState('');

  // Selection Mode State
  const [isSelectionMode, setIsSelectionMode] = useState(false);
  const [selectedDates, setSelectedDates] = useState<Set<string>>(new Set());

  // Time Entry State
  const [editingDate, setEditingDate] = useState<string | null>(null);

  // New Laborer Form State
  const [newLaborerName, setNewLaborerName] = useState('');
  const [newLaborerWage, setNewLaborerWage] = useState('');
  const [wageType, setWageType] = useState<'DAILY' | 'MONTHLY'>('DAILY');
  const [monthlyInput, setMonthlyInput] = useState('');

  // -- Computed Values --
  const currentYear = currentDate.getFullYear();
  const currentMonth = currentDate.getMonth();

  const selectedLaborer = laborers.find(l => l.id === selectedLaborerId);
  const currentMonthName = currentDate.toLocaleString('default', { month: 'long', year: 'numeric' });

  // Calculate Stats for Selected Month
  const stats = useMemo(() => {
    if (!selectedLaborer) return { days: 0, full: 0, half: 0, quarter: 0, absent: 0, earned: 0, paid: 0, balance: 0 };

    const records = attendanceData[selectedLaborer.id] || {};
    const payments = paymentData[selectedLaborer.id] || [];

    let daysCount = 0;
    let full = 0;
    let half = 0;
    let quarter = 0;
    let absent = 0;

    const daysInMonth = getDaysInMonth(currentYear, currentMonth);
    for (let d = 1; d <= daysInMonth; d++) {
      const dateKey = formatDateISO(currentYear, currentMonth, d);
      const log = records[dateKey];
      if (log?.status === 'PRESENT') {
        daysCount += 1;
        full += 1;
      } else if (log?.status === 'HALF') {
        daysCount += 0.5;
        half += 1;
      } else if (log?.status === 'QUARTER') {
        daysCount += 0.25;
        quarter += 1;
      } else if (log?.status === 'ABSENT') {
        absent += 1;
      }
    }

    const totalEarned = daysCount * selectedLaborer.dailyWage;

    const monthlyPayments = payments.filter(p => {
      const pDate = new Date(p.date);
      return pDate.getMonth() === currentMonth && pDate.getFullYear() === currentYear;
    });

    const totalPaid = monthlyPayments.reduce((sum, p) => sum + p.amount, 0);

    return {
      days: daysCount,
      full,
      half,
      quarter,
      absent,
      earned: totalEarned,
      paid: totalPaid,
      balance: totalEarned - totalPaid
    };
  }, [selectedLaborer, attendanceData, paymentData, currentYear, currentMonth]);


  // -- Handlers --

  const handleAddLaborer = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newLaborerName || !newLaborerWage) return;
    const newId = Date.now().toString();
    setLaborers([...laborers, { id: newId, name: newLaborerName, dailyWage: parseFloat(newLaborerWage), role: 'Worker' }]);
    setSelectedLaborerId(newId);

    setNewLaborerName('');
    setNewLaborerWage('');
    setMonthlyInput('');
    setWageType('DAILY');
    setIsAddingLaborer(false);
  };

  const handleMonthlyChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setMonthlyInput(val);
    const monthly = parseFloat(val);
    if (!isNaN(monthly)) {
      const daily = Math.round(monthly / 30);
      setNewLaborerWage(daily.toString());
    } else {
      setNewLaborerWage('');
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

    setAttendanceData(prev => {
      const laborerRecords = { ...(prev[selectedLaborer.id] || {}) };

      selectedDates.forEach(dateKey => {
        if (status === 'CLEAR') {
          delete laborerRecords[dateKey];
        } else {
          // Create default logs for bulk actions
          let log: DailyLog;
          if (status === 'PRESENT') log = { status: 'PRESENT', inTime: '09:00', outTime: '18:00', duration: 9 };
          else if (status === 'HALF') log = { status: 'HALF', inTime: '09:00', outTime: '13:30', duration: 4.5 };
          else if (status === 'QUARTER') log = { status: 'QUARTER', inTime: '09:00', outTime: '11:30', duration: 2.5 };
          else log = { status: 'ABSENT', inTime: '', outTime: '', duration: 0 };

          laborerRecords[dateKey] = log;
        }
      });

      return { ...prev, [selectedLaborer.id]: laborerRecords };
    });

    setIsSelectionMode(false);
    setSelectedDates(new Set());
  };

  const handleSaveAttendance = (log: DailyLog | null) => {
    if (!selectedLaborer || !editingDate) return;

    setAttendanceData(prev => {
      const laborerRecords = { ...(prev[selectedLaborer.id] || {}) };
      if (log) {
        laborerRecords[editingDate] = log;
      } else {
        delete laborerRecords[editingDate];
      }
      return { ...prev, [selectedLaborer.id]: laborerRecords };
    });
  };

  const handleAddPayment = () => {
    if (!selectedLaborer || !newPaymentAmount) return;
    const amount = parseFloat(newPaymentAmount);
    if (isNaN(amount) || amount <= 0) return;

    const potentialBalance = stats.balance - amount;
    if (potentialBalance < 0) {
      const confirmMessage = stats.balance >= 0
        ? `⚠️ Overpayment Warning\n\nThis payment of ${formatCurrency(amount)} exceeds the current Net Payable amount (${formatCurrency(stats.balance)}).\n\nThis will result in a negative balance of ${formatCurrency(potentialBalance)} (Advance).\n\nDo you want to proceed?`
        : `⚠️ Existing Advance Warning\n\nThe balance is already negative (${formatCurrency(stats.balance)}).\n\nAdding this payment will increase the advance amount to ${formatCurrency(potentialBalance)}.\n\nDo you want to proceed?`;

      if (!window.confirm(confirmMessage)) return;
    }

    const newPayment: Payment = {
      id: Date.now().toString(),
      date: new Date().toISOString(),
      amount: amount,
      note: 'Advance Payment'
    };

    setPaymentData(prev => ({
      ...prev,
      [selectedLaborer.id]: [...(prev[selectedLaborer.id] || []), newPayment]
    }));
    setNewPaymentAmount('');
  };

  const handleDeletePayment = (paymentId: string) => {
    if (!selectedLaborer) return;
    setPaymentData(prev => ({
      ...prev,
      [selectedLaborer.id]: prev[selectedLaborer.id].filter(p => p.id !== paymentId)
    }));
  };

  const changeMonth = (delta: number) => {
    setCurrentDate(new Date(currentYear, currentMonth + delta, 1));
    setSelectedDates(new Set()); // Clear selection on month change
  };

  // -- Calendar Logic --
  const renderCalendar = () => {
    const daysInMonth = getDaysInMonth(currentYear, currentMonth);
    const firstDay = getFirstDayOfMonth(currentYear, currentMonth);
    const blanks = Array(firstDay).fill(null);
    const days = Array.from({ length: daysInMonth }, (_, i) => i + 1);

    return (
      <div className="grid grid-cols-7 gap-1 mb-2">
        {['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'].map(d => (
          <div key={d} className="text-center text-[10px] font-bold text-slate-400 dark:text-slate-500 py-1 uppercase">{d}</div>
        ))}

        {blanks.map((_, i) => <div key={`blank-${i}`} className="h-9" />)}

        {days.map(day => {
          const dateKey = formatDateISO(currentYear, currentMonth, day);
          const log = attendanceData[selectedLaborerId]?.[dateKey];
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

          // Override style if selected
          if (isSelected) {
            bgClass = 'bg-blue-600 border-blue-600 shadow-md ring-2 ring-blue-200 dark:ring-blue-900';
            textClass = 'text-white';
            icon = null; // Hide icon on selection to reduce clutter
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
          isOpen={!!editingDate}
          date={editingDate}
          onClose={() => setEditingDate(null)}
          onSave={handleSaveAttendance}
          initialData={attendanceData[selectedLaborerId]?.[editingDate]}
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
                value={newLaborerName}
                onChange={e => setNewLaborerName(e.target.value)}
                className="w-full p-2 text-xs rounded border border-blue-200 dark:border-slate-600 bg-white dark:bg-slate-900 text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-blue-300"
                autoFocus
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
                    value={newLaborerWage}
                    onChange={e => setNewLaborerWage(e.target.value)}
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
                  {newLaborerWage && (
                    <div className="flex items-center gap-1.5 text-[10px] text-blue-700 dark:text-blue-300 bg-blue-100/50 dark:bg-blue-900/30 p-1.5 rounded">
                      <Calculator size={10} />
                      <span>Daily: {formatCurrency(parseFloat(newLaborerWage))} (Calc: /30)</span>
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
          {laborers.map(l => (
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
                  {l.role} • {formatCurrency(l.dailyWage)}/day
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
                  <span className="text-xs text-slate-500 dark:text-slate-400 font-medium">Daily Wage: {formatCurrency(selectedLaborer.dailyWage)}</span>
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
                      <p className="text-[9px] text-blue-600 dark:text-blue-400 font-bold uppercase tracking-wider leading-none mb-0.5">Days Worked</p>
                      <p className="text-base font-bold text-slate-800 dark:text-slate-100 leading-none">{stats.days}</p>
                    </div>
                  </div>
                  <div className="grid grid-cols-4 gap-0.5 mt-1.5 w-full">
                    <span title="Full Days" className="text-center py-0.5 bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-300 rounded text-[7px] font-bold leading-none">F:{stats.full}</span>
                    <span title="Half Days" className="text-center py-0.5 bg-amber-100 dark:bg-amber-900/40 text-amber-700 dark:text-amber-300 rounded text-[7px] font-bold leading-none">H:{stats.half}</span>
                    <span title="Quarter Days" className="text-center py-0.5 bg-purple-100 dark:bg-purple-900/40 text-purple-700 dark:text-purple-300 rounded text-[7px] font-bold leading-none">Q:{stats.quarter}</span>
                    <span title="Absent Days" className="text-center py-0.5 bg-rose-100 dark:bg-rose-900/40 text-rose-700 dark:text-rose-300 rounded text-[7px] font-bold leading-none">A:{stats.absent}</span>
                  </div>
                </div>
                <div className="p-1.5 bg-emerald-50 dark:bg-emerald-900/20 rounded-lg border border-emerald-100 dark:border-emerald-900/50 flex flex-col justify-center min-h-[60px]">
                  <p className="text-[9px] text-emerald-600 dark:text-emerald-400 font-bold uppercase tracking-wider leading-none mb-0.5">Total Earned</p>
                  <p className="text-base font-bold text-slate-800 dark:text-slate-100 leading-none">{formatCurrency(stats.earned)}</p>
                </div>
                <div className="p-1.5 bg-amber-50 dark:bg-amber-900/20 rounded-lg border border-amber-100 dark:border-amber-900/50 flex flex-col justify-center min-h-[60px]">
                  <p className="text-[9px] text-amber-600 dark:text-amber-400 font-bold uppercase tracking-wider leading-none mb-0.5">Paid / Advance</p>
                  <p className="text-base font-bold text-slate-800 dark:text-slate-100 leading-none">{formatCurrency(stats.paid)}</p>
                </div>
                <div className={`p-1.5 rounded-lg border flex flex-col justify-center min-h-[60px] ${stats.balance < 0 ? 'bg-red-50 dark:bg-red-900/20 border-red-100 dark:border-red-900/50' : 'bg-slate-100 dark:bg-slate-800 border-slate-200 dark:border-slate-700'}`}>
                  <p className={`text-[9px] font-bold uppercase tracking-wider leading-none mb-0.5 ${stats.balance < 0 ? 'text-red-600 dark:text-red-400' : 'text-slate-600 dark:text-slate-400'}`}>Net Payable</p>
                  <p className={`text-base font-bold leading-none ${stats.balance < 0 ? 'text-red-700 dark:text-red-300' : 'text-slate-800 dark:text-slate-100'}`}>
                    {formatCurrency(stats.balance)}
                  </p>
                </div>
              </div>
            </Card>

            <div className="flex flex-col xl:flex-row gap-4 h-full min-h-0">
              {/* Left: Attendance Calendar */}
              <div className="flex-1 min-w-0">
                <Card className="p-4 h-full flex flex-col relative overflow-hidden">

                  {/* Calendar Header with Multi-Select Toggle */}
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="font-bold text-slate-700 dark:text-slate-300 flex items-center gap-2 text-sm">
                      <CalendarIcon size={16} /> Attendance
                    </h3>
                    <button
                      onClick={toggleSelectionMode}
                      className={`flex items-center gap-1.5 px-2 py-1 rounded text-xs font-bold transition ${isSelectionMode ? 'bg-blue-600 text-white' : 'bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-600'}`}
                    >
                      {isSelectionMode ? <CheckSquare size={14} /> : <ListChecks size={14} />}
                      {isSelectionMode ? 'Done' : 'Select'}
                    </button>
                  </div>

                  {/* Calendar Grid */}
                  <div className="flex-1 overflow-auto">
                    {renderCalendar()}
                  </div>

                  {/* Footer / Bulk Actions */}
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
                      </div>
                    )}
                  </div>
                </Card>
              </div>

              {/* Right: Payments */}
              <div className="w-full xl:w-72 shrink-0 flex flex-col">
                <Card className="flex-1 flex flex-col overflow-hidden bg-slate-50/50 dark:bg-slate-900/30">
                  <div className="p-3 border-b border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800">
                    <h3 className="font-bold text-slate-700 dark:text-slate-300 flex items-center gap-2 text-sm">
                      <Wallet size={16} /> Payments
                    </h3>
                  </div>

                  {/* Payment List */}
                  <div className="flex-1 overflow-y-auto p-3 space-y-2 custom-scrollbar">
                    {paymentData[selectedLaborer.id]?.filter(p => {
                      const d = new Date(p.date);
                      return d.getMonth() === currentMonth && d.getFullYear() === currentYear;
                    }).length === 0 && (
                        <p className="text-center text-slate-400 text-xs py-8 italic">No payments this month</p>
                      )}

                    {paymentData[selectedLaborer.id]?.filter(p => {
                      const d = new Date(p.date);
                      return d.getMonth() === currentMonth && d.getFullYear() === currentYear;
                    }).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()).map(p => (
                      <div key={p.id} className="bg-white dark:bg-slate-800 p-2.5 rounded-md border border-slate-200 dark:border-slate-700 shadow-sm flex justify-between items-center group">
                        <div>
                          <p className="font-bold text-slate-700 dark:text-slate-200 text-sm">{formatCurrency(p.amount)}</p>
                          <p className="text-[10px] text-slate-500 dark:text-slate-400">{new Date(p.date).toLocaleDateString()}</p>
                        </div>
                        <button
                          onClick={() => handleDeletePayment(p.id)}
                          className="text-slate-300 hover:text-red-500 transition-colors p-1"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    ))}
                  </div>

                  {/* Add Payment Footer */}
                  <div className="p-3 bg-white dark:bg-slate-800 border-t border-slate-200 dark:border-slate-700">
                    <div className="flex gap-2">
                      <div className="relative flex-1">
                        <IndianRupee className="absolute left-2 top-2 text-slate-400 w-3.5 h-3.5" />
                        <input
                          type="number"
                          value={newPaymentAmount}
                          onChange={(e) => setNewPaymentAmount(e.target.value)}
                          placeholder="Amount"
                          className="w-full pl-7 pr-2 py-1.5 border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-900 dark:text-white rounded text-sm outline-none focus:ring-2 focus:ring-blue-500"
                        />
                      </div>
                      <button
                        onClick={handleAddPayment}
                        disabled={!newPaymentAmount}
                        className="bg-slate-800 dark:bg-slate-700 text-white px-3 py-1.5 rounded text-sm font-bold hover:bg-slate-900 dark:hover:bg-slate-600 disabled:opacity-50 transition-colors"
                      >
                        Add
                      </button>
                    </div>
                  </div>
                </Card>
              </div>
            </div>
          </>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center text-slate-400">
            <Users size={40} className="mb-3 text-slate-200 dark:text-slate-700" />
            <p className="text-sm">Select a laborer to view details</p>
          </div>
        )}
      </div>
    </div>
  );
};
