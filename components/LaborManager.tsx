
import React, { useState } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { RootState, AppDispatch, addEmployee, markAttendance } from '../store';
import { Users, UserPlus, Calendar, DollarSign, Wallet } from 'lucide-react';
import { Sector, Branch } from '../types';

const LaborManager: React.FC = () => {
  const dispatch = useDispatch<AppDispatch>();
  const { employees, attendance } = useSelector((state: RootState) => state.labor);
  const { currentSector, currentBranch } = useSelector((state: RootState) => state.auth);

  const [isAdding, setIsAdding] = useState(false);
  const [advanceModalEmp, setAdvanceModalEmp] = useState<string | null>(null);
  const [advanceAmount, setAdvanceAmount] = useState<number>(0);
  
  const [newEmp, setNewEmp] = useState({ name: '', role: '', dailyRate: '', branch: 'Alpha' });

  // Filter Employees
  const sectorEmps = employees.filter(e => 
    e.sector === currentSector && (currentBranch === 'All' || e.branch === currentBranch)
  );
  
  const today = new Date().toISOString().split('T')[0];

  const handleAdd = (e: React.FormEvent) => {
    e.preventDefault();
    dispatch(addEmployee({
        id: Math.random().toString(36).substr(2, 9),
        name: newEmp.name,
        role: newEmp.role,
        dailyRate: parseFloat(newEmp.dailyRate),
        sector: currentSector as Sector,
        branch: newEmp.branch as Branch
    }));
    setIsAdding(false);
    setNewEmp({ name: '', role: '', dailyRate: '', branch: 'Alpha' });
  };

  const handleGiveAdvance = () => {
      if (advanceModalEmp && advanceAmount > 0) {
          // Record as "present" but with advance, or just update advance taken for today.
          // Simplification: We treat advance as part of today's attendance record or create a dummy one if absent.
          // For this prototype, we'll look for today's attendance record, if exists update it, else create one with status 'PRESENT' (assuming they are there to take advance)
          const existing = attendance.find(a => a.employeeId === advanceModalEmp && a.date === today);
          dispatch(markAttendance({
              id: existing?.id || Math.random().toString(),
              employeeId: advanceModalEmp,
              date: today,
              status: existing?.status || 'PRESENT',
              advanceTaken: (existing?.advanceTaken || 0) + advanceAmount
          }));
          setAdvanceModalEmp(null);
          setAdvanceAmount(0);
      }
  };

  const getStatus = (empId: string) => {
    return attendance.find(a => a.employeeId === empId && a.date === today)?.status;
  };

  const calculateFinancials = (empId: string, dailyRate: number) => {
    const records = attendance.filter(a => a.employeeId === empId);
    const presentDays = records.filter(a => a.status === 'PRESENT').length;
    const totalAdvances = records.reduce((sum, r) => sum + r.advanceTaken, 0);
    const accruedSalary = (presentDays * dailyRate) - totalAdvances;
    return { presentDays, totalAdvances, accruedSalary };
  };

  return (
    <div className="space-y-6 relative">
        {/* Advance Modal */}
        {advanceModalEmp && (
            <div className="absolute inset-0 z-20 bg-black/60 backdrop-blur-sm flex items-center justify-center rounded-xl">
                <div className="bg-white dark:bg-slate-800 p-6 rounded-xl border border-slate-200 dark:border-slate-700 shadow-2xl w-80 transition-colors">
                    <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-4">Give Advance</h3>
                    <div className="mb-4">
                        <label className="text-xs text-slate-500 dark:text-slate-400 font-bold uppercase mb-1 block">Amount (₹)</label>
                        <input 
                            type="number" 
                            autoFocus
                            className="w-full bg-slate-100 dark:bg-slate-900 border border-slate-300 dark:border-slate-600 rounded p-2 text-slate-900 dark:text-white font-bold text-lg"
                            value={advanceAmount}
                            onChange={e => setAdvanceAmount(Number(e.target.value))}
                        />
                    </div>
                    <div className="flex gap-2">
                        <button onClick={() => setAdvanceModalEmp(null)} className="flex-1 py-2 bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300 rounded hover:bg-slate-300 dark:hover:bg-slate-600">Cancel</button>
                        <button onClick={handleGiveAdvance} className="flex-1 py-2 bg-emerald-600 text-white font-bold rounded hover:bg-emerald-500">Confirm</button>
                    </div>
                </div>
            </div>
        )}

        <div className="flex justify-between items-center">
            <h2 className="text-2xl font-bold text-slate-900 dark:text-white">Staff Management</h2>
            <button onClick={() => setIsAdding(!isAdding)} className="px-4 py-2 bg-indigo-600 text-white rounded-lg flex gap-2 items-center hover:bg-indigo-500 transition-colors">
                <UserPlus className="w-4 h-4" /> New Employee
            </button>
        </div>

        {isAdding && (
            <form onSubmit={handleAdd} className="bg-white dark:bg-slate-800 p-6 rounded-xl border border-slate-200 dark:border-slate-700 grid grid-cols-1 md:grid-cols-4 gap-4 animate-fade-in transition-colors">
                <div className="flex flex-col gap-1">
                    <label className="text-xs text-slate-500 dark:text-slate-400 font-bold uppercase">Branch</label>
                    <select 
                        className="bg-slate-100 dark:bg-slate-700 border-none rounded p-2 text-slate-900 dark:text-white"
                        value={newEmp.branch}
                        onChange={e => setNewEmp({...newEmp, branch: e.target.value})}
                    >
                        <option value="Alpha">Alpha</option>
                        <option value="Beta">Beta</option>
                        <option value="Gamma">Gamma</option>
                    </select>
                </div>
                <div className="flex flex-col gap-1">
                     <label className="text-xs text-slate-500 dark:text-slate-400 font-bold uppercase">Name</label>
                     <input required placeholder="Full Name" className="bg-slate-100 dark:bg-slate-700 p-2 rounded text-slate-900 dark:text-white" value={newEmp.name} onChange={e => setNewEmp({...newEmp, name: e.target.value})} />
                </div>
                <div className="flex flex-col gap-1">
                     <label className="text-xs text-slate-500 dark:text-slate-400 font-bold uppercase">Role</label>
                     <input required placeholder="Role (e.g. Cashier)" className="bg-slate-100 dark:bg-slate-700 p-2 rounded text-slate-900 dark:text-white" value={newEmp.role} onChange={e => setNewEmp({...newEmp, role: e.target.value})} />
                </div>
                <div className="flex flex-col gap-1">
                     <label className="text-xs text-slate-500 dark:text-slate-400 font-bold uppercase">Daily Rate</label>
                     <input required type="number" placeholder="Daily Rate (₹)" className="bg-slate-100 dark:bg-slate-700 p-2 rounded text-slate-900 dark:text-white" value={newEmp.dailyRate} onChange={e => setNewEmp({...newEmp, dailyRate: e.target.value})} />
                </div>
                <div className="md:col-span-4 flex justify-end gap-3 mt-2 border-t border-slate-200 dark:border-slate-700 pt-4">
                    <button type="button" onClick={() => setIsAdding(false)} className="text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white">Cancel</button>
                    <button type="submit" className="bg-emerald-600 text-white px-6 py-2 rounded font-bold hover:bg-emerald-500">Save Employee</button>
                </div>
            </form>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
            {sectorEmps.map(emp => {
                const status = getStatus(emp.id);
                const { presentDays, totalAdvances, accruedSalary } = calculateFinancials(emp.id, emp.dailyRate);

                return (
                    <div key={emp.id} className="bg-white dark:bg-slate-800 p-6 rounded-xl border border-slate-200 dark:border-slate-700 shadow-lg relative overflow-hidden group hover:border-indigo-500/50 transition-all">
                        <div className="absolute top-0 right-0 p-2">
                             <span className="text-[10px] bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 px-2 py-1 rounded text-slate-600 dark:text-slate-400 font-bold">{emp.branch}</span>
                        </div>
                        <div className="flex items-start justify-between mb-4 mt-2">
                            <div className="flex items-center gap-3">
                                <div className="w-12 h-12 bg-slate-100 dark:bg-slate-700 rounded-full flex items-center justify-center text-slate-400 dark:text-slate-300">
                                    <Users className="w-6 h-6" />
                                </div>
                                <div>
                                    <h4 className="font-bold text-slate-900 dark:text-white">{emp.name}</h4>
                                    <p className="text-xs text-slate-500 dark:text-slate-400 uppercase tracking-wide">{emp.role}</p>
                                </div>
                            </div>
                            <div className="text-right mt-1">
                                <span className="block text-xl font-bold text-indigo-500 dark:text-indigo-400">₹{emp.dailyRate}</span>
                                <span className="text-xs text-slate-500">/day</span>
                            </div>
                        </div>

                        <div className="space-y-4">
                            <div className="bg-slate-50 dark:bg-slate-900/50 p-3 rounded-lg flex justify-between items-center">
                                <span className="text-sm text-slate-500 dark:text-slate-400 flex items-center gap-2">
                                    <Calendar className="w-4 h-4" /> Today
                                </span>
                                <div className="flex gap-2">
                                    <button 
                                        onClick={() => dispatch(markAttendance({ id: Math.random().toString(), employeeId: emp.id, date: today, status: 'PRESENT', advanceTaken: 0 }))}
                                        className={`px-3 py-1 rounded text-xs font-bold transition-all ${status === 'PRESENT' ? 'bg-emerald-500 text-white shadow-lg shadow-emerald-500/40' : 'bg-slate-200 dark:bg-slate-700 text-slate-500 dark:text-slate-400 hover:bg-slate-300 dark:hover:bg-slate-600'}`}
                                    >
                                        P
                                    </button>
                                    <button 
                                        onClick={() => dispatch(markAttendance({ id: Math.random().toString(), employeeId: emp.id, date: today, status: 'ABSENT', advanceTaken: 0 }))}
                                        className={`px-3 py-1 rounded text-xs font-bold transition-all ${status === 'ABSENT' ? 'bg-red-500 text-white shadow-lg shadow-red-500/40' : 'bg-slate-200 dark:bg-slate-700 text-slate-500 dark:text-slate-400 hover:bg-slate-300 dark:hover:bg-slate-600'}`}
                                    >
                                        A
                                    </button>
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-3">
                                <div className="bg-slate-50 dark:bg-slate-900/50 p-3 rounded-lg">
                                    <p className="text-[10px] text-slate-500 uppercase font-bold mb-1">Accrued Wage</p>
                                    <p className="text-slate-900 dark:text-white font-bold">₹{accruedSalary.toLocaleString()}</p>
                                </div>
                                <div className="bg-slate-50 dark:bg-slate-900/50 p-3 rounded-lg relative group/adv cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors" onClick={() => setAdvanceModalEmp(emp.id)}>
                                    <p className="text-[10px] text-slate-500 uppercase font-bold mb-1">Advances</p>
                                    <p className="text-red-500 dark:text-red-400 font-bold">₹{totalAdvances.toLocaleString()}</p>
                                    <div className="absolute top-2 right-2 text-indigo-400 opacity-0 group-hover/adv:opacity-100 transition-opacity">
                                        <Wallet className="w-4 h-4" />
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                );
            })}
        </div>
    </div>
  );
};

export default LaborManager;
    