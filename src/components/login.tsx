
import React, { useState, useMemo } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { RootState, setUser } from '../store';
import { Store, Lock, ArrowRight, AlertCircle, UserCircle } from 'lucide-react';

import { Sector } from '../types/common';

interface LoginProps {
    onLogin: () => void;
    tenantName: string;
    allowedSector: Sector;
}

const Login: React.FC<LoginProps> = ({ onLogin, tenantName, allowedSector }) => {
    const dispatch = useDispatch();
    const { employees } = useSelector((state: RootState) => state.labor);

    const [selectedUserId, setSelectedUserId] = useState<string>('');
    const [pin, setPin] = useState('');
    const [error, setError] = useState('');

    const sortedEmployees = useMemo(() => {
        // Filter by Sector (Allow Owners or matching Sector)
        const relevantEmployees = employees.filter(e =>
            e.systemRole === 'Owner' || e.sector === allowedSector
        );

        // Sort by role priority (Owner -> Manager -> Staff) then name
        const roleOrder = { 'Owner': 0, 'Manager': 1, 'Staff': 2 };
        return [...relevantEmployees].sort((a, b) => {
            const roleDiff = (roleOrder[a.systemRole] || 2) - (roleOrder[b.systemRole] || 2);
            if (roleDiff !== 0) return roleDiff;
            return a.name.localeCompare(b.name);
        });
    }, [employees, allowedSector]);

    // Default selection
    if (!selectedUserId && sortedEmployees.length > 0) {
        setSelectedUserId(sortedEmployees[0].id);
    }

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        setError('');

        const user = employees.find(e => e.id === selectedUserId);

        if (!user) {
            setError("Please select a valid user.");
            return;
        }

        if (pin === user.pin) {
            // Fix for Admin: Identify if we need to switch context sector
            // If the user is an Owner, they should adopt the Tenant's sector for this session
            // instead of their default 'General' sector, so they can see relevant data.
            const sessionUser = { ...user };
            if (user.systemRole === 'Owner' && allowedSector) {
                sessionUser.sector = allowedSector;
            }

            dispatch(setUser(sessionUser));
            onLogin();
        } else {
            setError("Invalid PIN.");
            setPin('');
        }
    };

    return (
        <div className="min-h-screen bg-slate-100 flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl shadow-xl p-8 w-full max-w-md">
                <div className="text-center mb-8">
                    <div className="w-16 h-16 bg-indigo-600 rounded-xl flex items-center justify-center mx-auto mb-4 shadow-lg shadow-indigo-600/20">
                        <Store className="w-8 h-8 text-white" />
                    </div>
                    <h2 className="text-2xl font-bold text-slate-900 mb-1">{tenantName}</h2>
                    <p className="text-slate-500 text-sm">Role-Based Secure Access</p>
                </div>

                <form onSubmit={handleSubmit} className="space-y-5">
                    <div>
                        <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Select User</label>
                        <div className="relative">
                            <UserCircle className="w-5 h-5 text-slate-400 absolute left-3 top-3.5" />
                            <select
                                value={selectedUserId}
                                onChange={(e) => setSelectedUserId(e.target.value)}
                                className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-indigo-600 appearance-none text-slate-800 font-medium"
                            >
                                {sortedEmployees.map(emp => (
                                    <option key={emp.id} value={emp.id}>
                                        {emp.name} ({emp.systemRole})
                                    </option>
                                ))}
                            </select>
                        </div>
                    </div>

                    <div>
                        <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Enter PIN</label>
                        <div className="relative">
                            <Lock className="w-5 h-5 text-slate-400 absolute left-3 top-3" />
                            <input
                                type="password"
                                value={pin}
                                onChange={(e) => setPin(e.target.value)}
                                placeholder="****"
                                className="w-full pl-10 pr-4 py-3 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-indigo-600 font-mono text-center text-lg tracking-widest text-slate-800"
                                autoFocus
                            />
                        </div>
                    </div>

                    {error && (
                        <div className="flex items-center justify-center gap-2 text-red-500 text-sm font-bold bg-red-50 p-3 rounded-lg animate-in slide-in-from-top-1">
                            <AlertCircle className="w-4 h-4" /> {error}
                        </div>
                    )}

                    <button type="submit" className="w-full bg-indigo-600 hover:bg-indigo-700 text-white py-3.5 rounded-xl font-bold flex items-center justify-center gap-2 transition-colors shadow-lg shadow-indigo-600/20">
                        Authenticate Access <ArrowRight className="w-4 h-4" />
                    </button>
                </form>

                <div className="mt-8 pt-6 border-t border-slate-100 text-center">
                    <p className="text-xs text-slate-400 mb-2">Testing Credentials (Auto-detected):</p>
                    <div className="inline-block bg-slate-100 px-3 py-1 rounded-lg">
                        <span className="text-xs text-slate-500 font-mono">
                            Current User PIN: <strong className="text-slate-900">{employees.find(e => e.id === selectedUserId)?.pin || '----'}</strong>
                        </span>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Login;
