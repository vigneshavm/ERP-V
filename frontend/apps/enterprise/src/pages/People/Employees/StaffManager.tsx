import { useAuthStore } from '@repo/shared';
import { logger } from '@/shared/lib/logger';
import React, { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import { RootState } from "@/app/store/store";
import { SystemRole } from "@repo/shared";
import { Plus, Pencil, Trash2, Users, Loader2, ArrowLeft, ShieldCheck } from 'lucide-react';
import { APP_CONFIG } from "@/app/config";
import api from "@/shared/api/api";

import { TenantUser, DbRoleCode, Tenant } from "@/entities/session/model/core";

const StaffManager: React.FC = () => {
    const {  user  } = useAuthStore();
    const { tenants } = useSelector((state: RootState) => state.tenant);

    // Get current tenant data
    const activeTenant = tenants.find((t: Tenant) => t.id === user?.tenantId);

    const [tenantEmployees, setTenantEmployees] = useState<any[]>([]);
    const [roles, setRoles] = useState<any[]>([]);
    const [isLoadingEmployees, setIsLoadingEmployees] = useState(false);

    const [newEmp, setNewEmp] = useState({
        name: '',
        roleId: '',
        systemRole: SystemRole.STAFF,
        pin: '',
        baseSalary: '',
        wageType: 'MONTHLY',
        joiningDate: new Date().toISOString().split('T')[0],
        mobile: '',
        branchId: '',
        assignedCounterId: '',
        is2faEnabled: false
    });
    const [editingEmpId, setEditingEmpId] = useState<string | null>(null);

    useEffect(() => {
        if (user?.tenantId) {
            fetchTenantEmployees(user.tenantId);
        }
    }, [user?.tenantId]);

    const fetchTenantEmployees = async (tenantId: string) => {
        setIsLoadingEmployees(true);
        try {
            const response = await api.get('/hr/employees');
            const data = response.data.data;

            // Fetch roles
            try {
                const rolesResponse = await api.get('/roles'); // Fetches all system & tenant roles
                if (rolesResponse.data) {
                    setRoles(rolesResponse.data);
                }
            } catch (error) {
                logger.error("Failed to load roles", error);
            }

            // Filter for Office Staff (Monthly or unspecified)
            const officeStaff = (data || []).filter((e: any) => !e.wageType || e.wageType === 'MONTHLY');
            setTenantEmployees(officeStaff);
        } catch (err) {
            logger.error('Error fetching employees:', err);
        } finally {
            setIsLoadingEmployees(false);
        }
    };

    const handleAddEmployee = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!activeTenant || !newEmp.name) return;

        try {
            const empData: any = {
                name: newEmp.name,
                role: roles.find(r => r.id === newEmp.roleId)?.name || SystemRole.STAFF,
                roleId: newEmp.roleId,
                mobile: newEmp.mobile,
                baseSalary: parseFloat(newEmp.baseSalary) || 0,
                dailyRate: newEmp.wageType === 'DAILY' ? parseFloat(newEmp.baseSalary) || 0 : 0,
                branchId: newEmp.branchId,
                wageType: newEmp.wageType,
                joiningDate: newEmp.joiningDate,
                pin: newEmp.pin,
                sector: activeTenant?.sector || 'General'
            };

            if (editingEmpId) {
                const response = await api.put(`/hr/employees/${editingEmpId}`, empData);
                const data = response.data.data;

                if (data) {
                    setTenantEmployees(prev => prev.map(e => e._id === editingEmpId ? data : e));
                    handleCancelEditEmp();
                }
            } else {
                const response = await api.post('/hr/employees', empData);
                const data = response.data.data;

                if (data) {
                    setTenantEmployees(prev => [data, ...prev]);
                    handleCancelEditEmp();
                }
            }
        } catch (err: any) {
            logger.error('Error saving employee:', err);
            alert(`Error: ${err.message || 'Failed to save'} `);
        }
    };

    const handleStartEditEmp = (emp: any) => {
        setNewEmp({
            name: emp.name,
            roleId: emp.roleId || '',
            systemRole: SystemRole.STAFF,
            pin: emp.pin || '',
            baseSalary: (emp.baseSalary || emp.dailyRate || '').toString(),
            wageType: emp.wageType || 'MONTHLY',
            joiningDate: emp.joiningDate ? new Date(emp.joiningDate).toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
            branchId: emp.branchId || '',
            mobile: emp.mobile || '',
            assignedCounterId: emp.assignedCounterId || '',
            is2faEnabled: emp.is2faEnabled || false
        });
        setEditingEmpId(emp.id);
    };

    const handleCancelEditEmp = () => {
        setNewEmp({
            name: '', roleId: '', systemRole: SystemRole.STAFF, pin: '',
            baseSalary: '', wageType: 'MONTHLY',
            joiningDate: new Date().toISOString().split('T')[0],
            mobile: '', branchId: '', assignedCounterId: '', is2faEnabled: false
        });
        setEditingEmpId(null);
    };

    const handleDeleteEmployee = async (id: string) => {
        if (!window.confirm('Are you sure you want to remove this employee?')) return;

        try {
            await api.delete(`/hr/employees/${id}`);
            setTenantEmployees(prev => prev.filter(e => e._id !== id));
        } catch (err: any) {
            logger.error('Error deleting employee:', err);
        }
    };

    // if (!activeTenant) return null; // Non-blocking render
    const branches = activeTenant?.locations?.flatMap((l: any) => l.branches) || [];

    return (
        <div className="space-y-6 animate-in fade-in duration-500">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-2xl font-bold text-main">Staff Management</h2>
                    <p className="text-muted dark:text-muted text-sm">Manage users, roles, and terminal assignments.</p>
                </div>
                <div className="flex items-center gap-2 px-3 py-1.5 bg-blue-50 dark:bg-[var(--erp-bg)] rounded-lg border border-blue-100 dark:border-default">
                    <Users className="w-4 h-4 text-blue-600" />
                    <span className="text-xs font-bold text-blue-700">{tenantEmployees.length} Active Staff</span>
                </div>
            </div>

            <div className="grid lg:grid-cols-3 gap-6">
                {/* Form Section */}
                <div className="lg:col-span-1">
                    <div className="bg-white dark:bg-[var(--erp-card)] rounded-xl shadow-sm border border-default dark:border-default overflow-hidden sticky top-24">
                        <div className="p-4 border-b border-default dark:border-default bg-[var(--erp-bg-sunken)] dark:bg-[var(--erp-bg)]/50 font-bold text-secondary dark:text-muted flex items-center gap-2">
                            {editingEmpId ? <Pencil className="w-4 h-4 text-blue-600" /> : <Plus className="w-4 h-4 text-blue-600" />}
                            {editingEmpId ? 'Edit Staff Member' : 'Add New Staff'}
                        </div>
                        <form onSubmit={handleAddEmployee} className="p-4 space-y-4">
                            <div>
                                <label className="block text-xs font-bold text-muted uppercase mb-1">Full Name</label>
                                <input
                                    required
                                    className="w-full px-3 py-2 border border-default dark:border-default bg-white dark:bg-[var(--erp-bg)] rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-sm dark:text-main"
                                    value={newEmp.name}
                                    onChange={e => setNewEmp({ ...newEmp, name: e.target.value })}
                                    placeholder="e.g. John Doe"
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-muted uppercase mb-1">Phone Number</label>
                                <input
                                    className="w-full px-3 py-2 border border-default dark:border-default bg-white dark:bg-[var(--erp-bg)] rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-sm dark:text-main"
                                    value={newEmp.mobile}
                                    onChange={e => setNewEmp({ ...newEmp, mobile: e.target.value })}
                                    placeholder="e.g. 9876543210"
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-muted uppercase mb-1">Role</label>
                                <select
                                    className="w-full px-3 py-2 border border-default dark:border-default bg-white dark:bg-[var(--erp-bg)] rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-sm dark:text-main"
                                    value={newEmp.roleId}
                                    onChange={e => setNewEmp({ ...newEmp, roleId: e.target.value })}
                                >
                                    <option value="">Select Role</option>
                                    {roles.map(r => (
                                        <option key={r.id} value={r.id}>{r.name}</option>
                                    ))}
                                </select>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs font-bold text-muted uppercase mb-1">Joining Date</label>
                                    <input
                                        required
                                        type="date"
                                        className="w-full px-3 py-2 border border-default dark:border-default bg-white dark:bg-[var(--erp-bg)] rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-sm dark:text-main"
                                        value={newEmp.joiningDate}
                                        onChange={e => setNewEmp({ ...newEmp, joiningDate: e.target.value })}
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-muted uppercase mb-1">Login PIN (4 Digits)</label>
                                    <input
                                        required
                                        maxLength={4}
                                        className="w-full px-3 py-2 border border-default dark:border-default bg-white dark:bg-[var(--erp-bg)] rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-sm font-mono tracking-widest dark:text-main"
                                        value={newEmp.pin}
                                        onChange={e => setNewEmp({ ...newEmp, pin: e.target.value.replace(/\D/g, '') })}
                                        placeholder="1234"
                                    />
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs font-bold text-muted uppercase mb-1">Base Salary / Rate</label>
                                    <input
                                        required
                                        type="number"
                                        className="w-full px-3 py-2 border border-default dark:border-default bg-white dark:bg-[var(--erp-bg)] rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-sm dark:text-main"
                                        value={newEmp.baseSalary}
                                        onChange={e => setNewEmp({ ...newEmp, baseSalary: e.target.value })}
                                        placeholder="e.g. 15000"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-muted uppercase mb-1">Wage Type</label>
                                    <select
                                        className="w-full px-3 py-2 border border-default dark:border-default bg-white dark:bg-[var(--erp-bg)] rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-sm dark:text-main"
                                        value={newEmp.wageType}
                                        onChange={e => setNewEmp({ ...newEmp, wageType: e.target.value })}
                                    >
                                        <option value="MONTHLY">Monthly</option>
                                        <option value="DAILY">Daily</option>
                                        <option value="HOURLY">Hourly</option>
                                    </select>
                                </div>
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-muted uppercase mb-1">Assigned Branch</label>
                                <select
                                    className="w-full px-3 py-2 border border-default dark:border-default bg-white dark:bg-[var(--erp-bg)] rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-sm dark:text-main"
                                    value={newEmp.branchId}
                                    onChange={e => setNewEmp({ ...newEmp, branchId: e.target.value, assignedCounterId: '' })}
                                >
                                    <option value="">Select Branch</option>
                                    {branches.map((br: any) => (
                                        <option key={br.id} value={br.id}>{br.name} ({br.city})</option>
                                    ))}
                                </select>
                            </div>

                            {/* Counter Assignment */}
                            {newEmp.branchId && (
                                <div className="p-3 bg-indigo-50 dark:bg-indigo-900/20 border border-indigo-100 dark:border-indigo-800 rounded-lg animate-in fade-in slide-in-from-top-2">
                                    <label className="block text-xs font-bold text-indigo-700 dark:text-indigo-400 uppercase mb-1">Terminal Assignment</label>
                                    <select
                                        className="w-full px-3 py-2 border border-indigo-200 dark:border-indigo-800 bg-white dark:bg-[var(--erp-bg)] rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none text-sm font-bold text-indigo-900 dark:text-indigo-300"
                                        value={newEmp.assignedCounterId}
                                        onChange={e => setNewEmp({ ...newEmp, assignedCounterId: e.target.value })}
                                    >
                                        <option value="">No Terminal (Float)</option>
                                        {(branches.find((b: any) => b.id === newEmp.branchId) as any)?.counters?.map((c: any) => (
                                            <option key={c.id} value={c.id}>{c.id} - {c.name}</option>
                                        ))}
                                    </select>
                                    <p className="text-[10px] text-indigo-500 dark:text-indigo-400 mt-1 italic">Assigning a terminal locks this staff to a specific counter.</p>
                                </div>
                            )}

                            <div className="flex items-center justify-between p-3 bg-[var(--erp-bg-sunken)] dark:bg-[var(--erp-bg)]/50 rounded-lg border border-default dark:border-default">
                                <div className="flex items-center gap-2">
                                    <ShieldCheck className={`w-4 h-4 ${newEmp.is2faEnabled ? 'text-emerald-500' : 'text-muted'}`} />
                                    <span className="text-xs font-bold text-secondary dark:text-muted">Enable 2FA Protection</span>
                                </div>
                                <label className="relative inline-flex items-center cursor-pointer">
                                    <input
                                        type="checkbox"
                                        className="sr-only peer"
                                        checked={newEmp.is2faEnabled}
                                        onChange={e => setNewEmp({ ...newEmp, is2faEnabled: e.target.checked })}
                                    />
                                    <div className="w-8 h-4 bg-slate-200 peer-focus:outline-none rounded-full peer dark:bg-slate-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-3 after:w-3 after:transition-all peer-checked:bg-emerald-500"></div>
                                </label>
                            </div>

                            <div className="flex gap-2 pt-2">
                                {editingEmpId && (
                                    <button
                                        type="button"
                                        onClick={handleCancelEditEmp}
                                        className="flex-1 border border-default dark:border-default text-secondary dark:text-muted py-2 rounded-lg font-medium hover:bg-[var(--erp-bg-sunken)] dark:hover:bg-slate-700 transition"
                                    >
                                        Cancel
                                    </button>
                                )}
                                <button
                                    type="submit"
                                    className="flex-1 bg-blue-600 text-white py-2 rounded-lg font-bold hover:bg-blue-700 transition shadow-sm border border-blue-700"
                                >
                                    {editingEmpId ? 'Update Staff' : 'Add Staff'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>

                {/* List Section */}
                <div className="lg:col-span-2 space-y-4">
                    {isLoadingEmployees ? (
                        <div className="flex flex-col items-center justify-center py-20 bg-white dark:bg-[var(--erp-card)] rounded-xl border border-default dark:border-default border-dashed">
                            <Loader2 className="w-10 h-10 animate-spin text-blue-500 mb-4" />
                            <p className="text-muted dark:text-muted font-bold">Synchronizing Staff Members...</p>
                        </div>
                    ) : tenantEmployees.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-20 bg-white dark:bg-[var(--erp-card)] rounded-xl border border-default dark:border-default border-dashed">
                            <Users className="w-12 h-12 text-muted mb-4" />
                            <h3 className="text-lg font-bold text-main">No Staff Members Found</h3>
                            <p className="text-muted dark:text-muted max-w-xs text-center mt-2">Add employees to enable store operations and logins.</p>
                        </div>
                    ) : (
                        <div className="grid gap-3">
                            {tenantEmployees.map(emp => (
                                <div key={emp.id} className="bg-white dark:bg-[var(--erp-card)] p-4 rounded-xl shadow-sm border border-default dark:border-default hover:shadow-md transition-all flex items-center justify-between group">
                                    <div className="flex items-center gap-4">
                                        <div className="w-10 h-10 bg-[var(--erp-bg-sunken)] dark:bg-[var(--erp-bg)] rounded-full flex items-center justify-center text-muted dark:text-muted font-bold group-hover:bg-blue-100 dark:group-hover:bg-blue-900/30 group-hover:text-blue-600 transition-colors">
                                            {emp.name.charAt(0)}
                                        </div>
                                        <div>
                                            <div className="flex items-center gap-2">
                                                <h4 className="font-bold text-main">{emp.name}</h4>
                                                <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${emp.system_role === SystemRole.OWNER ? 'bg-purple-50 dark:bg-purple-900/30 text-purple-700 dark:text-purple-400 border-purple-200 dark:border-purple-800' : emp.system_role === SystemRole.ADMIN ? 'bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 border-blue-200 dark:border-blue-800' : 'bg-[var(--erp-bg-sunken)] dark:bg-[var(--erp-bg)]/30 text-secondary dark:text-muted border-default dark:border-default'} `}>
                                                    {emp.system_role}
                                                </span>
                                            </div>
                                            <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted dark:text-muted mt-1">
                                                {emp.phone_number && <span className="font-mono">{emp.phone_number}</span>}
                                                {emp.phone_number && <span className="text-muted dark:text-secondary">|</span>}
                                                <span className="font-mono uppercase tracking-wider bg-[var(--erp-bg-sunken)] dark:bg-[var(--erp-bg)] px-1 rounded border border-default dark:border-default text-[10px]">PIN: {emp.pin}</span>
                                                {emp.branch_id && (
                                                    <>
                                                        <span className="text-muted dark:text-secondary">|</span>
                                                        <span className="text-blue-600 dark:text-blue-400 font-medium">{branches.find((b: any) => b.id === emp.branch_id)?.name || 'Unknown Branch'}</span>
                                                    </>
                                                )}
                                                {emp.assigned_counter_id && (
                                                    <>
                                                        <span className="text-muted dark:text-secondary">|</span>
                                                        <span className="font-bold text-indigo-600 dark:text-indigo-400">Terminal: {emp.assigned_counter_id}</span>
                                                    </>
                                                )}
                                                <span className="text-muted dark:text-secondary">|</span>
                                                <span className={`font-bold flex items-center gap-1 ${emp.is2faEnabled ? 'text-emerald-600 dark:text-emerald-400' : 'text-muted'}`}>
                                                    <ShieldCheck className="w-3 h-3" />
                                                    {emp.is2faEnabled ? '2FA ON' : '2FA OFF'}
                                                </span>
                                                <span className="text-muted dark:text-secondary">|</span>
                                                <span className="text-indigo-600 dark:text-indigo-400 font-bold">
                                                    ₹{emp.baseSalary || emp.dailyRate}/ {emp.wageType?.toLowerCase()}
                                                </span>
                                                <span className="text-muted dark:text-secondary">|</span>
                                                <span className="text-muted dark:text-muted">
                                                    Joined: {emp.joiningDate ? new Date(emp.joiningDate).toLocaleDateString() : 'N/A'}
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <button
                                            onClick={() => handleStartEditEmp(emp)}
                                            className="p-2 text-muted hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/30 rounded-lg transition-all"
                                        >
                                            <Pencil className="w-4 h-4" />
                                        </button>
                                        <button
                                            onClick={() => handleDeleteEmployee(emp.id)}
                                            className="p-2 text-muted hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/30 rounded-lg transition-all"
                                        >
                                            <Trash2 className="w-4 h-4" />
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default StaffManager;

