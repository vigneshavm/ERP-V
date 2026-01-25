import React from 'react';
import { IndianRupee, Calculator } from 'lucide-react';
import { Card } from '../../components/Card';
import { formatCurrency } from '../../utils/helpers';
import { convertMonthlyToDailyWage } from '../../utils/laborUtils';

interface AddLaborerFormProps {
    newEmp: { name: string; role: string; roleId: string; dailyRate: string; mobile: string; branch: string };
    setNewEmp: React.Dispatch<React.SetStateAction<any>>;
    wageType: 'DAILY' | 'MONTHLY';
    setWageType: React.Dispatch<React.SetStateAction<'DAILY' | 'MONTHLY'>>;
    monthlyInput: string;
    onMonthlyChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
    roles: any[];
    onSubmit: (e: React.FormEvent) => void;
    onCancel: () => void;
}

const AddLaborerForm: React.FC<AddLaborerFormProps> = ({
    newEmp, setNewEmp, wageType, setWageType, monthlyInput, onMonthlyChange, roles, onSubmit, onCancel
}) => {
    return (
        <Card className="p-3 bg-blue-50 dark:bg-slate-800 border-blue-100 dark:border-slate-700 shadow-md relative z-10">
            <h4 className="font-bold text-blue-800 dark:text-blue-300 mb-2 text-xs">New Laborer Details</h4>
            <form onSubmit={onSubmit} className="space-y-2">
                <input
                    type="text"
                    placeholder="Full Name"
                    value={newEmp.name}
                    onChange={e => setNewEmp({ ...newEmp, name: e.target.value })}
                    className="w-full p-2 text-xs rounded border border-blue-200 dark:border-slate-600 bg-white dark:bg-slate-900 text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-blue-300"
                    autoFocus
                />
                <input
                    type="text"
                    placeholder="Role (Display Name)"
                    value={newEmp.role}
                    onChange={e => setNewEmp({ ...newEmp, role: e.target.value })}
                    className="w-full p-2 text-xs rounded border border-blue-200 dark:border-slate-600 bg-white dark:bg-slate-900 text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-blue-300"
                />
                <select
                    value={newEmp.roleId}
                    onChange={e => setNewEmp({ ...newEmp, roleId: e.target.value })}
                    className="w-full p-2 text-xs rounded border border-blue-200 dark:border-slate-600 bg-white dark:bg-slate-900 text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-blue-300"
                >
                    <option value="">Select System Role (Default: Staff)</option>
                    {roles.map(r => <option key={r.id} value={r.id}>{r.name}</option>)}
                </select>
                <input
                    type="text"
                    placeholder="Phone Number"
                    value={newEmp.mobile}
                    onChange={e => setNewEmp({ ...newEmp, mobile: e.target.value })}
                    className="w-full p-2 text-xs rounded border border-blue-200 dark:border-slate-600 bg-white dark:bg-slate-900 text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-blue-300"
                />

                <div className="flex bg-white dark:bg-slate-900 rounded border border-blue-200 dark:border-slate-600 overflow-hidden">
                    <button
                        type="button"
                        onClick={() => setWageType('DAILY')}
                        className={`flex-1 py-1.5 text-[10px] font-bold transition-colors ${wageType === 'DAILY' ? 'bg-blue-600 text-white' : 'text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800'}`}
                    >
                        Daily Rate
                    </button>
                    <div className="w-px bg-blue-200 dark:bg-slate-600"></div>
                    <button
                        type="button"
                        onClick={() => setWageType('MONTHLY')}
                        className={`flex-1 py-1.5 text-[10px] font-bold transition-colors ${wageType === 'MONTHLY' ? 'bg-blue-600 text-white' : 'text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800'}`}
                    >
                        Monthly Salary
                    </button>
                </div>

                {wageType === 'DAILY' ? (
                    <div className="relative">
                        <IndianRupee size={12} className="absolute left-2 top-2.5 text-slate-400" />
                        <input
                            type="number"
                            placeholder="Daily Wage"
                            value={newEmp.dailyRate}
                            onChange={e => setNewEmp({ ...newEmp, dailyRate: e.target.value })}
                            className="w-full pl-6 p-2 text-xs rounded border border-blue-200 dark:border-slate-600 bg-white dark:bg-slate-900 text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-blue-300"
                        />
                    </div>
                ) : (
                    <div className="space-y-1">
                        <div className="relative">
                            <IndianRupee size={12} className="absolute left-2 top-2.5 text-slate-400" />
                            <input
                                type="number"
                                placeholder="Monthly Salary"
                                value={monthlyInput}
                                onChange={onMonthlyChange}
                                className="w-full pl-6 p-2 text-xs rounded border border-blue-200 dark:border-slate-600 bg-white dark:bg-slate-900 text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-blue-300"
                            />
                        </div>
                        {newEmp.dailyRate && (
                            <div className="flex items-center gap-1.5 text-[10px] text-blue-700 dark:text-blue-300 bg-blue-100/50 dark:bg-blue-900/30 p-1.5 rounded">
                                <Calculator size={10} />
                                <span>Daily: {formatCurrency(convertMonthlyToDailyWage(monthlyInput))} (Calc: /30)</span>
                            </div>
                        )}
                    </div>
                )}

                <div className="flex gap-2 mt-1">
                    <button type="submit" className="flex-1 bg-blue-600 text-white py-1 rounded text-xs font-medium hover:bg-blue-700">Save</button>
                    <button type="button" onClick={onCancel} className="flex-1 bg-white dark:bg-slate-700 text-slate-600 dark:text-slate-300 py-1 rounded text-xs font-medium hover:bg-slate-50 dark:hover:bg-slate-600">Cancel</button>
                </div>
            </form>
        </Card>
    );
};

export default AddLaborerForm;
