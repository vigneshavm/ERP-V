import React, { useState, useEffect, useMemo } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { useLocation, useNavigate } from 'react-router-dom';
import { RootState, AppDispatch } from "../../../redux/store";
import { addEmployee, markAttendance, addLaborPayment, setEmployees } from "../../../redux/slices/laborSlice";
import { ensureBranchRecorded } from "../../../redux/slices/tenantSlice";
import api from "../../../services/api.js";
import Layout from "../../../components/shared/Layout";
import PageHeader from "../../../components/shared/Layout/PageHeader";
import { TimeEntryModal } from "./components/TimeEntryModal";
import { Users, Calendar, CreditCard, UserPlus } from 'lucide-react';
import { getDaysInMonth, formatDateISO } from "../../../utils/helpers";
import { securePassword } from "../../../utils/auth";
import { AttendanceStatus, Sector, SystemRole } from "../../../types/common";
import { DailyLog } from "../../../types/hr";
import { calculateLaborStats, convertMonthlyToDailyWage, generateLaborerPayload, mapDbUserToEmployee } from "../../../utils/laborUtils";

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

  const location = useLocation();
  const navigate = useNavigate();

  // -- State --
  const [selectedLaborerId, setSelectedLaborerId] = useState<string | null>(null);

  // Derive activeTab from URL
  const activeTab = useMemo(() => {
    if (location.pathname.includes('/attendance')) return 'ATTENDANCE';
    if (location.pathname.includes('/payments')) return 'PAYMENTS';
    if (location.pathname.includes('/stats')) return 'STATS';
    return 'ATTENDANCE'; // default
  }, [location.pathname]);

  const setActiveTab = (tab: 'ATTENDANCE' | 'PAYMENTS' | 'STATS') => {
    const pathMap = {
      'ATTENDANCE': '/people/employees/attendance',
      'PAYMENTS': '/people/employees/payments',
      'STATS': '/people/employees/stats'
    };
    navigate(pathMap[tab]);
  };

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
  const [newEmp, setNewEmp] = useState({ name: '', role: '', roleId: '', dailyRate: '', mobile: '', branch: (currentBranch === 'All' ? 'Alpha' : currentBranch) || '' });
  const [wageType, setWageType] = useState<'DAILY' | 'MONTHLY'>('DAILY');
  const [monthlyInput, setMonthlyInput] = useState('');

  // -- Computed Values --
  const currentYear = currentDate.getFullYear();
  const currentMonth = currentDate.getMonth();
  const currentMonthName = currentDate.toLocaleString('default', { month: 'long', year: 'numeric' });

  // Filter Employees
  const sectorEmps = (employees as any[]).filter(e => e.sector === currentSector);

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
            isActive: e.isActive,
            systemRole: 'STAFF',
            pin: '****'
          }));
          // Update redux
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

    // TODO: Load roles from API
    // const { data } = await api.get('/roles', { params: { tenant_id: tId } });
    const data: any[] = [];
    if (data) {
      setRoles(data);
      setIsRolesLoaded(true);
    }
  };

  // Default selection
  if (!selectedLaborerId && sectorEmps.length > 0) {
    setSelectedLaborerId(sectorEmps[0].id);
  }

  const selectedLaborer = sectorEmps.find((l: any) => l.id === selectedLaborerId);
  const stats = selectedLaborer
    ? calculateLaborStats(selectedLaborer.id, selectedLaborer.dailyRate, attendance, payments, currentYear, currentMonth)
    : { days: 0, full: 0, half: 0, quarter: 0, absent: 0, earned: 0, paid: 0, balance: 0, totalPaid: 0 };

  // -- Handlers --
  const handleAddLaborer = async (e: React.FormEvent) => {
    e.preventDefault();
    const branchIdentifier = (newEmp.branch || (currentBranch === 'All' ? 'Alpha' : currentBranch)) as string;
    dispatch(ensureBranchRecorded({ branchId: branchIdentifier }));

    // API Payload
    const payload = {
      name: newEmp.name,
      role: newEmp.role || 'Staff',
      roleId: newEmp.roleId,
      mobile: newEmp.mobile,
      dailyRate: parseFloat(newEmp.dailyRate) || 0,
      wageType: wageType,
      branchId: branchIdentifier, // sending string identifier as branchId
      sector: currentSector
    };

    try {
      const response = await api.post('/api/employees', payload);
      if (response.data && response.data.success) {
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
          sector: currentSector as Sector, // Assuming current context
          joinedDate: insertedUser.createdAt,
          isActive: insertedUser.isActive,
          systemRole: 'Staff' as SystemRole,
          pin: '****'
        };

        dispatch(addEmployee(employeeForRedux));
        setIsAddingLaborer(false);
        setNewEmp({ name: '', role: '', roleId: '', dailyRate: '', mobile: '', branch: (currentBranch === 'All' ? 'Alpha' : currentBranch) || '' });
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
      const existing = (attendance as any[]).find(a => a.employeeId === selectedLaborer.id && a.date === dateKey);
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
    const existing = attendance.find((a: any) => a.employeeId === selectedLaborer.id && a.date === editingDate);
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
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 h-full flex flex-col">
        <PageHeader
          title="Staff & Labor Management"
          description="Monitor attendance, process payroll, and manage laborers across your branches."
          breadcrumbs={[
            { label: 'Home', link: '/dashboard' },
            { label: 'Employees' }
          ]}
        />

        <div className="flex flex-col lg:flex-row h-full lg:h-[calc(100vh-14rem)] gap-6 animate-in fade-in relative mt-6">
          {editingDate && (
            <TimeEntryModal
              key={`${editingDate}-${selectedLaborerId}`}
              isOpen={!!editingDate} date={editingDate} onClose={() => setEditingDate(null)} onSave={handleSaveAttendance}
              initialData={attendance.find((a: any) => a.employeeId === selectedLaborerId && a.date === editingDate)}
            />
          )}

          <div className="w-full lg:w-80 flex flex-col gap-4 shrink-0">
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

          <div className="flex-1 min-w-0 flex flex-col gap-6 bg-white rounded-xl shadow-sm border border-gray-100 p-6 overflow-hidden">
            {selectedLaborer ? (
              <div className="flex flex-col h-full gap-6">
                {activeTab === 'STATS' && (
                  <LaborStats
                    selectedLaborer={selectedLaborer}
                    currentMonthName={currentMonthName}
                    onMonthChange={(delta) => setCurrentDate(new Date(currentYear, currentMonth + delta, 1))}
                    stats={stats}
                  />
                )}

                <div className="flex flex-col flex-1 min-h-0">
                  <div className="flex border-b border-gray-200 mb-4">
                    <button
                      onClick={() => setActiveTab('STATS')}
                      className={`flex items-center gap-2 px-6 py-3 border-b-2 font-medium text-sm transition-colors ${activeTab === 'STATS'
                        ? 'border-indigo-600 text-indigo-600'
                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                        }`}
                    >
                      <Users className="w-4 h-4" />
                      Labor Stats
                    </button>
                    <button
                      onClick={() => setActiveTab('ATTENDANCE')}
                      className={`flex items-center gap-2 px-6 py-3 border-b-2 font-medium text-sm transition-colors ${activeTab === 'ATTENDANCE'
                        ? 'border-indigo-600 text-indigo-600'
                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                        }`}
                    >
                      <Calendar className="w-4 h-4" />
                      Attendance Calendar
                    </button>
                    <button
                      onClick={() => setActiveTab('PAYMENTS')}
                      className={`flex items-center gap-2 px-6 py-3 border-b-2 font-medium text-sm transition-colors ${activeTab === 'PAYMENTS'
                        ? 'border-indigo-600 text-indigo-600'
                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                        }`}
                    >
                      <CreditCard className="w-4 h-4" />
                      Payments & Payroll
                    </button>
                  </div>

                  <div className="flex-1 overflow-y-auto custom-scrollbar">
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
                  </div>
                </div>
              </div>
            ) : (
              <div className="flex-1 flex flex-col items-center justify-center text-gray-400">
                <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mb-4">
                  <Users className="text-gray-300" size={32} />
                </div>
                <h3 className="text-lg font-medium text-gray-900">No Staff Selected</h3>
                <p className="text-sm mt-1 max-w-sm text-center">Select an employee from the sidebar to view their attendance records, manage payments, and track performance.</p>
                <button
                  onClick={() => setIsAddingLaborer(true)}
                  className="mt-6 flex items-center gap-2 text-indigo-600 font-medium hover:text-indigo-700"
                >
                  <UserPlus size={18} />
                  Add New Staff Member
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default LaborManager;

