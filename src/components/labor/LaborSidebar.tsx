import React from 'react';
import { Users, Plus } from 'lucide-react';
import { Employee } from '../../types/hr';
import { formatCurrency } from '../../utils/helpers';

interface LaborSidebarProps {
    employees: Employee[];
    selectedLaborerId: string | null;
    onSelectLaborer: (id: string) => void;
    onToggleAddForm: () => void;
    isAddingLaborer: boolean;
}

const LaborSidebar: React.FC<LaborSidebarProps> = ({
    employees,
    selectedLaborerId,
    onSelectLaborer,
    onToggleAddForm,
    isAddingLaborer
}) => {
    return (
        <div className="w-full lg:w-72 flex flex-col gap-3 shrink-0">
            <div className="flex items-center justify-between">
                <h2 className="text-lg font-bold text-slate-800 dark:text-white flex items-center gap-2">
                    <Users className="text-blue-600 dark:text-blue-400" size={20} /> Laborers
                </h2>
                <button
                    onClick={onToggleAddForm}
                    className={`p-1.5 rounded-lg transition ${isAddingLaborer ? 'bg-blue-600 text-white' : 'bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 hover:bg-blue-200 dark:hover:bg-blue-900/50'}`}
                >
                    <Plus size={18} />
                </button>
            </div>

            <div className="flex-1 overflow-y-auto space-y-2 custom-scrollbar pr-1">
                {employees.length === 0 && <p className="text-xs text-slate-400 text-center py-4">No employees in this branch.</p>}
                {employees.map(l => (
                    <button
                        key={l.id}
                        onClick={() => onSelectLaborer(l.id)}
                        className={`w-full text-left p-2.5 rounded-lg border transition-all flex justify-between items-center group
                ${selectedLaborerId === l.id
                                ? 'bg-slate-800 dark:bg-slate-700 text-white border-slate-800 dark:border-slate-600 shadow-md'
                                : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600 hover:bg-slate-50 dark:hover:bg-slate-700'}`}
                    >
                        <div>
                            <p className="font-bold text-sm">{l.name}</p>
                            <p className={`text-[10px] ${selectedLaborerId === l.id ? 'text-slate-400 dark:text-slate-300' : 'text-slate-500 dark:text-slate-400'}`}>
                                {l.role} • {formatCurrency(l.dailyRate)}/day {l.mobile && `• ${l.mobile}`}
                            </p>
                        </div>
                        {selectedLaborerId === l.id && <div className="h-1.5 w-1.5 rounded-full bg-blue-400" />}
                    </button>
                ))}
            </div>
        </div>
    );
};

export default LaborSidebar;
