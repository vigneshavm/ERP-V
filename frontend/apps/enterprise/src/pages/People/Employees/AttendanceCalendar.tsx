import React from 'react';
import { Calendar as CalendarIcon, CheckSquare, ListChecks, X, CheckCircle2, Clock, PieChart, XCircle } from 'lucide-react';
import { Card } from "@/shared/ui";
import { Attendance } from "@/entities/people/model/hr";
import { AttendanceStatus } from "@repo/shared";
import { getDaysInMonth, getFirstDayOfMonth, formatDateISO } from "@/shared/lib/utils/helpers";

interface AttendanceCalendarProps {
    currentYear: number;
    currentMonth: number;
    attendance: Attendance[];
    selectedLaborerId: string | null;
    isSelectionMode: boolean;
    onToggleSelectionMode: () => void;
    selectedDates: Set<string>;
    onDateClick: (day: number) => void;
    onBulkAction: (status: AttendanceStatus | 'CLEAR') => void;
}

const AttendanceCalendar: React.FC<AttendanceCalendarProps> = ({
    currentYear, currentMonth, attendance, selectedLaborerId, isSelectionMode, onToggleSelectionMode, selectedDates, onDateClick, onBulkAction
}) => {
    const renderCalendar = () => {
        const daysInMonth = getDaysInMonth(currentYear, currentMonth);
        const firstDay = getFirstDayOfMonth(currentYear, currentMonth);
        const blanks = Array(firstDay).fill(null);
        const days = Array.from({ length: daysInMonth }, (_, i) => i + 1);

        return (
            <div className="grid grid-cols-7 gap-1 mb-2 select-none">
                {['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'].map(d => (
                    <div key={d} className="text-center text-[10px] font-bold text-muted dark:text-muted py-1 uppercase">{d}</div>
                ))}

                {blanks.map((_, i) => <div key={`blank-${i}`} className="h-9" />)}

                {days.map(day => {
                    const dateKey = formatDateISO(currentYear, currentMonth, day);
                    const log = attendance.find(a => a.employeeId === selectedLaborerId && a.date === dateKey);
                    const status = log?.status;
                    const isSelected = selectedDates.has(dateKey);

                    let bgClass = 'bg-[var(--erp-bg-sunken)] dark:bg-[var(--erp-card)] border-default dark:border-default hover:border-blue-400 dark:hover:border-blue-500';
                    let textClass = 'text-secondary dark:text-slate-200';
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

                    if (isSelected) {
                        bgClass = 'bg-blue-600 border-blue-600 shadow-md ring-2 ring-blue-200 dark:ring-blue-900';
                        textClass = 'text-white';
                        icon = null;
                    }

                    return (
                        <button
                            key={day}
                            onClick={() => onDateClick(day)}
                            className={`h-9 w-full flex flex-col items-center justify-center rounded-md border transition-all relative ${bgClass}`}
                        >
                            <span className={`text-[10px] ${textClass}`}>{day}</span>
                            {icon && !isSelected && <div className="mt-0.5">{icon}</div>}
                            {isSelected && <div className="absolute top-0.5 right-0.5 w-1.5 h-1.5 bg-white rounded-full"></div>}
                            {log?.advanceTaken ? <div className="absolute bottom-0.5 right-0.5 w-1.5 h-1.5 bg-amber-500 rounded-full" title="Advance Taken"></div> : null}
                        </button>
                    );
                })}
            </div>
        );
    };

    return (
        <div className="flex-1 min-w-0">
            <Card className="p-4 h-full flex flex-col relative overflow-hidden">
                <div className="flex items-center justify-between mb-2">
                    <h3 className="font-bold text-secondary dark:text-muted flex items-center gap-2 text-sm">
                        <CalendarIcon size={16} /> Attendance Log
                    </h3>
                    <button
                        onClick={onToggleSelectionMode}
                        className={`flex items-center gap-1.5 px-2 py-1 rounded text-xs font-bold transition ${isSelectionMode ? 'bg-blue-600 text-white' : 'bg-[var(--erp-bg-sunken)] dark:bg-slate-700 text-secondary dark:text-muted hover:bg-slate-200 dark:hover:bg-slate-600'}`}
                    >
                        {isSelectionMode ? <CheckSquare size={14} /> : <ListChecks size={14} />}
                        {isSelectionMode ? 'Done' : 'Select'}
                    </button>
                </div>
                <div className="flex-1 overflow-auto">
                    {renderCalendar()}
                </div>
                <div className="mt-2 pt-2 border-t border-default dark:border-default">
                    {isSelectionMode ? (
                        <div className="flex gap-1 animate-in slide-in-from-bottom-2">
                            <button onClick={() => onBulkAction('PRESENT')} disabled={selectedDates.size === 0} className="flex-1 py-1.5 bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-300 hover:bg-emerald-200 dark:hover:bg-emerald-800 rounded text-[10px] font-bold disabled:opacity-50 transition">Full</button>
                            <button onClick={() => onBulkAction('HALF')} disabled={selectedDates.size === 0} className="flex-1 py-1.5 bg-amber-100 dark:bg-amber-900/40 text-amber-700 dark:text-amber-300 hover:bg-amber-200 dark:hover:bg-amber-800 rounded text-[10px] font-bold disabled:opacity-50 transition">Half</button>
                            <button onClick={() => onBulkAction('QUARTER')} disabled={selectedDates.size === 0} className="flex-1 py-1.5 bg-purple-100 dark:bg-purple-900/40 text-purple-700 dark:text-purple-300 hover:bg-purple-200 dark:hover:bg-purple-800 rounded text-[10px] font-bold disabled:opacity-50 transition">Qtr</button>
                            <button onClick={() => onBulkAction('ABSENT')} disabled={selectedDates.size === 0} className="flex-1 py-1.5 bg-rose-100 dark:bg-rose-900/40 text-rose-700 dark:text-rose-300 hover:bg-rose-200 dark:hover:bg-rose-800 rounded text-[10px] font-bold disabled:opacity-50 transition">Abs</button>
                            <button onClick={() => onBulkAction('CLEAR')} disabled={selectedDates.size === 0} className="px-2 py-1.5 bg-[var(--erp-bg-sunken)] dark:bg-slate-700 text-muted hover:bg-slate-200 dark:hover:bg-slate-600 rounded text-[10px] font-bold disabled:opacity-50 transition"><X size={12} /></button>
                        </div>
                    ) : (
                        <div className="flex justify-center gap-3 text-[10px] text-muted dark:text-muted">
                            <div className="flex items-center gap-1"><div className="w-2.5 h-2.5 bg-emerald-100 dark:bg-emerald-900/60 border border-emerald-200 dark:border-emerald-700 rounded" /> Present</div>
                            <div className="flex items-center gap-1"><div className="w-2.5 h-2.5 bg-amber-100 dark:bg-amber-900/60 border border-amber-200 dark:border-amber-700 rounded" /> Half</div>
                            <div className="flex items-center gap-1"><div className="w-2.5 h-2.5 bg-rose-50 dark:bg-rose-900/60 border border-rose-200 dark:border-rose-700 rounded" /> Absent</div>
                            <div className="flex items-center gap-1"><div className="w-1.5 h-1.5 bg-amber-500 rounded-full" /> Adv Taken</div>
                        </div>
                    )}
                </div>
            </Card>
        </div>
    );
};

export default AttendanceCalendar;

