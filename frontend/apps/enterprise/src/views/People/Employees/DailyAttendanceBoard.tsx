import { logger } from '@/shared/lib/logger';
import React, { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import { RootState } from "@/app/store/store";
import {
    Calendar,
    CheckCircle2,
    XCircle,
    Clock,
    Save,
    Loader2,
    Users,
    Search,
    ChevronLeft,
    ChevronRight,
    Filter
} from 'lucide-react';
import { Layout, PageHeader } from "@/shared/ui";
import api from "@/shared/api/api";
import { AttendanceStatus } from "@repo/shared";

const DailyAttendanceBoard: React.FC = () => {
    const { user } = useSelector((state: RootState) => state.auth);
    const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
    const [employees, setEmployees] = useState<any[]>([]);
    const [attendanceMap, setAttendanceMap] = useState<Record<string, any>>({});
    const [isLoading, setIsLoading] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [message, setMessage] = useState({ text: '', type: '' });

    useEffect(() => {
        fetchData();
    }, [selectedDate]);

    const fetchData = async () => {
        setIsLoading(true);
        try {
            // Fetch employees
            const empRes = await api.get('/hr/employees');
            const emps = empRes.data.data || [];
            setEmployees(emps);

            // Fetch attendance for this date
            const attRes = await api.get(`/api/attendance/date/${selectedDate}`);
            const attData = attRes.data.data || [];

            // Map attendance to employee IDs
            const map: Record<string, any> = {};
            emps.forEach((emp: any) => {
                const record = attData.find((a: any) => a.employeeId === emp._id || a.employeeId === emp.id);
                map[emp._id || emp.id] = record || {
                    status: 'ABSENT',
                    overtimeHours: 0,
                    isDirty: false
                };
            });
            setAttendanceMap(map);
        } catch (err) {
            logger.error('Error fetching data:', err);
        } finally {
            setIsLoading(false);
        }
    };

    const handleStatusChange = (empId: string, status: AttendanceStatus) => {
        setAttendanceMap(prev => ({
            ...prev,
            [empId]: { ...prev[empId], status, isDirty: true }
        }));
    };

    const handleOvertimeChange = (empId: string, hours: string) => {
        setAttendanceMap(prev => ({
            ...prev,
            [empId]: { ...prev[empId], overtimeHours: parseFloat(hours) || 0, isDirty: true }
        }));
    };

    const handleSave = async () => {
        setIsSaving(true);
        setMessage({ text: '', type: '' });
        try {
            const records = Object.entries(attendanceMap)
                .filter(([_, data]) => data.isDirty)
                .map(([empId, data]) => ({
                    employeeId: empId,
                    status: data.status,
                    overtimeHours: data.overtimeHours
                }));

            if (records.length === 0) {
                setMessage({ text: 'No changes to save', type: 'info' });
                return;
            }

            await api.post('/attendance/mark', {
                date: selectedDate,
                attendance: records
            });

            setMessage({ text: 'Attendance saved successfully!', type: 'success' });

            // Re-fetch to clear dirty flags
            fetchData();
        } catch (err: any) {
            logger.error('Save error:', err);
            setMessage({ text: err.response?.data?.message || 'Failed to save attendance', type: 'error' });
        } finally {
            setIsSaving(false);
        }
    };

    const filteredEmployees = employees.filter(emp =>
        emp.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        emp.role.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const changeDate = (days: number) => {
        const d = new Date(selectedDate);
        d.setDate(d.getDate() + days);
        setSelectedDate(d.toISOString().split('T')[0]);
    };

    return (
        <Layout>
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                <PageHeader
                    title="Daily Attendance Board"
                    description="Mark and review attendance for all staff members today."
                    breadcrumbs={[
                        { label: 'Employees', link: '/people/employees' },
                        { label: 'Attendance Board' }
                    ]}
                />

                {/* Controls */}
                <div className="mt-8 flex flex-col md:flex-row gap-4 items-center justify-between bg-white dark:bg-slate-800 p-4 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm">
                    <div className="flex items-center gap-3">
                        <div className="flex items-center bg-slate-100 dark:bg-slate-900 rounded-lg p-1 border border-slate-200 dark:border-slate-800">
                            <button
                                onClick={() => changeDate(-1)}
                                className="p-2 hover:bg-white dark:hover:bg-slate-800 rounded-md transition-all text-slate-500 hover:text-blue-600"
                            >
                                <ChevronLeft size={18} />
                            </button>
                            <div className="px-4 py-1.5 flex items-center gap-2">
                                <Calendar size={16} className="text-blue-600" />
                                <input
                                    type="date"
                                    value={selectedDate}
                                    onChange={(e) => setSelectedDate(e.target.value)}
                                    className="bg-transparent border-none outline-none font-bold text-sm text-slate-700 dark:text-slate-200"
                                />
                            </div>
                            <button
                                onClick={() => changeDate(1)}
                                className="p-2 hover:bg-white dark:hover:bg-slate-800 rounded-md transition-all text-slate-500 hover:text-blue-600"
                            >
                                <ChevronRight size={18} />
                            </button>
                        </div>

                        <div className="relative">
                            <Search className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
                            <input
                                type="text"
                                placeholder="Search employees..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="pl-10 pr-4 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg text-sm w-64 outline-none focus:ring-2 focus:ring-blue-500/50"
                            />
                        </div>
                    </div>

                    <div className="flex items-center gap-3">
                        {message.text && (
                            <span className={`text-xs font-bold px-3 py-1.5 rounded-full transition-all animate-in fade-in zoom-in ${message.type === 'success' ? 'bg-emerald-50 text-emerald-600 border border-emerald-100' :
                                message.type === 'error' ? 'bg-rose-50 text-rose-600 border border-rose-100' :
                                    'bg-blue-50 text-blue-600 border border-blue-100'
                                }`}>
                                {message.text}
                            </span>
                        )}
                        <button
                            disabled={isSaving || !Object.values(attendanceMap).some(v => v.isDirty)}
                            onClick={handleSave}
                            className="bg-blue-600 hover:bg-blue-700 disabled:bg-slate-400 text-white px-6 py-2 rounded-lg font-bold flex items-center gap-2 shadow-lg shadow-blue-500/20 transition-all uppercase text-xs tracking-widest"
                        >
                            {isSaving ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
                            Save Attendance
                        </button>
                    </div>
                </div>

                {/* Board */}
                <div className="mt-6 bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700 overflow-hidden">
                    {isLoading ? (
                        <div className="py-32 flex flex-col items-center justify-center">
                            <Loader2 className="w-12 h-12 animate-spin text-blue-500 mb-4" />
                            <p className="text-slate-500 font-bold dark:text-slate-400">Loading attendance data...</p>
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full text-left">
                                <thead>
                                    <tr className="bg-slate-50 dark:bg-slate-900/50 border-b border-slate-100 dark:border-slate-700">
                                        <th className="px-6 py-4 text-xs font-black text-slate-500 uppercase tracking-widest">Employee</th>
                                        <th className="px-6 py-4 text-xs font-black text-slate-500 uppercase tracking-widest text-center">Status</th>
                                        <th className="px-6 py-4 text-xs font-black text-slate-500 uppercase tracking-widest text-center">Overtime (Hrs)</th>
                                        <th className="px-6 py-4 text-xs font-black text-slate-500 uppercase tracking-widest text-right">Summary</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
                                    {filteredEmployees.map(emp => {
                                        const id = emp._id || emp.id;
                                        const att = attendanceMap[id] || { status: 'ABSENT', overtimeHours: 0 };

                                        return (
                                            <tr key={id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/50 transition-colors">
                                                <td className="px-6 py-4">
                                                    <div className="flex items-center gap-3">
                                                        <div className="w-9 h-9 bg-blue-50 dark:bg-blue-900/40 rounded-full flex items-center justify-center text-blue-600 dark:text-blue-400 font-black text-xs border border-blue-100 dark:border-blue-800">
                                                            {emp.name.charAt(0)}
                                                        </div>
                                                        <div>
                                                            <p className="font-bold text-slate-800 dark:text-white">{emp.name}</p>
                                                            <p className="text-xs text-slate-500">{emp.role} • {emp.mobile}</p>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <div className="flex items-center justify-center gap-2">
                                                        {[
                                                            { id: 'PRESENT', label: 'Full', icon: CheckCircle2, color: 'emerald' },
                                                            { id: 'HALF', label: 'Half', icon: Clock, color: 'amber' },
                                                            { id: 'ABSENT', label: 'Absnt', icon: XCircle, color: 'rose' }
                                                        ].map(s => (
                                                            <button
                                                                key={s.id}
                                                                onClick={() => handleStatusChange(id, s.id as AttendanceStatus)}
                                                                className={`flex flex-col items-center gap-1 p-2 rounded-xl border transition-all ${att.status === s.id
                                                                    ? `bg-${s.color}-50 dark:bg-${s.color}-900/20 border-${s.color}-200 dark:border-${s.color}-800 text-${s.color}-600`
                                                                    : 'bg-transparent border-transparent text-slate-400 hover:bg-slate-50'
                                                                    }`}
                                                            >
                                                                <s.icon size={20} />
                                                                <span className="text-[10px] font-black uppercase tracking-tighter">{s.label}</span>
                                                            </button>
                                                        ))}
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <div className="flex justify-center">
                                                        <input
                                                            type="number"
                                                            step="0.5"
                                                            min="0"
                                                            max="8"
                                                            value={att.overtimeHours}
                                                            onChange={(e) => handleOvertimeChange(id, e.target.value)}
                                                            className="w-20 text-center py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg font-bold text-sm outline-none focus:ring-2 focus:ring-indigo-500/50"
                                                        />
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4 text-right">
                                                    <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-slate-100 dark:bg-slate-900 rounded-full border border-slate-200 dark:border-slate-800">
                                                        <span className={`w-2 h-2 rounded-full ${att.status === 'PRESENT' ? 'bg-emerald-500' :
                                                            att.status === 'HALF' ? 'bg-amber-500' : 'bg-rose-500'
                                                            }`} />
                                                        <span className="text-[10px] font-black text-slate-600 dark:text-slate-400 uppercase tracking-widest">
                                                            {att.status} {att.overtimeHours > 0 ? `+ ${att.overtimeHours}H OT` : ''}
                                                        </span>
                                                    </div>
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>

                {/* Legend */}
                <div className="mt-8 flex flex-wrap gap-6 justify-center text-xs font-bold text-slate-500 uppercase tracking-widest">
                    <div className="flex items-center gap-2">
                        <div className="w-3 h-3 bg-emerald-500 rounded-full" /> Full Day 100%
                    </div>
                    <div className="flex items-center gap-2">
                        <div className="w-3 h-3 bg-amber-500 rounded-full" /> Half Day 50%
                    </div>
                    <div className="flex items-center gap-2">
                        <div className="w-3 h-3 bg-rose-500 rounded-full" /> Absent 0%
                    </div>
                    <div className="flex items-center gap-2">
                        <Calendar size={14} className="text-blue-500" /> Mark Retroactively
                    </div>
                </div>
            </div>
        </Layout>
    );
};

export default DailyAttendanceBoard;

