import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { useLocation, useNavigate } from 'react-router-dom';
import { RootState, AppDispatch } from "../../redux/store";
import { addEmployee, setEmployees, createAdvanceAction, fetchAdvances, fetchAttendance, saveAttendance, bulkMarkAttendanceAction, updateEmployee, deactivateEmployee } from "../../redux/slices/laborSlice";
import { ensureBranchRecorded } from "../../redux/slices/tenantSlice";
import api from "../../services/api.js";
import Layout from "../../components/shared/Layout/index";
import PageHeader from "../../components/shared/Layout/PageHeader";
import { TimeEntryModal } from "./TimeEntryModal.js";
import { Users, Calendar, CreditCard, UserPlus, Pencil, UserX } from 'lucide-react';
import { formatDateISO } from "../../utils/helpers";
import { AttendanceStatus, Sector, SystemRole } from "../../types/common";
import { DailyLog } from "../../types/hr";
import { calculateLaborStats, convertMonthlyToDailyWage } from "../../utils/laborUtils";

// Sub-components
import LaborSidebar from './LaborSidebar';
import AddLaborerForm from './AddLaborerForm';
import LaborStats from './LaborStats';
import AttendanceCalendar from './AttendanceCalendar';
import PaymentHistory from './PaymentHistory';

export const LaborManager = () => {
  const dispatch = useDispatch<AppDispatch>();
  const { employees, attendance, payments, attendanceLoading, attendanceError } = useSelector((state: RootState) => state.labor);
  const { currentSector, currentBranch } = useSelector((state: RootState) => state.auth);
  const _tenantBranches = useSelector((state: RootState) => state.tenant.branches);

  const location = useLocation();
  const navigate = useNavigate();

  // -- State --
  const [selectedLaborerId, setSelectedLaborerId] = useState<string | null>(null);
  const [staffType, setStaffType] = useState<'ALL' | 'OFFICE' | 'FIELD'>('ALL');

  // Derive activeTab from URL
  const activeTab = useMemo(() => {
    const searchParams = new URLSearchParams(location.search);
    const tab = searchParams.get('tab');
    if (tab === 'attendance') return 'ATTENDANCE';
    if (tab === 'payments') return 'PAYMENTS';
    if (tab === 'stats') return 'STATS';
    return 'ATTENDANCE'; // default
  }, [location.search]);

  const setActiveTab = (tab: 'ATTENDANCE' | 'PAYMENTS' | 'STATS') => {
    navigate(`${location.pathname}?tab=${tab.toLowerCase()}`, { replace: true });
  };

  const [roles] = useState<any[]>([]);
  const [_isRolesLoaded] = useState(false);

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

  // Edit Laborer Form State (reuses AddLaborerForm in "edit" mode)
  const [isEditingLaborer, setIsEditingLaborer] = useState(false);
  const [editEmp, setEditEmp] = useState({ name: '', role: '', roleId: '', dailyRate: '', mobile: '', branch: '' });
  const [editWageType, setEditWageType] = useState<'DAILY' | 'MONTHLY'>('DAILY');
  const [editMonthlyInput, setEditMonthlyInput] = useState('');

  // STAFF-018: track load state explicitly so a failed fetch can render its
  // own "Unable to load staff" + Retry state instead of silently looking
  // identical to a tenant that genuinely has zero employees.
  const [isLoadingEmployees, setIsLoadingEmployees] = useState(true);
  const [employeesError, setEmployeesError] = useState<string | null>(null);

  // -- Computed Values --
  const currentYear = currentDate.getFullYear();
  const currentMonth = currentDate.getMonth();
  const currentMonthName = currentDate.toLocaleString('default', { month: 'long', year: 'numeric' });

  // Filter Employees
  const sectorEmps = (employees as any[]).filter(e => {
    // Sector Check: Only filter out if currentSector is set and employee sector is set and explicitly different
    if (currentSector && (currentSector as string) !== 'All' && e.sector && e.sector !== currentSector) return false;

    // Type Check
    if (staffType === 'OFFICE' && (e.wageType === 'DAILY' || e.wageType === 'HOURLY')) return false;
    if (staffType === 'FIELD' && (e.wageType === 'MONTHLY' || !e.wageType)) return false;

    return true;
  });

  const _activeTenantId = employees.length > 0 ? employees[0].tenantId : null;

  const inFlightRequest = useRef<AbortController | null>(null);

  const fetchEmployees = useCallback(async () => {
    inFlightRequest.current?.abort();
    const controller = new AbortController();
    inFlightRequest.current = controller;

    setIsLoadingEmployees(true);
    setEmployeesError(null);
    try {
      const response = await api.get('/api/hr/employees', { signal: controller.signal });
      if (controller.signal.aborted) return;
      if (response.data && response.data.success) {
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
          sector: e.sector || currentSector,
          isActive: e.isActive,
          systemRole: SystemRole.STAFF,
          pin: '****'
        }));
        dispatch(setEmployees(emps));
      } else {
        setEmployeesError(response.data?.message || 'The server returned an unexpected response.');
      }
    } catch (err: any) {
      if (controller.signal.aborted || err.code === 'ERR_CANCELED') return;
      console.error("Failed to load employees", err);
      setEmployeesError(err.response?.data?.message || err.message || 'Could not reach the server.');
    } finally {
      if (!controller.signal.aborted) setIsLoadingEmployees(false);
    }
  }, [dispatch, currentSector]);

  useEffect(() => {
    fetchEmployees();
  }, [fetchEmployees]);

  useEffect(() => {
    if (selectedLaborerId) {
      dispatch(fetchAdvances(selectedLaborerId));
    }
  }, [selectedLaborerId, dispatch]);

  // Load attendance for whichever month & employee is currently displayed.
  // Runs on mount, on tab navigation to ATTENDANCE/STATS, employee change, and month/year change.
  useEffect(() => {
    if ((activeTab === 'ATTENDANCE' || activeTab === 'STATS') && selectedLaborerId) {
      dispatch(fetchAttendance({ employeeId: selectedLaborerId, month: currentMonth, year: currentYear }));
    }
  }, [currentMonth, currentYear, activeTab, selectedLaborerId, dispatch]);

  // Default selection wrapped in effect to avoid state updates during render
  useEffect(() => {
    if (!selectedLaborerId && sectorEmps.length > 0) {
      setSelectedLaborerId(sectorEmps[0].id);
    }
  }, [selectedLaborerId, sectorEmps]);

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
      const response = await api.post('/api/hr/employees', payload);
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

  // STAFF-014: Edit employee — pre-fills the (same) laborer form from the
  // currently selected employee and opens it in an edit-mode modal.
  const handleOpenEdit = () => {
    if (!selectedLaborer) return;
    setEditEmp({
      name: selectedLaborer.name || '',
      role: selectedLaborer.role || '',
      roleId: selectedLaborer.roleId || '',
      dailyRate: selectedLaborer.dailyRate ? String(selectedLaborer.dailyRate) : '',
      mobile: selectedLaborer.mobile || '',
      branch: selectedLaborer.branchId || ''
    });
    setEditWageType(selectedLaborer.wageType === 'MONTHLY' ? 'MONTHLY' : 'DAILY');
    setEditMonthlyInput('');
    setIsEditingLaborer(true);
  };

  const handleEditMonthlyChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value; setEditMonthlyInput(val);
    const daily = convertMonthlyToDailyWage(val);
    setEditEmp({ ...editEmp, dailyRate: daily > 0 ? daily.toString() : '' });
  };

  const handleSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedLaborer) return;

    const data = {
      name: editEmp.name,
      role: editEmp.role || 'Staff',
      roleId: editEmp.roleId,
      mobile: editEmp.mobile,
      dailyRate: parseFloat(editEmp.dailyRate) || 0,
      wageType: editWageType,
      branchId: editEmp.branch || selectedLaborer.branchId
    };

    try {
      await dispatch(updateEmployee({ id: selectedLaborer.id, data })).unwrap();
      setIsEditingLaborer(false);
    } catch (err: any) {
      alert("Failed to update staff details: " + err);
    }
  };

  // STAFF-015: Deactivate employee — soft-deletes via the backend (isActive:false),
  // which is also why it disappears from the list without a manual refetch:
  // GET /api/hr/employees already only ever returns isActive:true employees.
  const handleDeactivateLaborer = async () => {
    if (!selectedLaborer) return;
    if (!window.confirm(`Deactivate ${selectedLaborer.name}? They will no longer appear in the active staff list.`)) {
      return;
    }
    try {
      await dispatch(deactivateEmployee(selectedLaborer.id)).unwrap();
      setSelectedLaborerId(null);
    } catch (err: any) {
      alert("Failed to deactivate staff member: " + err);
    }
  };

  const handleBulkAction = async (status: AttendanceStatus | 'CLEAR') => {
    if (!selectedLaborer) return;
    const dates = Array.from(selectedDates);
    if (dates.length === 0) return;

    const targetStatus: AttendanceStatus = status === 'CLEAR' ? 'ABSENT' : status;
    try {
      await dispatch(bulkMarkAttendanceAction({ employeeId: selectedLaborer.id, dates, status: targetStatus })).unwrap();
      setIsSelectionMode(false);
      setSelectedDates(new Set());
    } catch (err: any) {
      alert("Failed to save bulk attendance: " + (err || "API error"));
    }
  };

  const handleSaveAttendance = async (log: DailyLog | null) => {
    if (!selectedLaborer || !editingDate) return;
    try {
      if (log) {
        await dispatch(saveAttendance({
          employeeId: selectedLaborer.id,
          date: editingDate,
          status: log.status,
          inTime: log.inTime,
          outTime: log.outTime
        })).unwrap();
      } else {
        await dispatch(saveAttendance({
          employeeId: selectedLaborer.id,
          date: editingDate,
          status: 'ABSENT'
        })).unwrap();
      }
      setEditingDate(null);
    } catch (err: any) {
      alert("Failed to save attendance: " + (err || "API error"));
    }
  };

  const handleAddPayment = async () => {
    if (!selectedLaborer || !paymentAmount) return;
    const amount = parseFloat(paymentAmount);
    if (isNaN(amount) || amount <= 0) return;

    try {
      await dispatch(createAdvanceAction({
        employeeId: selectedLaborer.id,
        amount: amount,
        type: paymentType,
        notes: paymentNote
      })).unwrap();

      setPaymentAmount('');
      setPaymentNote('');
    } catch (err: any) {
      alert("Failed to record payment: " + err);
    }
  };

  const existingLog = editingDate && selectedLaborerId
    ? attendance.find((a: any) => a.employeeId === selectedLaborerId && a.date === editingDate)
    : undefined;

  return (
    <Layout>
      <div className="flex flex-col h-full pt-8">
        <PageHeader
          title="Staff Management"
          description="Manage all your office and field staff in one place."
          breadcrumbs={[
            { label: 'Home', link: '/dashboard' },
            { label: 'Staff' }
          ]}
        />

        <div className="flex flex-col lg:flex-row h-full lg:h-[calc(100vh-14rem)] gap-6 animate-in fade-in relative">
          {editingDate && (
            <TimeEntryModal
              key={`${editingDate}-${selectedLaborerId}`}
              isOpen={!!editingDate} date={editingDate} onClose={() => setEditingDate(null)} onSave={handleSaveAttendance}
              initialData={existingLog ? {
                ...existingLog,
                duration: 0,
                inTime: existingLog.inTime || '09:00',
                outTime: existingLog.outTime || '18:00'
              } : null}
            />
          )}

          {isEditingLaborer && selectedLaborer && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-in fade-in">
              <div className="w-full max-w-sm">
                <AddLaborerForm
                  newEmp={editEmp} setNewEmp={setEditEmp} wageType={editWageType} setWageType={setEditWageType}
                  monthlyInput={editMonthlyInput} onMonthlyChange={handleEditMonthlyChange}
                  roles={roles} onSubmit={handleSaveEdit} onCancel={() => setIsEditingLaborer(false)}
                  title={`Edit ${selectedLaborer.name}`} submitLabel="Save Changes"
                />
              </div>
            </div>
          )}

          <div className="w-full lg:w-80 flex flex-col gap-4 shrink-0">
            <LaborSidebar
              employees={sectorEmps}
              selectedLaborerId={selectedLaborerId}
              onSelectLaborer={setSelectedLaborerId}
              onToggleAddForm={() => setIsAddingLaborer(!isAddingLaborer)}
              isAddingLaborer={isAddingLaborer}
              staffType={staffType}
              onStaffTypeChange={setStaffType}
              isLoading={isLoadingEmployees}
              loadError={employeesError}
              onRetry={fetchEmployees}
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
                  <div className="flex items-center justify-between border-b border-gray-200 mb-4">
                    <div className="flex">
                      <button
                        onClick={() => setActiveTab('STATS')}
                        className={`flex items-center gap-2 px-6 py-3 border-b-2 font-medium text-sm transition-colors ${activeTab === 'STATS'
                          ? 'border-indigo-600 text-primary'
                          : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                          }`}
                      >
                        <Users className="w-4 h-4" />
                        Field Staff Stats
                      </button>
                      <button
                        onClick={() => setActiveTab('ATTENDANCE')}
                        className={`flex items-center gap-2 px-6 py-3 border-b-2 font-medium text-sm transition-colors ${activeTab === 'ATTENDANCE'
                          ? 'border-indigo-600 text-primary'
                          : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                          }`}
                      >
                        <Calendar className="w-4 h-4" />
                        Attendance Calendar
                      </button>
                      <button
                        onClick={() => setActiveTab('PAYMENTS')}
                        className={`flex items-center gap-2 px-6 py-3 border-b-2 font-medium text-sm transition-colors ${activeTab === 'PAYMENTS'
                          ? 'border-indigo-600 text-primary'
                          : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                          }`}
                      >
                        <CreditCard className="w-4 h-4" />
                        Payments & Payroll
                      </button>
                    </div>
                    <div className="flex items-center gap-1 pr-1">
                      <button
                        onClick={handleOpenEdit}
                        title="Edit staff details"
                        className="p-2 rounded-lg text-gray-400 hover:text-primary hover:bg-indigo-50 transition-colors"
                      >
                        <Pencil className="w-4 h-4" />
                      </button>
                      <button
                        onClick={handleDeactivateLaborer}
                        title="Deactivate staff member"
                        className="p-2 rounded-lg text-gray-400 hover:text-rose-600 hover:bg-rose-50 transition-colors"
                      >
                        <UserX className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  <div className="flex-1 overflow-y-auto custom-scrollbar">
                    {activeTab === 'ATTENDANCE' && (
                      <AttendanceCalendar
                        currentMonth={currentMonth} currentYear={currentYear} attendance={attendance}
                        selectedLaborerId={selectedLaborerId} isSelectionMode={isSelectionMode}
                        onToggleSelectionMode={() => { setIsSelectionMode(!isSelectionMode); setSelectedDates(new Set()); }}
                        selectedDates={selectedDates} onDateClick={(day) => isSelectionMode ? setSelectedDates(prev => { const next = new Set(prev); if (next.has(formatDateISO(currentYear, currentMonth, day))) next.delete(formatDateISO(currentYear, currentMonth, day)); else next.add(formatDateISO(currentYear, currentMonth, day)); return next; }) : setEditingDate(formatDateISO(currentYear, currentMonth, day))}
                        onBulkAction={handleBulkAction}
                        isLoading={attendanceLoading}
                        loadError={attendanceError}
                        onRetry={() => {
                          if (selectedLaborerId) {
                            dispatch(fetchAttendance({ employeeId: selectedLaborerId, month: currentMonth, year: currentYear }));
                          }
                        }}
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
                  className="mt-6 flex items-center gap-2 text-primary font-medium hover:text-indigo-700"
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

