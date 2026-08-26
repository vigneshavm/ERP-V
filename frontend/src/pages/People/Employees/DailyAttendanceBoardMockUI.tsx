import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
    Users, Clock, Calendar, Search, Filter, 
    CheckCircle2, UserMinus, ChevronLeft, ChevronRight, Save, XCircle, Loader2, Zap
} from 'lucide-react';
import { employees } from '../../../data';
import Layout from '../../../components/shared/Layout';

type AttendanceStatus = 'PRESENT' | 'HALF' | 'ABSENT' | 'LATE' | 'ON_LEAVE';

const DailyAttendanceBoardMockUI: React.FC = () => {
    const navigate = useNavigate();
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedDept, setSelectedDept] = useState('All');
    const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
    const [isSaving, setIsSaving] = useState(false);
    
    // Attendance state
    const [attendanceMap, setAttendanceMap] = useState<Record<string, { status: AttendanceStatus, overtime: number, isDirty: boolean }>>(() => {
        const initial: any = {};
        employees.forEach(emp => {
            initial[emp.id] = { status: emp.status === 'Present' ? 'PRESENT' : 'ABSENT', overtime: 0, isDirty: false };
        });
        return initial;
    });

    const departments = useMemo(() => {
        const depts = employees.map(item => item.dept);
        return ['All', ...Array.from(new Set(depts))];
    }, []);

    const filteredEmployees = useMemo(() => {
        return employees.filter(emp => {
            const matchesSearch = 
                emp.full_name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                emp.id.toLowerCase().includes(searchQuery.toLowerCase());
            const matchesDept = selectedDept === 'All' || emp.dept === selectedDept;
            return matchesSearch && matchesDept;
        });
    }, [searchQuery, selectedDept]);

    const changeDate = (days: number) => {
        const d = new Date(selectedDate);
        d.setDate(d.getDate() + days);
        setSelectedDate(d.toISOString().split('T')[0]);
    };

    const handleStatusChange = (empId: string, status: AttendanceStatus) => {
        setAttendanceMap(prev => ({
            ...prev,
            [empId]: { ...prev[empId], status, isDirty: true }
        }));
    };

    const handleSave = () => {
        setIsSaving(true);
        setTimeout(() => {
            setAttendanceMap(prev => {
                const next = { ...prev };
                Object.keys(next).forEach(key => {
                    next[key].isDirty = false;
                });
                return next;
            });
            setIsSaving(false);
        }, 800);
    };

    const hasDirtyRecords = Object.values(attendanceMap).some(r => r.isDirty);

    // KPI Calc
    const presentToday = Object.values(attendanceMap).filter(r => r.status === 'PRESENT').length;
    const absentToday = Object.values(attendanceMap).filter(r => r.status === 'ABSENT').length;
    const halfToday = Object.values(attendanceMap).filter(r => r.status === 'HALF').length;

    return (
        <Layout>
            <div className="p-8 space-y-8 h-full flex flex-col text-main animate-fade-in relative z-10">
                {/* Header */}
                <div className="flex justify-between items-end">
                    <div>
                        <h1 className="text-3xl font-display font-black tracking-tighter text-neutral-900 dark:text-white">
                            Attendance <span className="text-primary">Registry</span>
                        </h1>
                        <p className="text-[10px] uppercase tracking-[0.2em] font-black text-neutral-500 dark:text-neutral-400 mt-1">
                            Real-time Biometric Fallback // Daily Audit Ledger
                        </p>
                    </div>
                    <div className="flex gap-4">
                        <button
                            onClick={handleSave}
                            disabled={!hasDirtyRecords || isSaving}
                            className="h-12 px-8 bg-primary disabled:bg-neutral-200 dark:disabled:bg-neutral-800 text-white font-black uppercase tracking-widest text-xs rounded-sm transition-all shadow-lg shadow-primary/20 flex items-center gap-3 hover:opacity-90"
                        >
                            {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                            Commit Changes
                        </button>
                    </div>
                </div>

                {/* Date Controls & KPIs */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                    <div className="bg-white dark:bg-neutral-900 p-6 rounded-sm border border-neutral-200 dark:border-neutral-800 flex flex-col justify-center items-center gap-4 shadow-sm">
                        <p className="text-[9px] text-neutral-400 uppercase tracking-[0.2em] font-black">Calendar Sync</p>
                        <div className="flex items-center gap-4 bg-neutral-50 dark:bg-neutral-950 p-2 rounded-sm border border-neutral-200 dark:border-neutral-800">
                            <button onClick={() => changeDate(-1)} className="p-2 hover:bg-neutral-200 dark:hover:bg-neutral-800 rounded-sm transition-colors text-neutral-500">
                                <ChevronLeft className="w-5 h-5" />
                            </button>
                            <div className="flex items-center gap-2">
                                <Calendar className="w-4 h-4 text-primary" />
                                <input 
                                    type="date" 
                                    value={selectedDate}
                                    onChange={(e) => setSelectedDate(e.target.value)}
                                    className="bg-transparent border-none outline-none text-xs font-black text-neutral-900 dark:text-white cursor-pointer uppercase"
                                />
                            </div>
                            <button onClick={() => changeDate(1)} className="p-2 hover:bg-neutral-200 dark:hover:bg-neutral-800 rounded-sm transition-colors text-neutral-500">
                                <ChevronRight className="w-5 h-5" />
                            </button>
                        </div>
                    </div>

                    {[
                        { title: "Status: Present", value: presentToday, icon: CheckCircle2, color: "text-emerald-500", bg: "bg-emerald-500/10" },
                        { title: "Status: Half Day", value: halfToday, icon: Clock, color: "text-warning", bg: "bg-warning/10" },
                        { title: "Status: Absent", value: absentToday, icon: UserMinus, color: "text-rose-500", bg: "bg-rose-500/10" },
                    ].map((kpi, idx) => (
                        <div key={idx} className="bg-white dark:bg-neutral-900 p-6 rounded-sm border border-neutral-200 dark:border-neutral-800 flex items-center gap-6 shadow-sm relative overflow-hidden group">
                            <div className={`p-4 rounded-sm ${kpi.bg} ${kpi.color} border border-current/20`}>
                                <kpi.icon className="w-6 h-6" />
                            </div>
                            <div>
                                <p className="text-[9px] text-neutral-400 uppercase tracking-[0.2em] font-black">{kpi.title}</p>
                                <p className="text-3xl font-display font-black mt-1 text-neutral-900 dark:text-white tabular-nums">{kpi.value}</p>
                            </div>
                            <div className="absolute top-0 right-0 w-24 h-24 bg-primary/5 rounded-full -mr-12 -mt-12 group-hover:scale-125 transition-transform duration-500"></div>
                        </div>
                    ))}
                </div>

                {/* Filters */}
                <div className="bg-white dark:bg-neutral-900 p-4 rounded-sm flex flex-col md:flex-row gap-6 items-center border border-neutral-200 dark:border-neutral-800 shadow-sm">
                    <div className="relative flex-1 w-full">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-primary" />
                        <input 
                            type="text" 
                            placeholder="SEARCH BY STAFF IDENTITY OR NAME..." 
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full bg-neutral-50 dark:bg-neutral-950 border border-neutral-200 dark:border-neutral-800 rounded-sm pl-12 pr-6 py-3.5 text-xs font-bold tracking-widest focus:border-primary outline-none transition-all shadow-inner"
                        />
                    </div>
                    <div className="relative w-full md:w-64">
                        <Filter className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-primary" />
                        <select 
                            value={selectedDept}
                            onChange={(e) => setSelectedDept(e.target.value)}
                            className="w-full bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-sm pl-12 pr-8 py-3.5 text-xs font-black uppercase tracking-widest outline-none appearance-none cursor-pointer focus:border-primary shadow-sm"
                        >
                            {departments.map(dept => (
                                <option key={dept} value={dept}>{dept === 'All' ? 'Every Department' : dept}</option>
                            ))}
                        </select>
                    </div>
                </div>

                {/* Data Grid */}
                <div className="flex-1 bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-sm overflow-hidden flex flex-col shadow-sm">
                    <div className="overflow-x-auto custom-scrollbar">
                        <table className="w-full text-left">
                            <thead className="bg-neutral-50 dark:bg-neutral-950/80 sticky top-0 z-20 backdrop-blur-md border-b border-neutral-200 dark:border-neutral-800">
                                <tr className="text-neutral-500 dark:text-neutral-400 text-[10px] font-black uppercase tracking-[0.2em]">
                                    <th className="px-8 py-5">Personnel Entity</th>
                                    <th className="px-8 py-5 text-center">Status Assignment</th>
                                    <th className="px-8 py-5 text-center">OT Buffer (Hrs)</th>
                                    <th className="px-8 py-5 text-right">Registry Summary</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-neutral-100 dark:divide-neutral-800">
                                {filteredEmployees.length > 0 ? (
                                    filteredEmployees.map((emp) => {
                                        const att = attendanceMap[emp.id] || { status: 'ABSENT', overtime: 0, isDirty: false };
                                        return (
                                            <tr 
                                                key={emp.id} 
                                                className="hover:bg-primary/[0.02] transition-colors group"
                                            >
                                                <td className="px-8 py-6">
                                                    <div className="flex items-center gap-4">
                                                        <div className="w-10 h-10 rounded-sm bg-primary/10 border border-primary/20 flex items-center justify-center text-primary font-black text-sm">
                                                            {emp.full_name[0]}
                                                        </div>
                                                        <div>
                                                            <div className="text-sm font-black text-neutral-900 dark:text-white">{emp.full_name}</div>
                                                            <div className="text-[9px] text-neutral-400 font-black uppercase tracking-widest mt-0.5">{emp.role} // {emp.dept}</div>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="px-8 py-6">
                                                    <div className="flex items-center justify-center gap-3">
                                                        {[
                                                            { id: 'PRESENT', label: 'Present', icon: CheckCircle2, color: 'emerald' },
                                                            { id: 'HALF', label: 'Half Day', icon: Clock, color: 'warning' },
                                                            { id: 'ABSENT', label: 'Absent', icon: XCircle, color: 'rose' }
                                                        ].map(s => (
                                                            <button
                                                                key={s.id}
                                                                onClick={() => handleStatusChange(emp.id, s.id as AttendanceStatus)}
                                                                className={`flex flex-col items-center gap-1.5 p-3 w-20 rounded-sm border transition-all ${
                                                                    att.status === s.id
                                                                        ? s.color === 'emerald' ? 'bg-emerald-500/10 border-emerald-500/50 text-emerald-500' :
                                                                          s.color === 'warning' ? 'bg-warning-500/10 border-warning-500/50 text-warning-500' :
                                                                          'bg-rose-500/10 border-rose-500/50 text-rose-500'
                                                                        : 'bg-neutral-50 dark:bg-neutral-950 border-neutral-200 dark:border-neutral-800 text-neutral-400 hover:border-primary/30'
                                                                }`}
                                                            >
                                                                <s.icon className="w-4 h-4" />
                                                                <span className="text-[8px] font-black uppercase tracking-widest">{s.label}</span>
                                                            </button>
                                                        ))}
                                                    </div>
                                                </td>
                                                <td className="px-8 py-6">
                                                    <div className="flex justify-center">
                                                        <div className="relative group/input">
                                                            <input
                                                                type="number"
                                                                step="0.5"
                                                                min="0"
                                                                max="12"
                                                                value={att.overtime}
                                                                onChange={(e) => {
                                                                    const val = parseFloat(e.target.value) || 0;
                                                                    setAttendanceMap(prev => ({
                                                                        ...prev,
                                                                        [emp.id]: { ...prev[emp.id], overtime: val, isDirty: true }
                                                                    }));
                                                                }}
                                                                className="w-20 text-center py-2.5 bg-neutral-50 dark:bg-neutral-950 border border-neutral-200 dark:border-neutral-800 rounded-sm text-xs font-black focus:border-primary outline-none transition-all"
                                                            />
                                                            <div className="absolute right-2 top-1/2 -translate-y-1/2 text-[8px] font-black text-neutral-400 uppercase pointer-events-none">HRS</div>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="px-8 py-6 text-right">
                                                    <div className="flex items-center justify-end gap-6">
                                                        <div className={`px-4 py-1.5 rounded-sm border text-[9px] font-black uppercase tracking-[0.2em] flex items-center gap-2 ${
                                                            att.status === 'PRESENT' ? 'bg-emerald-500/5 border-emerald-500/10 text-emerald-500' :
                                                            att.status === 'HALF' ? 'bg-warning-500/5 border-warning-500/10 text-warning-500' : 'bg-rose-500/5 border-rose-500/10 text-rose-500'
                                                        }`}>
                                                            <span className="w-1.5 h-1.5 rounded-full bg-current shadow-[0_0_8px_rgba(var(--color),0.5)]" />
                                                            {att.status} {att.overtime > 0 ? `• OT ${att.overtime}H` : ''}
                                                        </div>
                                                        {att.isDirty && <Zap className="w-4 h-4 text-primary animate-pulse" />}
                                                    </div>
                                                </td>
                                            </tr>
                                        );
                                    })
                                ) : (
                                    <tr>
                                        <td colSpan={4} className="p-20 text-center text-neutral-400 italic font-black uppercase tracking-widest text-xs">
                                            No personnel matching current filters.
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
                
                {/* Legend */}
                <div className="flex flex-wrap gap-8 justify-center text-[9px] font-black text-neutral-400 uppercase tracking-[0.3em] pb-4">
                    <div className="flex items-center gap-2.5">
                        <div className="w-2 h-2 bg-emerald-500 rounded-full" /> Full Shift Capacity
                    </div>
                    <div className="flex items-center gap-2.5">
                        <div className="w-2 h-2 bg-warning rounded-full" /> Partial Assignment
                    </div>
                    <div className="flex items-center gap-2.5">
                        <div className="w-2 h-2 bg-rose-500 rounded-full" /> Non-attendance Recorded
                    </div>
                </div>
            </div>
        </Layout>
    );
};

export default DailyAttendanceBoardMockUI;

