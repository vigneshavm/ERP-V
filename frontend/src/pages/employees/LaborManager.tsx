import React, { useState } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { RootState, AppDispatch } from '../../redux/store';
import { addEmployee, markAttendance, addLaborPayment, setEmployees } from '../../redux/slices/laborSlice';
import { ensureBranchRecorded } from '../../redux/slices/tenantSlice';
import api from '../../services/api';
import Layout from '../../components/Layout';
import PageHeader from '../../components/PageHeader';
import { TimeEntryModal } from '../../components/TimeEntryModal';
import { Users } from 'lucide-react';
import { getDaysInMonth, formatDateISO } from '../../utils/helpers';
import { securePassword } from '../../utils/auth';
import { AttendanceStatus, Sector } from '../../types/common';
import { DailyLog } from '../../types/hr';
import { calculateLaborStats, convertMonthlyToDailyWage, generateLaborerPayload, mapDbUserToEmployee } from '../../utils/laborUtils';

// Sub-components
import LaborSidebar from './LaborSidebar';
import AddLaborerForm from './AddLaborerForm';
import LaborStats from './LaborStats';
import AttendanceCalendar from './AttendanceCalendar';
import PaymentHistory from './PaymentHistory';

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

  // Load employees from API
  React.useEffect(() => {
    const fetchEmployees = async () => {
      try {
        const response = await api.get('/api/employees');
        if (response.data && response.data.success) {
          // Adapt to Redux format
          const emps = response.data.data.map((e: any) => ({
            id: e._id,
            tenantId: e.tenantId,
            name: e.name,
            role: e.role,
            roleId: e.roleId,
            mobile: e.mobile,
            dailyRate: e.dailyRate,
            wageType: e.wageType,
            branchId: e.branchId,
            sector: currentSector, // Fallback or store in DB
            active: e.isActive,
            systemRole: 'STAFF',
            pin: '****'
          }));
          // Update redux (need to import setEmployees action first if not already done, check imports)
          // See imports in file: import { addEmployee, markAttendance, addLaborPayment } from '../../redux/slices/laborSlice';
          // We need to add setEmployees to the import list or just dispatch individual adds?? Better setEmployees.
          // Assuming setEmployees is exported from slice, let's use it.
        }
      } catch (err) {
        console.error("Failed to load employees", err);
      }
    };
    fetchEmployees();
  }, []);

  // Removed legacy roles loading for now or keep if needed for role selection
  React.useEffect(() => {
    if (!isRolesLoaded && activeTenantId) {
      // loadRoles(); // Disable Supabase role loading
    }
  }, [isRolesLoaded, activeTenantId]);

  const loadRoles = async () => {
    const tId = activeTenantId;
    if (!tId) return;

    const { data } = await import('../../../../src/lib/supabase').then(m => m.supabase.from('roles').select('*').eq('tenant_id', tId));
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
  const stats = selectedLaborer
    ? calculateLaborStats(selectedLaborer.id, selectedLaborer.dailyRate, attendance, payments, currentYear, currentMonth)
    : { days: 0, full: 0, half: 0, quarter: 0, absent: 0, earned: 0, paid: 0, balance: 0, totalPaid: 0 };

  // -- Handlers --
  const handleAddLaborer = async (e: React.FormEvent) => {
    e.preventDefault();
    const branchIdentifier = newEmp.branch || (currentBranch === 'All' ? 'Alpha' : currentBranch);
    dispatch(ensureBranchRecorded({ branchId: branchIdentifier }));

    // let finalBranchId = null; // Backend can handle basic branch string for now or specific ID logic

    // API Payload
    const payload = {
      name: newEmp.name,
      role: newEmp.role || 'Staff',
      roleId: newEmp.roleId,
      mobile: newEmp.mobile,
      dailyRate: parseFloat(newEmp.dailyRate) || 0,
      wageType: wageType,
      branchId: branchIdentifier // sending string identifier as branchId
    };

    try {
      const response = await api.post('/api/employees', payload);
      if (response.data && response.data.success) {
        // Dispatch to redux using the returned data structured as expected by frontend
        // Mapping might be needed if frontend expects specific structure
        const insertedUser = response.data.data;

        // Adapting backend object to frontend Employee interface
        const employeeForRedux = {
          id: insertedUser._id,
          tenantId: insertedUser.tenantId,
          name: insertedUser.name,
          role: insertedUser.role,
          roleId: insertedUser.roleId,
          mobile: insertedUser.mobile,
          dailyRate: insertedUser.dailyRate,
          wageType: insertedUser.wageType,
          branchId: insertedUser.branchId,
          sector: currentSector, // Assuming current context
          joinedDate: insertedUser.createdAt,
          active: insertedUser.isActive,
          systemRole: 'Staff',
          pin: '****'
        };

        dispatch(addEmployee(employeeForRedux));
        setIsAddingLaborer(false);
        setNewEmp({ name: '', role: '', roleId: '', dailyRate: '', mobile: '', branch: currentBranch === 'All' ? 'Alpha' : currentBranch });
      }
    } catch (error: any) {
      alert("Failed to add laborer: " + (error.response?.data?.message || error.message));
    }
  };

  const handleMonthlyChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value; setMonthlyInput(val);
    const daily = convertMonthlyToDailyWage(val);
    setNewEmp({ ...newEmp, dailyRate: daily > 0 ? daily.toString() : '' });
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
    <Layout>
      <PageHeader
        title="Staff & Labor Management"
        description="Monitor attendance, process payroll, and manage laborers across your branches."
        breadcrumbs={[
          { label: 'Home', link: '/dashboard' },
          { label: 'Employees' }
        ]}
      />
      <div className="flex flex-col lg:flex-row h-full lg:h-[calc(100vh-17rem)] gap-4 animate-in fade-in relative">
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
    </Layout>
  );
};

export default LaborManager;
