import React from 'react';
import { Calendar as CalendarIcon, CheckSquare, ListChecks, X, CheckCircle2, Clock, PieChart, XCircle } from 'lucide-react';
import { Card } from "../../components/core/Display/Card";
import { Attendance } from "../../types/hr";
import { AttendanceStatus } from "../../types/common";
import { getDaysInMonth, getFirstDayOfMonth, formatDateISO } from "../../utils/helpers";

import { Loader2, AlertTriangle, RefreshCw } from 'lucide-react';

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
    isLoading?: boolean;
    loadError?: string | null;
    onRetry?: () => void;
}

const AttendanceCalendar: React.FC<AttendanceCalendarProps> = ({
    currentYear, currentMonth, attendance, selectedLaborerId, isSelectionMode, onToggleSelectionMode, selectedDates, onDateClick, onBulkAction, isLoading, loadError, onRetry
}) => {
    const renderCalendar = () => {
        const daysInMonth = getDaysInMonth(currentYear, currentMonth);
        const firstDay = getFirstDayOfMonth(currentYear, currentMonth);
        const blanks = Array(firstDay).fill(null);
        const days = Array.from({ length: daysInMonth }, (_, i) => i + 1);

        return (
            <div className="grid grid-cols-7 gap-1 mb-2 select-none">
                {['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'].map(d => (
                    <div key={d} className="text-center text-[10px] font-bold text-slate-400 dark:text-slate-500 py-1 uppercase">{d}</div>
                ))}

                {blanks.map((_, i) => <div key={`blank-${i}`} className="h-9" />)}

                {days.map(day => {
                    const dateKey = formatDateISO(currentYear, currentMonth, day);
                    const log = attendance.find(a => (a.employeeId === selectedLaborerId || (a as any).employeeId?._id === selectedLaborerId) && a.date === dateKey);
                    const status = log?.status;
                    const isSelected = selectedDates.has(dateKey);

                    let bgClass = 'bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 hover:border-primary dark:hover:border-primary';
                    let textClass = 'text-slate-700 dark:text-slate-200';
                    let icon = null;

                    if (status === 'PRESENT') {
                        bgClass = 'bg-success-soft border-success-line';
                        textClass = 'text-success font-bold';
                        icon = <CheckCircle2 className="w-3 h-3" />;
                    } else if (status === 'HALF') {
                        bgClass = 'bg-warning-soft border-warning-line';
                        textClass = 'text-warning font-bold';
                        icon = <Clock className="w-3 h-3" />;
                    } else if (status === 'QUARTER') {
                        bgClass = 'bg-warning-soft border-warning-line';
                        textClass = 'text-warning font-bold';
                        icon = <PieChart className="w-3 h-3" />;
                    } else if (status === 'ABSENT') {
                        bgClass = 'bg-danger-soft border-danger-line';
                        textClass = 'text-danger font-bold';
                        icon = <XCircle className="w-3 h-3" />;
                    }

                    if (isSelected) {
                        bgClass = 'bg-primary border-primary shadow-md ring-2 ring-blue-200 dark:ring-blue-900';
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
                            {log?.advanceTaken ? <div className="absolute bottom-0.5 right-0.5 w-1.5 h-1.5 bg-warning rounded-full" title="Advance Taken"></div> : null}
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
                    <h3 className="font-bold text-slate-700 dark:text-slate-300 flex items-center gap-2 text-sm">
                        <CalendarIcon size={16} /> Attendance Log
                    </h3>
                    <button
                        onClick={onToggleSelectionMode}
                        className={`flex items-center gap-1.5 px-2 py-1 rounded text-xs font-bold transition ${isSelectionMode ? 'bg-primary text-white' : 'bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-600'}`}
                    >
                        {isSelectionMode ? <CheckSquare size={14} /> : <ListChecks size={14} />}
                        {isSelectionMode ? 'Done' : 'Select'}
                    </button>
                </div>
                <div className="flex-1 overflow-auto">
                    {loadError ? (
                        <div className="h-full flex flex-col items-center justify-center p-6 text-center text-slate-500">
                            <AlertTriangle className="w-8 h-8 text-danger mb-2" />
                            <p className="text-sm font-semibold text-slate-800 dark:text-slate-200 mb-1">Unable to load attendance</p>
                            <p className="text-xs text-slate-500 dark:text-slate-400 mb-4">{loadError}</p>
                            {onRetry && (
                                <button
                                    onClick={onRetry}
                                    className="flex items-center gap-1.5 px-3 py-1.5 bg-primary hover:bg-primary-hover text-white rounded-md text-xs font-bold transition"
                                >
                                    <RefreshCw className="w-3.5 h-3.5" /> Retry
                                </button>
                            )}
                        </div>
                    ) : isLoading ? (
                        <div className="h-full flex flex-col items-center justify-center p-6 text-slate-400">
                            <Loader2 className="w-8 h-8 animate-spin mb-2 text-primary" />
                            <p className="text-xs font-medium">Loading attendance records...</p>
                        </div>
                    ) : (
                        renderCalendar()
                    )}
                </div>
                <div className="mt-2 pt-2 border-t border-slate-100 dark:border-slate-700">
                    {isSelectionMode ? (
                        <div className="flex gap-1 animate-in slide-in-from-bottom-2">
                            <button onClick={() => onBulkAction('PRESENT')} disabled={selectedDates.size === 0} className="flex-1 py-1.5 bg-success-soft text-success border border-success-line hover:border-success rounded text-[10px] font-bold disabled:opacity-50 transition">Full</button>
                            <button onClick={() => onBulkAction('HALF')} disabled={selectedDates.size === 0} className="flex-1 py-1.5 bg-warning-soft text-warning border border-warning-line hover:border-warning rounded text-[10px] font-bold disabled:opacity-50 transition">Half</button>
                            <button onClick={() => onBulkAction('QUARTER')} disabled={selectedDates.size === 0} className="flex-1 py-1.5 bg-warning-soft text-warning border border-warning-line hover:border-warning rounded text-[10px] font-bold disabled:opacity-50 transition">Qtr</button>
                            <button onClick={() => onBulkAction('ABSENT')} disabled={selectedDates.size === 0} className="flex-1 py-1.5 bg-danger-soft text-danger border border-danger-line hover:border-danger rounded text-[10px] font-bold disabled:opacity-50 transition">Abs</button>
                            <button onClick={() => onBulkAction('CLEAR')} disabled={selectedDates.size === 0} className="px-2 py-1.5 bg-input text-secondary border border-default hover:text-main rounded text-[10px] font-bold disabled:opacity-50 transition"><X size={12} /></button>
                        </div>
                    ) : (
                        <div className="flex justify-center gap-3 text-[10px] text-slate-500 dark:text-slate-400">
                            <div className="flex items-center gap-1"><div className="w-2.5 h-2.5 bg-success-soft border border-success-line rounded" /> Present</div>
                            <div className="flex items-center gap-1"><div className="w-2.5 h-2.5 bg-warning-soft border border-warning-line rounded" /> Half</div>
                            <div className="flex items-center gap-1"><div className="w-2.5 h-2.5 bg-danger-soft border border-danger-line rounded" /> Absent</div>
                            <div className="flex items-center gap-1"><div className="w-1.5 h-1.5 bg-warning rounded-full" /> Adv Taken</div>
                        </div>
                    )}
                </div>
            </Card>
        </div>
    );
};

export default AttendanceCalendar;
