import React, { useState, useMemo } from 'react';
import { 
    Users, Clock, Calendar, Search, Filter, 
    CheckCircle2, AlertCircle, UserMinus, ChevronLeft, ChevronRight, Save, XCircle, Loader2
} from 'lucide-react';
import attendanceBoardData from '../../../mockData/attendanceBoardData.json';

const MOCK_EMPLOYEES = attendanceBoardData.employees;



type AttendanceStatus = 'PRESENT' | 'HALF' | 'ABSENT' | 'LATE' | 'ON_LEAVE';

const DailyAttendanceBoardMockUI: React.FC = () => {
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedDept, setSelectedDept] = useState('All');
    const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
    const [isSaving, setIsSaving] = useState(false);
    
    // Attendance state
    const [attendanceMap, setAttendanceMap] = useState<Record<string, { status: AttendanceStatus, overtime: number, isDirty: boolean }>>(() => {
        const initial: any = {};
        MOCK_EMPLOYEES.forEach(emp => {
            initial[emp.id] = { status: 'PRESENT', overtime: 0, isDirty: false };
        });
        return initial;
    });

    const departments = useMemo(() => {
        const depts = MOCK_EMPLOYEES.map(item => item.dept);
        return ['All', ...Array.from(new Set(depts))];
    }, []);

    const filteredEmployees = useMemo(() => {
        return MOCK_EMPLOYEES.filter(emp => {
            const matchesSearch = emp.name.toLowerCase().includes(searchQuery.toLowerCase()) || emp.id.toLowerCase().includes(searchQuery.toLowerCase());
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

    const handleOvertimeChange = (empId: string, hours: string) => {
        setAttendanceMap(prev => ({
            ...prev,
            [empId]: { ...prev[empId], overtime: parseFloat(hours) || 0, isDirty: true }
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
    const presentCount = Object.values(attendanceMap).filter(r => r.status === 'PRESENT').length;
    const absentCount = Object.values(attendanceMap).filter(r => r.status === 'ABSENT').length;
    const halfCount = Object.values(attendanceMap).filter(r => r.status === 'HALF').length;
    const totalCount = MOCK_EMPLOYEES.length;

    return (
        <div className="p-6 space-y-6 h-full flex flex-col text-main animate-fade-in">
            {/* Header */}
            <div className="flex justify-between items-end">
                <div>
                    <h1 className="text-2xl font-bold bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
                        Daily Attendance Board
                    </h1>
                    <p className="text-sm text-main/60 mt-1">Real-time Employee Status Registry</p>
                </div>
                <div className="flex gap-3">
                    <button
                        onClick={handleSave}
                        disabled={!hasDirtyRecords || isSaving}
                        className="flex items-center gap-2 px-6 py-2.5 bg-blue-500 hover:bg-blue-600 disabled:bg-white/5 disabled:text-main/30 text-white rounded-lg shadow-[0_0_15px_rgba(59,130,246,0.2)] disabled:shadow-none transition-all text-sm font-bold uppercase tracking-wider"
                    >
                        {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                        Save Attendance
                    </button>
                </div>
            </div>

            {/* Date Controls & KPIs */}
            <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
                <div className="glass-panel p-5 rounded-xl border border-white/5 flex flex-col justify-center items-center gap-3">
                    <p className="text-[10px] text-main/40 uppercase tracking-widest font-bold">Select Date</p>
                    <div className="flex items-center gap-2 bg-black/20 p-1.5 rounded-lg border border-white/5">
                        <button onClick={() => changeDate(-1)} className="p-1.5 hover:bg-white/10 rounded-md transition-colors text-main/60 hover:text-main">
                            <ChevronLeft className="w-4 h-4" />
                        </button>
                        <div className="flex items-center gap-2 px-2">
                            <Calendar className="w-4 h-4 text-purple-400" />
                            <input 
                                type="date" 
                                value={selectedDate}
                                onChange={(e) => setSelectedDate(e.target.value)}
                                className="bg-transparent border-none outline-none text-sm font-bold text-main cursor-pointer dark:[&::-webkit-calendar-picker-indicator]:invert"
                            />
                        </div>
                        <button onClick={() => changeDate(1)} className="p-1.5 hover:bg-white/10 rounded-md transition-colors text-main/60 hover:text-main">
                            <ChevronRight className="w-4 h-4" />
                        </button>
                    </div>
                </div>

                {[
                    { title: "Present Today / Total", value: `${presentCount} / ${totalCount}`, icon: CheckCircle2, color: "text-emerald-400", bg: "bg-emerald-400/10" },
                    { title: "Half Day", value: halfCount, icon: Clock, color: "text-amber-400", bg: "bg-amber-400/10" },
                    { title: "Absent", value: absentCount, icon: UserMinus, color: "text-red-400", bg: "bg-red-400/10" },
                ].map((kpi, idx) => (
                    <div key={idx} className="glass-panel p-5 rounded-xl border border-white/5 flex items-center gap-4">
                        <div className={`p-3 rounded-xl ${kpi.bg} ${kpi.color}`}>
                            <kpi.icon className="w-6 h-6" />
                        </div>
                        <div>
                            <p className="text-[10px] text-main/40 uppercase tracking-widest font-bold">{kpi.title}</p>
                            <p className="text-2xl font-bold mt-1 text-main">{kpi.value}</p>
                        </div>
                    </div>
                ))}
            </div>

            {/* Filters */}
            <div className="glass-panel p-4 rounded-xl flex gap-4 items-center border border-white/5">
                <div className="relative flex-1 max-w-md">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-main/40" />
                    <input 
                        type="text" 
                        placeholder="Search by name or ID..." 
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full bg-black/20 border border-white/10 rounded-lg pl-10 pr-4 py-2 text-sm focus:border-purple-500/50 outline-none transition-all"
                    />
                </div>
                <div className="flex items-center gap-3 ml-auto">
                    <div className="relative">
                        <Filter className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-purple-400" />
                        <select 
                            value={selectedDept}
                            onChange={(e) => setSelectedDept(e.target.value)}
                            className="bg-white/5 border border-white/10 rounded-lg pl-10 pr-8 py-2 text-sm hover:bg-white/10 transition-all outline-none appearance-none cursor-pointer focus:border-purple-500/50"
                        >
                            {departments.map(dept => (
                                <option key={dept} value={dept} className="bg-[#0a0a0a]">{dept === 'All' ? 'All Departments' : dept}</option>
                            ))}
                        </select>
                    </div>
                </div>
            </div>

            {/* Data Grid */}
            <div className="flex-1 glass-panel rounded-xl overflow-hidden flex flex-col border border-white/5">
                <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                        <thead className="bg-black/5 dark:bg-black/40 border-b border-black/5 dark:border-white/10 text-main/60">
                            <tr>
                                <th className="p-4 text-left font-medium">Employee</th>
                                <th className="p-4 text-center font-medium">Status</th>
                                <th className="p-4 text-center font-medium">Overtime (Hrs)</th>
                                <th className="p-4 text-right font-medium">Summary</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-black/5 dark:divide-white/5 bg-black/[0.01] dark:bg-white/[0.01]">
                            {filteredEmployees.length > 0 ? (
                                filteredEmployees.map((emp) => {
                                    const att = attendanceMap[emp.id];
                                    return (
                                        <tr 
                                            key={emp.id} 
                                            onClick={() => { window.location.href = `/people/employees/labor/view/${emp.id}?tab=Attendance%20Log` }}
                                            className="hover:bg-black/[0.04] dark:hover:bg-white/[0.04] transition-colors group cursor-pointer"
                                        >
                                            <td className="p-4">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-8 h-8 rounded-full bg-blue-500/10 flex items-center justify-center text-blue-400 border border-blue-500/20 font-bold text-xs">
                                                        {emp.name.charAt(0)}
                                                    </div>
                                                    <div>
                                                        <div className="font-medium text-main/90 group-hover:text-purple-400 transition-colors">{emp.name}</div>
                                                        <div className="text-[10px] text-main/30 font-mono tracking-tighter">{emp.role} • {emp.dept}</div>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="p-4" onClick={(e) => e.stopPropagation()}>
                                                <div className="flex items-center justify-center gap-2">
                                                    {[
                                                        { id: 'PRESENT', label: 'Full', icon: CheckCircle2, color: 'emerald' },
                                                        { id: 'HALF', label: 'Half', icon: Clock, color: 'amber' },
                                                        { id: 'ABSENT', label: 'Absnt', icon: XCircle, color: 'rose' }
                                                    ].map(s => (
                                                        <button
                                                            key={s.id}
                                                            onClick={() => handleStatusChange(emp.id, s.id as AttendanceStatus)}
                                                            className={`flex flex-col items-center gap-1 p-2 w-14 rounded-lg border transition-all ${
                                                                att.status === s.id
                                                                    ? `bg-${s.color}-500/10 border-${s.color}-500/30 text-${s.color}-400`
                                                                    : 'bg-white/5 border-white/5 text-main/30 hover:bg-white/10'
                                                            }`}
                                                        >
                                                            <s.icon className="w-4 h-4" />
                                                            <span className="text-[9px] font-bold uppercase tracking-tighter">{s.label}</span>
                                                        </button>
                                                    ))}
                                                </div>
                                            </td>
                                            <td className="p-4" onClick={(e) => e.stopPropagation()}>
                                                <div className="flex justify-center">
                                                    <input
                                                        type="number"
                                                        step="0.5"
                                                        min="0"
                                                        max="12"
                                                        value={att.overtime}
                                                        onChange={(e) => handleOvertimeChange(emp.id, e.target.value)}
                                                        className="w-16 text-center py-1.5 bg-black/20 border border-white/10 rounded-lg text-sm text-main focus:border-purple-500/50 outline-none transition-all"
                                                    />
                                                </div>
                                            </td>
                                            <td className="p-4 text-right">
                                                <div className="flex items-center justify-end gap-4">
                                                    <div className="inline-flex items-center gap-2 px-2.5 py-1 bg-black/20 rounded-full border border-white/5">
                                                        <span className={`w-1.5 h-1.5 rounded-full ${
                                                            att.status === 'PRESENT' ? 'bg-emerald-500' :
                                                            att.status === 'HALF' ? 'bg-amber-500' : 'bg-rose-500'
                                                        }`} />
                                                        <span className="text-[10px] font-bold text-main/60 uppercase tracking-widest">
                                                            {att.status} {att.overtime > 0 ? `+ ${att.overtime}H OT` : ''}
                                                        </span>
                                                    </div>
                                                    <ChevronRight className="w-4 h-4 text-main/20 group-hover:text-purple-400 transition-colors" />
                                                </div>
                                            </td>
                                        </tr>
                                    );
                                })
                            ) : (
                                <tr>
                                    <td colSpan={4} className="p-8 text-center text-main/30 italic font-medium">
                                        No personnel found matching your search.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
            
            {/* Legend */}
            <div className="flex flex-wrap gap-6 justify-center text-[10px] font-bold text-main/40 uppercase tracking-widest">
                <div className="flex items-center gap-2">
                    <div className="w-2.5 h-2.5 bg-emerald-500 rounded-full" /> Full Day 100%
                </div>
                <div className="flex items-center gap-2">
                    <div className="w-2.5 h-2.5 bg-amber-500 rounded-full" /> Half Day 50%
                </div>
                <div className="flex items-center gap-2">
                    <div className="w-2.5 h-2.5 bg-rose-500 rounded-full" /> Absent 0%
                </div>
            </div>
        </div>
    );
};

export default DailyAttendanceBoardMockUI;
