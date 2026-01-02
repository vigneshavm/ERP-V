
import React, { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import { RootState } from '../store';
import { SystemRole } from '../types/common';
import { Plus, Pencil, Trash2, Users, Loader2, ArrowLeft, ShieldCheck } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { APP_CONFIG } from '../config';
import { securePassword } from '../utils/auth';

const StaffManager: React.FC = () => {
    const { user } = useSelector((state: RootState) => state.auth);
    const { tenants } = useSelector((state: RootState) => state.tenant);

    // Get current tenant data
    const activeTenant = tenants.find(t => t.id === user?.tenantId);

    const [tenantEmployees, setTenantEmployees] = useState<any[]>([]);
    const [isLoadingEmployees, setIsLoadingEmployees] = useState(false);

    const [newEmp, setNewEmp] = useState({
        name: '',
        role: '',
        systemRole: 'Staff' as SystemRole,
        pin: '',
        dailyRate: '',
        branchId: '',
        phoneNumber: '',
        assignedCounterId: ''
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
            if (APP_CONFIG.USE_SUPABASE && supabase) {
                const { data, error } = await supabase
                    .from('employees')
                    .select('*')
                    .eq('tenant_id', tenantId);

                if (error) throw error;
                setTenantEmployees(data || []);
            }
        } catch (err) {
            console.error('Error fetching employees:', err);
        } finally {
            setIsLoadingEmployees(false);
        }
    };

    const handleAddEmployee = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!activeTenant || !newEmp.name) return;

        // Validation for new user
        if (!editingEmpId && (!newEmp.pin || newEmp.pin.length === 0)) {
            alert("PIN is required for new users.");
            return;
        }

        try {
            if (APP_CONFIG.USE_SUPABASE && supabase) {
                let pinToSave = '';

                // Secure PIN if provided
                if (newEmp.pin && newEmp.pin.length > 0) {
                    pinToSave = await securePassword(newEmp.pin);
                }

                const empData: any = {
                    name: newEmp.name,
                    role: newEmp.role,
                    system_role: newEmp.systemRole,
                    daily_rate: parseFloat(newEmp.dailyRate) || 0,
                    branch_id: newEmp.branchId,
                    tenant_id: activeTenant.id,
                    sector: activeTenant.sector,
                    phone_number: newEmp.phoneNumber,
                    assigned_counter_id: newEmp.assignedCounterId,
                    // Only include PIN if we have a new one (encrypted)
                    ...(pinToSave && pinToSave.length > 0 ? { pin: pinToSave } : {}),
                };

                if (editingEmpId) {
                    const { data, error } = await supabase
                        .from('employees')
                        .update(empData)
                        .eq('id', editingEmpId)
                        .select()
                        .single();

                    if (error) throw error;
                    if (data) {
                        setTenantEmployees(prev => prev.map(e => e.id === editingEmpId ? data : e));
                        handleCancelEditEmp();
                    }
                } else {
                    const { data, error } = await supabase
                        .from('employees')
                        .insert([empData])
                        .select()
                        .single();

                    if (error) throw error;
                    if (data) {
                        setTenantEmployees(prev => [...prev, data]);
                        handleCancelEditEmp();
                    }
                }
            }
        } catch (err: any) {
            console.error('Error saving employee:', err);
            alert(`Error: ${err.message}`);
        }
    };

    const handleStartEditEmp = (emp: any) => {
        setNewEmp({
            name: emp.name,
            role: emp.role || '',
            systemRole: emp.system_role as SystemRole,
            pin: '', // Do NOT verify or populate existing PIN for security
            dailyRate: emp.daily_rate?.toString() || '',
            branchId: emp.branch_id || '',
            phoneNumber: emp.phone_number || '',
            assignedCounterId: emp.assigned_counter_id || ''
        });
        setEditingEmpId(emp.id);
    };

    const handleCancelEditEmp = () => {
        setNewEmp({ name: '', role: '', systemRole: 'Staff', pin: '', dailyRate: '', branchId: '', phoneNumber: '', assignedCounterId: '' });
        setEditingEmpId(null);
    };

    const handleDeleteEmployee = async (id: string) => {
        if (!window.confirm('Are you sure you want to remove this employee?')) return;

        try {
            if (APP_CONFIG.USE_SUPABASE && supabase) {
                const { error } = await supabase
                    .from('employees')
                    .delete()
                    .eq('id', id);

                if (error) throw error;
                setTenantEmployees(prev => prev.filter(e => e.id !== id));
            }
        } catch (err: any) {
            console.error('Error deleting employee:', err);
        }
    };

    if (!activeTenant) return null;

    const branches = activeTenant.locations?.flatMap(l => l.branches) || [];

    return (
        <div className="space-y-6 animate-in fade-in duration-500">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-2xl font-bold text-slate-800 dark:text-white">Staff Management</h2>
                    <p className="text-slate-500 dark:text-slate-400 text-sm">Manage users, roles, and terminal assignments.</p>
                </div>
                <div className="flex items-center gap-2 px-3 py-1.5 bg-blue-50 dark:bg-slate-900 rounded-lg border border-blue-100 dark:border-slate-800">
                    <Users className="w-4 h-4 text-blue-600" />
                    <span className="text-xs font-bold text-blue-700">{tenantEmployees.length} Active Staff</span>
                </div>
            </div>

            <div className="grid lg:grid-cols-3 gap-6">
                {/* Form Section */}
                <div className="lg:col-span-1">
                    <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 overflow-hidden sticky top-24">
                        <div className="p-4 border-b border-slate-100 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/50 font-bold text-slate-700 dark:text-slate-300 flex items-center gap-2">
                            {editingEmpId ? <Pencil className="w-4 h-4 text-blue-600" /> : <Plus className="w-4 h-4 text-blue-600" />}
                            {editingEmpId ? 'Edit Staff Member' : 'Add New Staff'}
                        </div>
                        <form onSubmit={handleAddEmployee} className="p-4 space-y-4">
                            <div>
                                <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Full Name</label>
                                <input
                                    required
                                    className="w-full px-3 py-2 border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-sm dark:text-white"
                                    value={newEmp.name}
                                    onChange={e => setNewEmp({ ...newEmp, name: e.target.value })}
                                    placeholder="e.g. John Doe"
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Phone Number</label>
                                <input
                                    className="w-full px-3 py-2 border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-sm dark:text-white"
                                    value={newEmp.phoneNumber}
                                    onChange={e => setNewEmp({ ...newEmp, phoneNumber: e.target.value })}
                                    placeholder="e.g. 9876543210"
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-slate-500 uppercase mb-1">System Role</label>
                                <select
                                    className="w-full px-3 py-2 border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-sm dark:text-white"
                                    value={newEmp.systemRole}
                                    onChange={e => setNewEmp({ ...newEmp, systemRole: e.target.value as SystemRole })}
                                >
                                    <option value="Staff">Staff (POS Only)</option>
                                    <option value="Manager">Manager</option>
                                    <option value="Admin">Admin</option>
                                    <option value="Owner">Owner</option>
                                </select>
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Login PIN (4 Digits)</label>
                                <input
                                    required
                                    maxLength={4}
                                    className="w-full px-3 py-2 border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-sm font-mono tracking-widest dark:text-white"
                                    value={newEmp.pin}
                                    onChange={e => setNewEmp({ ...newEmp, pin: e.target.value.replace(/\D/g, '') })}
                                    placeholder="1234"
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Assigned Branch</label>
                                <select
                                    className="w-full px-3 py-2 border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-sm dark:text-white"
                                    value={newEmp.branchId}
                                    onChange={e => setNewEmp({ ...newEmp, branchId: e.target.value, assignedCounterId: '' })}
                                >
                                    <option value="">Select Branch</option>
                                    {branches.map(br => (
                                        <option key={br.id} value={br.id}>{br.name} ({br.city})</option>
                                    ))}
                                </select>
                            </div>

                            {/* Counter Assignment */}
                            {newEmp.branchId && (
                                <div className="p-3 bg-indigo-50 dark:bg-indigo-900/20 border border-indigo-100 dark:border-indigo-800 rounded-lg animate-in fade-in slide-in-from-top-2">
                                    <label className="block text-xs font-bold text-indigo-700 dark:text-indigo-400 uppercase mb-1">Terminal Assignment</label>
                                    <select
                                        className="w-full px-3 py-2 border border-indigo-200 dark:border-indigo-800 bg-white dark:bg-slate-900 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none text-sm font-bold text-indigo-900 dark:text-indigo-300"
                                        value={newEmp.assignedCounterId}
                                        onChange={e => setNewEmp({ ...newEmp, assignedCounterId: e.target.value })}
                                    >
                                        <option value="">No Terminal (Float)</option>
                                        {(branches.find(b => b.id === newEmp.branchId) as any)?.counters?.map((c: any) => (
                                            <option key={c.id} value={c.id}>{c.id} - {c.name}</option>
                                        ))}
                                    </select>
                                    <p className="text-[10px] text-indigo-500 dark:text-indigo-400 mt-1 italic">Assigning a terminal locks this staff to a specific counter.</p>
                                </div>
                            )}

                            <div className="flex gap-2 pt-2">
                                {editingEmpId && (
                                    <button
                                        type="button"
                                        onClick={handleCancelEditEmp}
                                        className="flex-1 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 py-2 rounded-lg font-medium hover:bg-slate-50 dark:hover:bg-slate-700 transition"
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
                        <div className="flex flex-col items-center justify-center py-20 bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 border-dashed">
                            <Loader2 className="w-10 h-10 animate-spin text-blue-500 mb-4" />
                            <p className="text-slate-500 dark:text-slate-400 font-bold">Synchronizing Staff Members...</p>
                        </div>
                    ) : tenantEmployees.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-20 bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 border-dashed">
                            <Users className="w-12 h-12 text-slate-300 mb-4" />
                            <h3 className="text-lg font-bold text-slate-800 dark:text-white">No Staff Members Found</h3>
                            <p className="text-slate-500 dark:text-slate-400 max-w-xs text-center mt-2">Add employees to enable store operations and logins.</p>
                        </div>
                    ) : (
                        <div className="grid gap-3">
                            {tenantEmployees.map(emp => (
                                <div key={emp.id} className="bg-white dark:bg-slate-800 p-4 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 hover:shadow-md transition-all flex items-center justify-between group">
                                    <div className="flex items-center gap-4">
                                        <div className="w-10 h-10 bg-slate-100 dark:bg-slate-900 rounded-full flex items-center justify-center text-slate-500 dark:text-slate-400 font-bold group-hover:bg-blue-100 dark:group-hover:bg-blue-900/30 group-hover:text-blue-600 transition-colors">
                                            {emp.name.charAt(0)}
                                        </div>
                                        <div>
                                            <div className="flex items-center gap-2">
                                                <h4 className="font-bold text-slate-800 dark:text-white">{emp.name}</h4>
                                                <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${emp.system_role === 'Owner' ? 'bg-purple-50 dark:bg-purple-900/30 text-purple-700 dark:text-purple-400 border-purple-200 dark:border-purple-800' : emp.system_role === 'Admin' ? 'bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 border-blue-200 dark:border-blue-800' : 'bg-slate-50 dark:bg-slate-900/30 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-800'}`}>
                                                    {emp.system_role}
                                                </span>
                                            </div>
                                            <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-slate-500 dark:text-slate-400 mt-1">
                                                {emp.phone_number && <span className="font-mono">{emp.phone_number}</span>}
                                                {emp.phone_number && <span className="text-slate-300 dark:text-slate-700">|</span>}
                                                <span className="font-mono uppercase tracking-wider bg-slate-50 dark:bg-slate-900 px-1 rounded border border-slate-100 dark:border-slate-700 text-[10px]">PIN: {emp.pin}</span>
                                                {emp.branch_id && (
                                                    <>
                                                        <span className="text-slate-300 dark:text-slate-700">|</span>
                                                        <span className="text-blue-600 dark:text-blue-400 font-medium">{branches.find(b => b.id === emp.branch_id)?.name || 'Unknown Branch'}</span>
                                                    </>
                                                )}
                                                {emp.assigned_counter_id && (
                                                    <>
                                                        <span className="text-slate-300 dark:text-slate-700">|</span>
                                                        <span className="font-bold text-indigo-600 dark:text-indigo-400">Terminal: {emp.assigned_counter_id}</span>
                                                    </>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <button
                                            onClick={() => handleStartEditEmp(emp)}
                                            className="p-2 text-slate-300 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/30 rounded-lg transition-all"
                                        >
                                            <Pencil className="w-4 h-4" />
                                        </button>
                                        <button
                                            onClick={() => handleDeleteEmployee(emp.id)}
                                            className="p-2 text-slate-300 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/30 rounded-lg transition-all"
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
