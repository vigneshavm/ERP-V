import React from 'react';
import { Users, Plus, Search, ChevronRight } from 'lucide-react';
import { Employee } from "@/entities/people/model/hr";
import { formatCurrency } from "@/shared/lib/utils/helpers";

interface LaborSidebarProps {
    employees: Employee[];
    selectedLaborerId: string | null;
    onSelectLaborer: (id: string) => void;
    onToggleAddForm: () => void;
    isAddingLaborer: boolean;
    staffType: 'ALL' | 'OFFICE' | 'FIELD';
    onStaffTypeChange: (type: 'ALL' | 'OFFICE' | 'FIELD') => void;
}

const LaborSidebar: React.FC<LaborSidebarProps> = ({
    employees,
    selectedLaborerId,
    onSelectLaborer,
    onToggleAddForm,
    isAddingLaborer,
    staffType,
    onStaffTypeChange
}) => {
    return (
        <div className="w-full flex flex-col gap-4 h-full bg-white dark:bg-[var(--erp-card)] rounded-xl shadow-sm border border-default dark:border-default p-4 transition-colors">
            <div className="flex flex-col gap-3 mb-2">
                <div className="flex items-center justify-between">
                    <div>
                        <h2 className="text-lg font-bold text-main">Team Members</h2>
                        <p className="text-xs text-muted dark:text-muted">{employees.length} Active Staff</p>
                    </div>
                    <button
                        onClick={onToggleAddForm}
                        className={`p-2 rounded-lg transition-all ${isAddingLaborer
                            ? 'bg-indigo-600 text-white shadow-md'
                            : 'bg-indigo-50 text-indigo-600 hover:bg-indigo-100 dark:bg-indigo-900/30 dark:text-indigo-400 dark:hover:bg-indigo-900/50'
                            }`}
                    >
                        <Plus size={20} />
                    </button>
                </div>

                {/* Filter Tabs */}
                <div className="flex bg-[var(--erp-bg-sunken)] dark:bg-[var(--erp-bg)] p-1 rounded-lg">
                    {(['ALL', 'OFFICE', 'FIELD'] as const).map((type) => (
                        <button
                            key={type}
                            onClick={() => onStaffTypeChange(type)}
                            className={`flex-1 py-1.5 text-xs font-bold rounded-md transition-all ${staffType === type
                                ? 'bg-white dark:bg-[var(--erp-card)] text-indigo-600 dark:text-indigo-400 shadow-sm'
                                : 'text-muted dark:text-muted hover:text-secondary dark:hover:text-muted'
                                }`}
                        >
                            {type === 'ALL' ? 'All' : type === 'OFFICE' ? 'Office' : 'Field'}
                        </button>
                    ))}
                </div>
            </div>

            <div className="relative">
                <Search className="absolute left-3 top-2.5 text-muted w-4 h-4" />
                <input
                    type="text"
                    placeholder="Search staff..."
                    className="w-full pl-9 pr-4 py-2 bg-[var(--erp-bg-sunken)] dark:bg-[var(--erp-bg)] border border-default dark:border-default rounded-lg text-sm text-gray-700 dark:text-gray-200 outline-none focus:ring-2 focus:ring-indigo-100 dark:focus:ring-indigo-900 focus:border-indigo-400 dark:focus:border-indigo-500 transition-all placeholder:text-muted dark:placeholder:text-secondary"
                />
            </div>

            <div className="flex-1 overflow-y-auto space-y-2 custom-scrollbar pr-1 -mr-2">
                {employees.length === 0 && (
                    <div className="text-center py-8">
                        <Users className="w-8 h-8 text-gray-300 dark:text-secondary mx-auto mb-2" />
                        <p className="text-xs text-muted dark:text-muted">No employees found.</p>
                    </div>
                )}
                {employees.map(l => (
                    <button
                        key={l.id}
                        onClick={() => onSelectLaborer(l.id)}
                        className={`w-full text-left p-3 rounded-lg border transition-all flex justify-between items-center group relative overflow-hidden
                        ${selectedLaborerId === l.id
                                ? 'bg-indigo-50 dark:bg-indigo-900/20 border-indigo-200 dark:border-indigo-800 shadow-sm'
                                : 'bg-white dark:bg-[var(--erp-card)] border-transparent hover:bg-[var(--erp-bg-sunken)] dark:hover:bg-neutral-750 hover:border-default dark:hover:border-default'}`}
                    >
                        {selectedLaborerId === l.id && (
                            <div className="absolute left-0 top-0 bottom-0 w-1 bg-indigo-500 rounded-l-lg" />
                        )}
                        <div className="pl-2">
                            <p className={`font-semibold text-sm ${selectedLaborerId === l.id ? 'text-indigo-900 dark:text-indigo-300' : 'text-gray-700 dark:text-gray-200'}`}>
                                {l.name}
                            </p>
                            <p className="text-[11px] text-muted dark:text-muted mt-0.5 flex items-center gap-1.5">
                                <span className="bg-[var(--erp-bg-sunken)] dark:bg-neutral-700 px-1.5 rounded text-secondary dark:text-gray-300 font-medium">{l.role}</span>
                                <span>•</span>
                                <span>{formatCurrency(l.dailyRate)}/day</span>
                            </p>
                        </div>
                        {selectedLaborerId === l.id && <ChevronRight className="w-4 h-4 text-indigo-400" />}
                    </button>
                ))}
            </div>
        </div>
    );
};

export default LaborSidebar;
