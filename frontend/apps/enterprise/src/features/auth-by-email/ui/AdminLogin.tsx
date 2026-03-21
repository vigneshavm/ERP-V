import React, { useState } from 'react';
import { Shield, Lock, AlertCircle, ArrowRight } from 'lucide-react';

interface AdminLoginProps {
    onLogin: () => void;
    onCancel: () => void;
}

const AdminLogin: React.FC<AdminLoginProps> = ({ onLogin, onCancel }) => {
    const [pin, setPin] = useState('');
    const [error, setError] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    const handleLogin = (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setIsLoading(true);

        // Simulate API call / Secure validation
        setTimeout(() => {
            // Temporary Hardcoded PIN for Demo - In prod this goes to backend
            const MASTER_PIN = "9999";

            if (pin === MASTER_PIN) {
                onLogin();
            } else {
                setError('Invalid Administration PIN');
                setPin('');
            }
            setIsLoading(false);
        }, 800);
    };

    return (
        <div className="min-h-screen bg-[var(--erp-bg)] flex items-center justify-center p-4">
            <div className="max-w-md w-full bg-[var(--erp-card)] rounded-2xl shadow-2xl border border-default overflow-hidden">
                <div className="p-8 text-center border-b border-default bg-[var(--erp-card)]/50">
                    <div className="w-16 h-16 bg-indigo-600 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg shadow-indigo-600/30">
                        <Shield className="w-8 h-8 text-white" />
                    </div>
                    <h2 className="text-2xl font-bold text-white mb-1">System Access</h2>
                    <p className="text-muted text-sm">Restricted to Authorized Personnel Only</p>
                </div>

                <div className="p-8">
                    <form onSubmit={handleLogin} className="space-y-6">
                        <div>
                            <label className="block text-muted text-xs font-bold uppercase tracking-wider mb-2">
                                Admin Security PIN
                            </label>
                            <div className="relative">
                                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                    <Lock className="h-5 w-5 text-muted" />
                                </div>
                                <input
                                    type="password"
                                    value={pin}
                                    onChange={(e) => setPin(e.target.value)}
                                    className="block w-full pl-10 pr-3 py-3 border border-slate-600 rounded-xl leading-5 bg-[var(--erp-bg)]/50 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all sm:text-sm"
                                    placeholder="Enter 4-digit PIN"
                                    maxLength={8}
                                    autoFocus
                                />
                            </div>
                        </div>

                        {error && (
                            <div className="bg-red-900/20 border border-red-900/50 rounded-lg p-3 flex items-start gap-3">
                                <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
                                <span className="text-red-400 text-sm font-medium">{error}</span>
                            </div>
                        )}

                        <div className="flex flex-col gap-3 mt-8">
                            <button
                                type="submit"
                                disabled={isLoading || pin.length < 4}
                                className={`w-full flex justify-center py-3 px-4 border border-transparent rounded-xl shadow-sm text-sm font-bold text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-slate-900 focus:ring-indigo-500 transition-all ${isLoading ? 'opacity-70 cursor-not-allowed' : ''}`}
                            >
                                {isLoading ? 'Verifying Access...' : 'Authenticate System'}
                            </button>
                            <button
                                type="button"
                                onClick={onCancel}
                                className="w-full flex justify-center py-3 px-4 border border-default rounded-xl shadow-sm text-sm font-bold text-slate-300 hover:bg-slate-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-slate-900 focus:ring-slate-500 transition-all"
                            >
                                Return to Landing Page
                            </button>
                        </div>
                    </form>
                </div>

                <div className="bg-[var(--erp-bg)]/50 p-4 text-center border-t border-default">
                    <p className="text-xs text-muted">Secure Environment • v2.4.0</p>
                </div>
            </div>
        </div>
    );
};

export default AdminLogin;
