import React, { useState } from 'react';
import { Lock, Eye, EyeOff, Key, AlertCircle, CheckCircle, Loader2, X } from 'lucide-react';
import { useSelector, useDispatch } from 'react-redux';
import { RootState } from '../store';
import { comparePassword, securePassword } from '../utils/auth';
import { supabase } from '../lib/supabase';
import { logout } from '../store/tenantSlice'; // Synced from previous knowledge that authSlice is in tenantSlice file
import { clearSession } from '../utils/session'; // Assuming this utility exists based on App.tsx usage

interface ChangePasswordModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess?: () => void;
}

const ChangePasswordModal: React.FC<ChangePasswordModalProps> = ({ isOpen, onClose, onSuccess }) => {
    const dispatch = useDispatch();
    const { user } = useSelector((state: RootState) => state.auth);

    const [currentPassword, setCurrentPassword] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');

    const [showCurrent, setShowCurrent] = useState(false);
    const [showNew, setShowNew] = useState(false);

    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState(false);

    if (!isOpen) return null;

    const validateList = [
        { label: 'At least 6 characters long', valid: newPassword.length >= 6 },
        { label: 'Different from current password', valid: newPassword !== currentPassword && newPassword.length > 0 },
        { label: 'Passwords match', valid: newPassword === confirmPassword && newPassword.length > 0 },
    ];

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);

        if (!user) {
            setError('No active user session found.');
            return;
        }

        // 1. Basic Validation
        if (newPassword.length < 6) {
            setError('New password must be at least 6 characters.');
            return;
        }
        if (newPassword !== confirmPassword) {
            setError('New passwords do not match.');
            return;
        }
        if (currentPassword === newPassword) {
            setError('New password cannot be the same as the old password.');
            return;
        }

        setIsLoading(true);

        try {
            // 2. Verify Current Password
            // We need to fetch the LATEST hash from DB to be sure, or use what's in Redux/Session if available.
            // Redux user might have an old hash if it changed elsewhere ( unlikely for single session).
            // Let's verify against the DB record to be ultra-safe.

            const { data: dbUser, error: fetchError } = await supabase
                .from('tenant_users')
                .select('password_hash')
                .eq('id', user.id)
                .single();

            if (fetchError || !dbUser) {
                throw new Error('Failed to retrieve user record.');
            }

            const isValid = await comparePassword(currentPassword, dbUser.password_hash);
            if (!isValid) {
                throw new Error('Incorrect current password.');
            }

            // 3. Secure New Password
            const securedPin = await securePassword(newPassword);

            // 4. Update Database
            const { error: updateError } = await supabase
                .from('tenant_users')
                .update({ password_hash: securedPin })
                .eq('id', user.id);

            if (updateError) throw updateError;

            // 5. Success Flow
            setSuccess(true);

            // Log Event (Optional - if we had an audit table)
            console.log(`[Audit] User ${user.id} changed their password.`);

            // 6. Logout / Invalidate Session after delay
            setTimeout(() => {
                // Perform logout
                clearSession();
                localStorage.removeItem('erp_current_tenant'); // Consistency with App.tsx logout logic
                dispatch(logout());
                if (onSuccess) onSuccess();
                window.location.reload(); // Force reload to clear all states
            }, 2000);

        } catch (err: any) {
            console.error('Password change failed:', err);
            setError(err.message || 'Failed to change password. Please try again.');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 z-[70] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in">
            <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl w-full max-w-md border border-slate-200 dark:border-slate-700 overflow-hidden">

                {/* Header */}
                <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-700 flex justify-between items-center bg-slate-50 dark:bg-slate-900/50">
                    <h3 className="text-lg font-bold text-slate-800 dark:text-white flex items-center gap-2">
                        <Key className="w-5 h-5 text-indigo-500" />
                        Change Password
                    </h3>
                    {!success && !isLoading && (
                        <button onClick={onClose} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200">
                            <X className="w-5 h-5" />
                        </button>
                    )}
                </div>

                {success ? (
                    <div className="p-8 flex flex-col items-center text-center animate-in zoom-in-95 duration-200">
                        <div className="w-16 h-16 bg-emerald-100 dark:bg-emerald-900/30 rounded-full flex items-center justify-center mb-4">
                            <CheckCircle className="w-8 h-8 text-emerald-600 dark:text-emerald-400" />
                        </div>
                        <h4 className="text-xl font-bold text-slate-900 dark:text-white mb-2">Password Changed!</h4>
                        <p className="text-slate-500 dark:text-slate-400 mb-6">
                            Your password has been updated successfully. You will be logged out in a moment.
                        </p>
                        <Loader2 className="w-5 h-5 animate-spin text-indigo-500" />
                    </div>
                ) : (
                    <form onSubmit={handleSubmit} className="p-6 space-y-5">
                        {error && (
                            <div className="p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl flex items-start gap-3 text-red-600 dark:text-red-400 text-sm">
                                <AlertCircle className="w-5 h-5 shrink-0" />
                                <span>{error}</span>
                            </div>
                        )}

                        {/* Current Password */}
                        <div className="space-y-1.5">
                            <label className="text-xs font-bold text-slate-500 uppercase">Current Password</label>
                            <div className="relative">
                                <input
                                    type={showCurrent ? "text" : "password"}
                                    value={currentPassword}
                                    onChange={e => setCurrentPassword(e.target.value)}
                                    className="w-full pl-10 pr-10 py-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500 dark:text-white font-mono text-sm"
                                    placeholder="Enter current PIN/Password"
                                    required
                                />
                                <Lock className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
                                <button
                                    type="button"
                                    onClick={() => setShowCurrent(!showCurrent)}
                                    className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-600"
                                >
                                    {showCurrent ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                </button>
                            </div>
                        </div>

                        {/* New Password */}
                        <div className="space-y-1.5">
                            <label className="text-xs font-bold text-slate-500 uppercase">New Password</label>
                            <div className="relative">
                                <input
                                    type={showNew ? "text" : "password"}
                                    value={newPassword}
                                    onChange={e => setNewPassword(e.target.value)}
                                    className="w-full pl-10 pr-10 py-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500 dark:text-white font-mono text-sm"
                                    placeholder="Enter new strong password"
                                    required
                                />
                                <Key className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
                                <button
                                    type="button"
                                    onClick={() => setShowNew(!showNew)}
                                    className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-600"
                                >
                                    {showNew ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                </button>
                            </div>
                        </div>

                        {/* Confirm Password */}
                        <div className="space-y-1.5">
                            <label className="text-xs font-bold text-slate-500 uppercase">Confirm Password</label>
                            <div className="relative">
                                <input
                                    type="password"
                                    value={confirmPassword}
                                    onChange={e => setConfirmPassword(e.target.value)}
                                    className={`w-full pl-10 pr-4 py-2.5 bg-slate-50 dark:bg-slate-900 border rounded-xl outline-none focus:ring-2 dark:text-white font-mono text-sm ${confirmPassword && confirmPassword !== newPassword
                                        ? 'border-red-300 focus:ring-red-500'
                                        : 'border-slate-200 dark:border-slate-700 focus:ring-indigo-500'
                                        }`}
                                    placeholder="Repeat new password"
                                    required
                                />
                                <Key className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
                            </div>
                        </div>

                        {/* Requirements List */}
                        <div className="bg-slate-50 dark:bg-slate-900/50 p-3 rounded-lg space-y-2">
                            {validateList.map((rule, idx) => (
                                <div key={idx} className="flex items-center gap-2 text-xs">
                                    <div className={`w-1.5 h-1.5 rounded-full ${rule.valid ? 'bg-emerald-500' : 'bg-slate-300 dark:bg-slate-600'}`} />
                                    <span className={`${rule.valid ? 'text-emerald-600 dark:text-emerald-400 font-medium' : 'text-slate-500'}`}>
                                        {rule.label}
                                    </span>
                                </div>
                            ))}
                        </div>

                        <div className="flex gap-3 pt-2">
                            <button
                                type="button"
                                onClick={onClose}
                                disabled={isLoading}
                                className="flex-1 px-4 py-2.5 text-slate-600 dark:text-slate-300 font-bold hover:bg-slate-100 dark:hover:bg-slate-700 rounded-xl transition-colors disabled:opacity-50"
                            >
                                Cancel
                            </button>
                            <button
                                type="submit"
                                disabled={isLoading || !validateList.every(r => r.valid)}
                                className="flex-1 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl shadow-lg shadow-indigo-500/20 transition-all active:scale-95 disabled:opacity-50 disabled:active:scale-100 flex items-center justify-center gap-2"
                            >
                                {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle className="w-4 h-4" />}
                                Update Password
                            </button>
                        </div>
                    </form>
                )}
            </div>
        </div>
    );
};

export default ChangePasswordModal;
