import React, { useState } from 'react';
import { X, Clock, CheckCircle2, XCircle, PieChart, AlertCircle, Trash2, LucideIcon } from 'lucide-react';
import { DailyLog } from "../../../../types/hr";
import { AttendanceStatus } from "../../../../types/common";

interface TimeEntryModalProps {
    isOpen: boolean;
    date: string;
    onClose: () => void;
    onSave: (log: DailyLog | null) => void;
    initialData?: DailyLog | null | undefined;
}

const StatusButton = ({ currentStatus, targetStatus, label, icon: Icon, colorClass, onClick }: { currentStatus: AttendanceStatus, targetStatus: AttendanceStatus, label: string, icon: LucideIcon, colorClass: string, onClick: (s: AttendanceStatus) => void }) => (
    <button
        type="button"
        onClick={() => onClick(targetStatus)}
        className={`flex-1 flex flex-col items-center justify-center p-3 rounded-lg border-2 transition-all ${currentStatus === targetStatus
            ? `${colorClass} border-current`
            : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-500 hover:bg-slate-50 dark:hover:bg-slate-700'
            }`}
    >
        <Icon className={`w-6 h-6 mb-1 ${currentStatus === targetStatus ? '' : 'text-slate-400'}`} />
        <span className="text-xs font-bold">{label}</span>
    </button>
);

export const TimeEntryModal: React.FC<TimeEntryModalProps> = ({ isOpen, date, onClose, onSave, initialData }) => {
    // @ts-ignore
    const [status, setStatus] = useState<AttendanceStatus>(initialData?.status || 'PRESENT');
    const [inTime, setInTime] = useState(initialData?.inTime || '09:00');
    const [outTime, setOutTime] = useState(initialData?.outTime || '18:00');

    if (!isOpen) return null;

    const calculateDuration = () => {
        const start = parseInt(inTime.split(':')[0]) + parseInt(inTime.split(':')[1]) / 60;
        const end = parseInt(outTime.split(':')[0]) + parseInt(outTime.split(':')[1]) / 60;
        return Math.max(0, end - start);
    };

    const handleSave = () => {
        if (status === 'ABSENT') {
            onSave({ status: 'ABSENT', inTime: '', outTime: '', duration: 0 });
        } else {
            onSave({
                status,
                inTime,
                outTime,
                duration: calculateDuration()
            });
        }
        onClose();
    };

    const handleClear = () => {
        onSave(null);
        onClose();
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-in fade-in">
            <div className="bg-white dark:bg-slate-800 w-full max-w-md rounded-2xl shadow-2xl overflow-hidden animate-in zoom-in-95 border border-slate-200 dark:border-slate-700">
                <div className="flex justify-between items-center p-4 border-b border-slate-100 dark:border-slate-700">
                    <h3 className="text-lg font-bold text-slate-800 dark:text-white flex items-center gap-2">
                        <Clock size={18} className="text-indigo-600 dark:text-indigo-400" />
                        Attendance Log
                    </h3>
                    <button onClick={onClose} className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-full hover:bg-slate-100 dark:hover:bg-slate-700">
                        <X size={20} />
                    </button>
                </div>

                <div className="p-6 space-y-6">
                    <div className="text-center">
                        <span className="bg-slate-100 dark:bg-slate-900 text-slate-600 dark:text-slate-300 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider">
                            {new Date(date).toDateString()}
                        </span>
                    </div>

                    <div className="flex gap-2">
                        <StatusButton currentStatus={status} onClick={setStatus} targetStatus="PRESENT" label="Full Day" icon={CheckCircle2} colorClass="bg-emerald-50 border-emerald-500 text-emerald-600" />
                        <StatusButton currentStatus={status} onClick={setStatus} targetStatus="HALF" label="Half Day" icon={AlertCircle} colorClass="bg-amber-50 border-amber-500 text-amber-600" />
                        <StatusButton currentStatus={status} onClick={setStatus} targetStatus="QUARTER" label="Quarter" icon={PieChart} colorClass="bg-purple-50 border-purple-500 text-purple-600" />
                        <StatusButton currentStatus={status} onClick={setStatus} targetStatus="ABSENT" label="Absent" icon={XCircle} colorClass="bg-rose-50 border-rose-500 text-rose-600" />
                    </div>

                    {status !== 'ABSENT' && (
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase mb-1">In Time</label>
                                <input
                                    type="time"
                                    value={inTime}
                                    onChange={(e) => setInTime(e.target.value)}
                                    className="w-full p-2 border border-slate-200 dark:border-slate-700 rounded-lg text-lg font-bold text-slate-700 dark:text-white bg-slate-50 dark:bg-slate-900 outline-none focus:ring-2 focus:ring-indigo-500"
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase mb-1">Out Time</label>
                                <input
                                    type="time"
                                    value={outTime}
                                    onChange={(e) => setOutTime(e.target.value)}
                                    className="w-full p-2 border border-slate-200 dark:border-slate-700 rounded-lg text-lg font-bold text-slate-700 dark:text-white bg-slate-50 dark:bg-slate-900 outline-none focus:ring-2 focus:ring-indigo-500"
                                />
                            </div>
                        </div>
                    )}
                </div>

                <div className="p-4 bg-slate-50 dark:bg-slate-900 border-t border-slate-100 dark:border-slate-700 flex justify-between gap-3">
                    {initialData ? (
                        <button
                            onClick={handleClear}
                            className="px-4 py-2 flex items-center gap-2 text-rose-600 dark:text-rose-400 hover:bg-rose-100 dark:hover:bg-rose-900/30 rounded-lg font-bold transition-colors"
                        >
                            <Trash2 size={16} /> Clear
                        </button>
                    ) : (
                        <div></div>
                    )}
                    <div className="flex gap-2">
                        <button
                            onClick={onClose}
                            className="px-4 py-2 text-slate-600 dark:text-slate-400 hover:bg-white dark:hover:bg-slate-800 rounded-lg font-bold transition-colors"
                        >
                            Cancel
                        </button>
                        <button
                            onClick={handleSave}
                            className="px-6 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-bold shadow-lg shadow-indigo-500/30 transition-all"
                        >
                            Save Entry
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};
