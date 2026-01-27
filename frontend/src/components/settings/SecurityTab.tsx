import React, { useMemo, useState } from 'react';
import { Shield, Lock } from 'lucide-react';
import { useSelector } from 'react-redux';
import { RootState } from '../../redux/store';
import { isSecuredIdeally } from '../../utils/auth';
import ChangePasswordModal from '../ChangePasswordModal';

const SecurityTab: React.FC = () => {
    const { user } = useSelector((state: RootState) => state.auth);
    const { employees } = useSelector((state: RootState) => state.labor); // In backend system, staff are in labor state

    const [isPasswordModalOpen, setIsPasswordModalOpen] = useState(false);

    const securityScore = useMemo(() => {
        if (!user) return 0;
        let score = 0;
        // User might not have a password field directly in the session object, 
        // but for scoring we assume 30 if they are logged in.
        score += 30;
        if (user.is2faEnabled) score += 40;
        // simplified score for now
        return score;
    }, [user]);

    const staffStatus = useMemo(() => {
        const total = employees?.length || 0;
        const secured = employees?.filter(e => e.is2faEnabled).length || 0;
        return { total, secured, percent: total > 0 ? Math.round((secured / total) * 100) : 100 };
    }, [employees]);

    return (
        <div className="space-y-6 animate-in fade-in duration-500">
            {/* Header / Summary */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-white dark:bg-slate-800 p-6 rounded-3xl border border-slate-100 dark:border-slate-700 shadow-sm">
                    <div className="flex justify-between items-start mb-4">
                        <div className="w-10 h-10 bg-indigo-100 dark:bg-indigo-900/30 rounded-xl flex items-center justify-center">
                            <Shield className="w-6 h-6 text-indigo-600 dark:text-indigo-400" />
                        </div>
                        <span className={`text-xs font-black px-2 py-1 rounded-lg ${securityScore > 70 ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'}`}>
                            {securityScore}% SECURE
                        </span>
                    </div>
                    <h3 className="text-slate-500 dark:text-slate-400 text-[10px] font-black uppercase tracking-widest mb-1">Your Security Level</h3>
                    <div className="text-2xl font-black text-slate-800 dark:text-white">
                        {securityScore > 70 ? 'Industry Standard' : 'Enhancement Recommended'}
                    </div>
                </div>

                <div className="bg-white dark:bg-slate-800 p-6 rounded-3xl border border-slate-100 dark:border-slate-700 shadow-sm">
                    <div className="flex justify-between items-start mb-4">
                        <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900/30 rounded-xl flex items-center justify-center">
                            <Lock className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                        </div>
                        <span className="text-xs font-black px-2 py-1 bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 rounded-lg uppercase">
                            {staffStatus.percent}% Protected
                        </span>
                    </div>
                    <h3 className="text-slate-500 dark:text-slate-400 text-[10px] font-black uppercase tracking-widest mb-1">Staff Access Security</h3>
                    <div className="text-2xl font-black text-slate-800 dark:text-white">
                        {staffStatus.secured} / {staffStatus.total} Enrolled in 2FA
                    </div>
                </div>
            </div>

            {/* Core Controls */}
            <div className="bg-white dark:bg-slate-800 rounded-[2rem] border border-slate-100 dark:border-slate-700 overflow-hidden shadow-sm">
                <div className="p-6 border-b border-slate-100 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-900/30 flex justify-between items-center">
                    <div>
                        <h3 className="text-lg font-black text-slate-800 dark:text-white">Account Safeguards</h3>
                        <p className="text-xs text-slate-500 font-medium">Manage your personal security credentials</p>
                    </div>
                </div>

                <div className="p-6 space-y-6">
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-4 rounded-2xl bg-slate-50 dark:bg-slate-900/50 border border-slate-100 dark:border-slate-700">
                        <div className="flex gap-4">
                            <div className="w-12 h-12 bg-white dark:bg-slate-800 rounded-xl shadow-sm flex items-center justify-center shrink-0">
                                <Lock className="w-5 h-5 text-slate-400" />
                            </div>
                            <div>
                                <h4 className="text-sm font-black text-slate-800 dark:text-white">Access Key (Password/PIN)</h4>
                                <p className="text-xs text-slate-500 mt-0.5">Last changed over 30 days ago. Strengthening recommended.</p>
                            </div>
                        </div>
                        <button
                            onClick={() => setIsPasswordModalOpen(true)}
                            className="px-6 py-2.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-600 text-slate-700 dark:text-slate-200 text-xs font-black uppercase tracking-widest rounded-xl hover:bg-slate-50 dark:hover:bg-slate-700 transition-all active:scale-95"
                        >
                            Change Access Key
                        </button>
                    </div>
                </div>
            </div>

            {/* Change Password Modal */}
            <ChangePasswordModal
                isOpen={isPasswordModalOpen}
                onClose={() => setIsPasswordModalOpen(false)}
            />
        </div>
    );
};

export default SecurityTab;
