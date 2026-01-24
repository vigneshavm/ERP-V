import React, { useState } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { RootState, AppDispatch, addEmployee, markAttendance, addLaborPayment, ensureBranchRecorded } from '../store';
import { TimeEntryModal } from './TimeEntryModal';
import { Users } from 'lucide-react';
import { getDaysInMonth, formatDateISO } from '../utils/helpers';
import { securePassword } from '../utils/auth';
import { AttendanceStatus } from '../types/common';
import { DailyLog } from '../types/hr';
import { Sector } from '../types/common';

// Sub-components
import LaborSidebar from './labor/LaborSidebar';
import AddLaborerForm from './labor/AddLaborerForm';
import LaborStats from './labor/LaborStats';
import AttendanceCalendar from './labor/AttendanceCalendar';
import PaymentHistory from './labor/PaymentHistory';

// Helper for ID generation
const generateId = () => Math.random().toString(36).substr(2, 9);

export const LaborManager = () => {
  const dispatch = useDispatch<AppDispatch>();
  const { employees, attendance, payments } = useSelector((state: RootState) => state.labor);
  const { currentSector, currentBranch } = useSelector((state: RootState) => state.auth);
  const tenantBranches = useSelector((state: RootState) => state.tenant.branches);

  // -- State --
  const [selectedLaborerId, setSelectedLaborerId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'ATTENDANCE' | 'PAYMENTS'>('ATTENDANCE');
  const [roles, setRoles] = useState<any[]>([]);
  const [isRolesLoaded, setIsRolesLoaded] = useState(false);

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
  const [newEmp, setNewEmp] = useState({ name: '', role: '', roleId: '', dailyRate: '', mobile: '', branch: currentBranch === 'All' ? 'Alpha' : currentBranch });
  const [wageType, setWageType] = useState<'DAILY' | 'MONTHLY'>('DAILY');
  const [monthlyInput, setMonthlyInput] = useState('');

  // -- Computed Values --
  const currentYear = currentDate.getFullYear();
  const currentMonth = currentDate.getMonth();
  const currentMonthName = currentDate.toLocaleString('default', { month: 'long', year: 'numeric' });

  // Filter Employees
  const sectorEmps = employees.filter(e => e.sector === currentSector);

  const activeTenantId = employees.length > 0 ? employees[0].tenantId : null;

  // Load roles once on mount
  React.useEffect(() => {
    if (!isRolesLoaded && activeTenantId) {
      loadRoles();
    }
  }, [isRolesLoaded, activeTenantId]);

  const loadRoles = async () => {
    const tId = activeTenantId;
    if (!tId) return;

    const { data } = await import('../lib/supabase').then(m => m.supabase.from('roles').select('*').eq('tenant_id', tId));
    if (data) {
      setRoles(data);
      setIsRolesLoaded(true);
    }
  };

  // Default selection
  if (!selectedLaborerId && sectorEmps.length > 0) {
    setSelectedLaborerId(sectorEmps[0].id);
  }

  const selectedLaborer = sectorEmps.find(l => l.id === selectedLaborerId);
  const selectedId = selectedLaborer?.id;
  const selectedDailyRate = selectedLaborer?.dailyRate;

  // Calculate Stats for Selected Month
  const stats = (() => {
    if (!selectedId) return { days: 0, full: 0, half: 0, quarter: 0, absent: 0, earned: 0, paid: 0, balance: 0, totalPaid: 0 };

    const empAttendance = attendance.filter(a => a.employeeId === selectedId);
    const empPayments = payments.filter(p => p.employeeId === selectedId);

    let daysCount = 0; let full = 0; let half = 0; let quarter = 0; let absent = 0; let monthlyAdvance = 0;

    const daysInMonth = getDaysInMonth(currentYear, currentMonth);
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
    const monthlyPayments = empPayments.filter(p => {
      const pDate = new Date(p.date);
      return pDate.getMonth() === currentMonth && pDate.getFullYear() === currentYear;
    });
    const totalPaidInMonth = monthlyPayments.reduce((sum, p) => sum + p.amount, 0) + monthlyAdvance;

    const allTimeAttendance = attendance.filter(a => a.employeeId === selectedId);
    let allTimeDays = 0; let allTimeAdvances = 0;
    allTimeAttendance.forEach(log => {
      let d = 0;
      if (log.status === 'PRESENT') d = 1; else if (log.status === 'HALF') d = 0.5; else if (log.status === 'QUARTER') d = 0.25;
      allTimeDays += d;
      allTimeAdvances += (log.advanceTaken || 0);
    });

    const allTimeEarned = allTimeDays * (selectedDailyRate || 0);
    const allTimePayments = empPayments.reduce((sum, p) => sum + p.amount, 0);
    const totalPaidAllTime = allTimePayments + allTimeAdvances;
    const balance = allTimeEarned - totalPaidAllTime;

    return { days: daysCount, full, half, quarter, absent, earned: totalEarned, paid: totalPaidInMonth, balance, totalPaid: totalPaidAllTime };
  })();

  // -- Handlers --
  const handleAddLaborer = async (e: React.FormEvent) => {
    e.preventDefault();
    const branchIdentifier = newEmp.branch || (currentBranch === 'All' ? 'Alpha' : currentBranch);
    dispatch(ensureBranchRecorded({ branchId: branchIdentifier }));
    const hashedPin = await securePassword('0000');
    let targetRoleId = newEmp.roleId;

    if (!targetRoleId) {
      const staffRole = roles.find(r => r.name === 'Staff');
      if (staffRole) targetRoleId = staffRole.id;
    }

    const newDbUser = {
      tenant_id: activeTenantId, full_name: newEmp.name, role_id: targetRoleId, daily_rate: parseFloat(newEmp.dailyRate) || 0, mobile: newEmp.mobile, system_role: 'Staff', is_active: true, password_hash: null, pin_hash: hashedPin
    };

    let finalBranchId = null;
    if (typeof newEmp.branch === 'string') {
      const found = tenantBranches.find(b => b.name === newEmp.branch || b.id === newEmp.branch);
      if (found) finalBranchId = found.id;
    } else if ((newEmp.branch as any).id) {
      finalBranchId = (newEmp.branch as any).id;
    }

    const { data: insertedUser, error } = await import('../lib/supabase').then(m => m.supabase
      .from('tenant_users').insert([{ ...newDbUser, assigned_branch_id: finalBranchId }]).select(`*, role:roles(code, description)`).single()
    );

    if (error) {
      alert("Failed to add laborer: " + error.message);
      return;
    }

    if (insertedUser) {
      dispatch(addEmployee({
        id: insertedUser.id, name: insertedUser.full_name, role: insertedUser.role?.description || insertedUser.role?.code || newEmp.role || 'Staff', roleId: insertedUser.role_id, dailyRate: insertedUser.daily_rate || 0, sector: currentSector as Sector, branchId: insertedUser.assigned_branch_id || (newEmp.branch as any), systemRole: 'Staff', pin: insertedUser.pin_hash || '', mobile: insertedUser.mobile, tenantId: insertedUser.tenant_id
      }));
      setIsAddingLaborer(false);
      setNewEmp({ name: '', role: '', roleId: '', dailyRate: '', mobile: '', branch: currentBranch === 'All' ? 'Alpha' : currentBranch });
    }
  };

  const handleMonthlyChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value; setMonthlyInput(val);
    const monthly = parseFloat(val);
    if (!isNaN(monthly)) {
      const daily = Math.round(monthly / 30);
      setNewEmp({ ...newEmp, dailyRate: daily.toString() });
    } else {
      setNewEmp({ ...newEmp, dailyRate: '' });
    }
  };

  const handleBulkAction = (status: AttendanceStatus | 'CLEAR') => {
    if (!selectedLaborer) return;
    selectedDates.forEach(dateKey => {
      const existing = attendance.find(a => a.employeeId === selectedLaborer.id && a.date === dateKey);
      if (status === 'CLEAR') {
        dispatch(markAttendance({ id: existing?.id || generateId(), employeeId: selectedLaborer.id, date: dateKey, status: 'ABSENT', advanceTaken: existing?.advanceTaken || 0 }));
      } else {
        dispatch(markAttendance({ id: existing?.id || generateId(), employeeId: selectedLaborer.id, date: dateKey, status: status, advanceTaken: existing?.advanceTaken || 0, inTime: status === 'PRESENT' ? '09:00' : undefined, outTime: status === 'PRESENT' ? '18:00' : undefined }));
      }
    });
    setIsSelectionMode(false); setSelectedDates(new Set());
  };

  const handleSaveAttendance = (log: DailyLog | null) => {
    if (!selectedLaborer || !editingDate) return;
    const existing = attendance.find(a => a.employeeId === selectedLaborer.id && a.date === editingDate);
    if (log) {
      dispatch(markAttendance({ id: existing?.id || generateId(), employeeId: selectedLaborer.id, date: editingDate, status: log.status, advanceTaken: existing?.advanceTaken || 0, inTime: log.inTime, outTime: log.outTime }));
    } else {
      dispatch(markAttendance({ id: existing?.id || generateId(), employeeId: selectedLaborer.id, date: editingDate, status: 'ABSENT', advanceTaken: existing?.advanceTaken || 0 }));
    }
  };

  const handleAddPayment = () => {
    if (!selectedLaborer || !paymentAmount) return;
    const amount = parseFloat(paymentAmount);
    if (isNaN(amount) || amount <= 0) return;
    dispatch(addLaborPayment({ id: generateId(), employeeId: selectedLaborer.id, amount: amount, date: new Date().toISOString(), type: paymentType, note: paymentNote }));
    setPaymentAmount(''); setPaymentNote('');
  };

  return (
    <div className="flex flex-col lg:flex-row h-full lg:h-[calc(100vh-7rem)] gap-4 animate-in fade-in relative">
      {editingDate && (
        <TimeEntryModal
          key={`${editingDate}-${selectedLaborerId}`}
          isOpen={!!editingDate} date={editingDate} onClose={() => setEditingDate(null)} onSave={handleSaveAttendance}
          initialData={attendance.find(a => a.employeeId === selectedLaborerId && a.date === editingDate)}
        />
      )}

      <div className="w-full lg:w-72 flex flex-col gap-3 shrink-0">
        <LaborSidebar
          employees={sectorEmps}
          selectedLaborerId={selectedLaborerId}
          onSelectLaborer={setSelectedLaborerId}
          onToggleAddForm={() => setIsAddingLaborer(!isAddingLaborer)}
          isAddingLaborer={isAddingLaborer}
        />

        {isAddingLaborer && (
          <AddLaborerForm
            newEmp={newEmp} setNewEmp={setNewEmp} wageType={wageType} setWageType={setWageType}
            monthlyInput={monthlyInput} onMonthlyChange={handleMonthlyChange}
            roles={roles} onSubmit={handleAddLaborer} onCancel={() => setIsAddingLaborer(false)}
          />
        )}
      </div>

      <div className="flex-1 min-w-0 flex flex-col gap-3">
        {selectedLaborer ? (
          <>
            <LaborStats
              selectedLaborer={selectedLaborer}
              currentMonthName={currentMonthName}
              onMonthChange={(delta) => setCurrentDate(new Date(currentYear, currentMonth + delta, 1))}
              stats={stats}
            />

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
              <AttendanceCalendar
                currentMonth={currentMonth} currentYear={currentYear} attendance={attendance}
                selectedLaborerId={selectedLaborerId} isSelectionMode={isSelectionMode}
                onToggleSelectionMode={() => { setIsSelectionMode(!isSelectionMode); setSelectedDates(new Set()); }}
                selectedDates={selectedDates} onDateClick={(day) => isSelectionMode ? setSelectedDates(prev => { const next = new Set(prev); if (next.has(formatDateISO(currentYear, currentMonth, day))) next.delete(formatDateISO(currentYear, currentMonth, day)); else next.add(formatDateISO(currentYear, currentMonth, day)); return next; }) : setEditingDate(formatDateISO(currentYear, currentMonth, day))}
                onBulkAction={handleBulkAction}
              />
            )}

            {activeTab === 'PAYMENTS' && (
              <PaymentHistory
                payments={payments} selectedLaborerId={selectedLaborerId!}
                paymentAmount={paymentAmount} setPaymentAmount={setPaymentAmount}
                paymentType={paymentType} setPaymentType={setPaymentType}
                paymentNote={paymentNote} setPaymentNote={setPaymentNote}
                onAddPayment={handleAddPayment}
              />
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
