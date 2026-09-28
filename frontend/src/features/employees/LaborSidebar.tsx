import React, { useState } from 'react';
import { Users, Plus, Search, ChevronRight, Loader2, AlertTriangle } from 'lucide-react';
import { Employee } from "../../types/hr";
import { formatCurrency } from "../../utils/helpers";

interface LaborSidebarProps {
    employees: Employee[];
    selectedLaborerId: string | null;
    onSelectLaborer: (id: string) => void;
    onToggleAddForm: () => void;
    isAddingLaborer: boolean;
    staffType: 'ALL' | 'OFFICE' | 'FIELD';
    onStaffTypeChange: (type: 'ALL' | 'OFFICE' | 'FIELD') => void;
    // STAFF-018: lets this render a distinct "couldn't load" state instead of
    // silently looking identical to "the tenant genuinely has zero staff".
    isLoading: boolean;
    loadError: string | null;
    onRetry: () => void;
}

const LaborSidebar: React.FC<LaborSidebarProps> = ({
    employees,
    selectedLaborerId,
    onSelectLaborer,
    onToggleAddForm,
    isAddingLaborer,
    staffType,
    onStaffTypeChange,
    isLoading,
    loadError,
    onRetry
}) => {
    // STAFF-020: this box previously had no value/onChange — typing did
    // nothing. Filters the already-fetched, DB-sourced employee list by
    // name or role.
    const [searchTerm, setSearchTerm] = useState('');
    const filteredEmployees = searchTerm.trim()
        ? employees.filter(e =>
            e.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            e.role?.toLowerCase().includes(searchTerm.toLowerCase())
        )
        : employees;

    return (
        <div className="w-full flex flex-col gap-4 h-full bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-100 dark:border-slate-700 p-4 transition-colors">
            <div className="flex flex-col gap-3 mb-2">
                <div className="flex items-center justify-between">
                    <div>
                        <h2 className="text-lg font-bold text-slate-900 dark:text-white">Team Members</h2>
                        <p className="text-xs text-slate-500 dark:text-slate-400">
                            {isLoading ? 'Loading…' : loadError ? 'Unable to load' : `${employees.length} Active Staff`}
                        </p>
                    </div>
                    <button
                        onClick={onToggleAddForm}
                        className={`p-2 rounded-lg transition-all ${isAddingLaborer
                            ? 'bg-primary text-white shadow-md'
                            : 'bg-primary-soft text-primary hover:bg-primary-soft dark:bg-primary-soft dark:text-primary dark:hover:bg-primary-soft'
                            }`}
                    >
                        <Plus size={20} />
                    </button>
                </div>

                {/* Filter Tabs */}
                <div className="flex bg-slate-100 dark:bg-slate-900 p-1 rounded-lg">
                    {(['ALL', 'OFFICE', 'FIELD'] as const).map((type) => (
                        <button
                            key={type}
                            onClick={() => onStaffTypeChange(type)}
                            className={`flex-1 py-1.5 text-xs font-bold rounded-md transition-all ${staffType === type
                                ? 'bg-white dark:bg-slate-800 text-primary dark:text-primary shadow-sm'
                                : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-300'
                                }`}
                        >
                            {type === 'ALL' ? 'All' : type === 'OFFICE' ? 'Office' : 'Field'}
                        </button>
                    ))}
                </div>
            </div>

            <div className="relative">
                <Search className="absolute left-3 top-2.5 text-slate-400 w-4 h-4" />
                <input
                    type="text"
                    placeholder="Search staff..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-9 pr-4 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-sm text-slate-700 dark:text-slate-200 outline-none focus:ring-2 focus:ring-indigo-100 dark:focus:ring-indigo-900 focus:border-primary dark:focus:border-primary transition-all placeholder:text-slate-400 dark:placeholder:text-slate-600"
                />
            </div>

            <div className="flex-1 overflow-y-auto space-y-2 custom-scrollbar pr-1 -mr-2">
                {isLoading ? (
                    <div className="text-center py-8">
                        <Loader2 className="w-6 h-6 text-slate-300 dark:text-slate-600 mx-auto mb-2 animate-spin" />
                        <p className="text-xs text-slate-400 dark:text-slate-500">Loading staff…</p>
                    </div>
                ) : loadError ? (
                    <div className="text-center py-8 px-2">
                        <AlertTriangle className="w-8 h-8 text-danger dark:text-danger mx-auto mb-2" />
                        <p className="text-xs font-semibold text-danger dark:text-danger">Unable to load staff</p>
                        <p className="text-[11px] text-slate-400 dark:text-slate-500 mt-1 mb-3">{loadError}</p>
                        <button
                            onClick={onRetry}
                            className="text-xs font-bold text-primary hover:underline"
                        >
                            Retry
                        </button>
                    </div>
                ) : filteredEmployees.length === 0 && (
                    <div className="text-center py-8">
                        <Users className="w-8 h-8 text-slate-300 dark:text-slate-600 mx-auto mb-2" />
                        <p className="text-xs text-slate-400 dark:text-slate-500">
                            {searchTerm.trim() ? `No staff match "${searchTerm}".` : 'No employees found.'}
                        </p>
                    </div>
                )}
                {!isLoading && !loadError && filteredEmployees.map(l => (
                    <button
                        key={l.id}
                        onClick={() => onSelectLaborer(l.id)}
                        className={`w-full text-left p-3 rounded-lg border transition-all flex justify-between items-center group relative overflow-hidden
                        ${selectedLaborerId === l.id
                                ? 'bg-primary-soft dark:bg-primary-soft border-primary/30 dark:border-primary/30 shadow-sm'
                                : 'bg-white dark:bg-slate-800 border-transparent hover:bg-slate-50 dark:hover:bg-neutral-750 hover:border-slate-200 dark:hover:border-slate-700'}`}
                    >
                        {selectedLaborerId === l.id && (
                            <div className="absolute left-0 top-0 bottom-0 w-1 bg-primary rounded-l-lg" />
                        )}
                        <div className="pl-2">
                            <p className={`font-semibold text-sm ${selectedLaborerId === l.id ? 'text-primary dark:text-primary' : 'text-slate-700 dark:text-slate-200'}`}>
                                {l.name}
                            </p>
                            <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5 flex items-center gap-1.5">
                                <span className="bg-slate-100 dark:bg-slate-700 px-1.5 rounded text-slate-600 dark:text-slate-300 font-medium">{l.role}</span>
                                <span>•</span>
                                <span>{formatCurrency(l.dailyRate)}/day</span>
                            </p>
                        </div>
                        {selectedLaborerId === l.id && <ChevronRight className="w-4 h-4 text-primary" />}
                    </button>
                ))}
            </div>
        </div>
    );
};

export default LaborSidebar;
