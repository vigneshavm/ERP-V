import React, { useState } from 'react';
import { Shield, Lock, Mail, AlertCircle } from 'lucide-react';
import { adminSignIn, AdminSession } from '../services/adminAuth';

interface AdminLoginProps {
    onLogin: (session: AdminSession) => void;
    onCancel: () => void;
}

/**
 * Sign-in for the System Core console. Access is decided by the server: the account must have the
 * 'superadmin' role (see services/adminAuth.ts). There is no PIN or other secret in this file.
 */
const AdminLogin: React.FC<AdminLoginProps> = ({ onLogin, onCancel }) => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setIsLoading(true);
        try {
            const session = await adminSignIn(email, password);
            setPassword('');
            onLogin(session);
        } catch (err) {
            setError((err as Error).message);
            setPassword('');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-slate-900 flex items-center justify-center p-4">
            <div className="max-w-md w-full bg-slate-800 rounded-sm shadow-2xl border border-slate-700 overflow-hidden">
                <div className="p-8 text-center border-b border-slate-700 bg-slate-800/50">
                    <div className="w-16 h-16 bg-indigo-600 rounded-sm flex items-center justify-center mx-auto mb-4 shadow-lg shadow-indigo-600/30">
                        <Shield className="w-8 h-8 text-white" />
                    </div>
                    <h2 className="text-2xl font-bold text-white mb-1">System Access</h2>
                    <p className="text-slate-400 text-sm">Restricted to Authorized Personnel Only</p>
                </div>

                <div className="p-8">
                    <form onSubmit={handleLogin} className="space-y-6">
                        <div>
                            <label htmlFor="admin-email" className="block text-slate-400 text-xs font-bold uppercase tracking-wider mb-2">
                                Administrator email
                            </label>
                            <div className="relative">
                                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                    <Mail className="h-5 w-5 text-slate-500" />
                                </div>
                                <input
                                    id="admin-email"
                                    type="email"
                                    autoComplete="username"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    className="block w-full pl-10 pr-3 py-3 border border-slate-600 rounded-xl leading-5 bg-slate-900/50 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all sm:text-sm"
                                    placeholder="admin@example.com"
                                    required
                                    autoFocus
                                />
                            </div>
                        </div>
                        <div>
                            <label htmlFor="admin-password" className="block text-slate-400 text-xs font-bold uppercase tracking-wider mb-2">
                                Password
                            </label>
                            <div className="relative">
                                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                    <Lock className="h-5 w-5 text-slate-500" />
                                </div>
                                <input
                                    id="admin-password"
                                    type="password"
                                    autoComplete="current-password"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    className="block w-full pl-10 pr-3 py-3 border border-slate-600 rounded-xl leading-5 bg-slate-900/50 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all sm:text-sm"
                                    required
                                />
                            </div>
                        </div>
                        <p className="text-xs text-slate-500">
                            Only accounts with the platform administrator role can sign in. Signing in here ends any shop session open in this browser.
                        </p>

                        {error && (
                            <div role="alert" className="bg-red-900/20 border border-red-900/50 rounded-lg p-3 flex items-start gap-3">
                                <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
                                <span className="text-red-400 text-sm font-medium">{error}</span>
                            </div>
                        )}

                        <div className="flex flex-col gap-3 mt-8">
                            <button
                                type="submit"
                                disabled={isLoading || !email || !password}
                                className={`w-full flex justify-center py-3 px-4 border border-transparent rounded-xl shadow-sm text-sm font-bold text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-slate-900 focus:ring-indigo-500 transition-all ${isLoading ? 'opacity-70 cursor-not-allowed' : ''}`}
                            >
                                {isLoading ? 'Verifying access…' : 'Sign in'}
                            </button>
                            <button
                                type="button"
                                onClick={onCancel}
                                className="w-full flex justify-center py-3 px-4 border border-slate-700 rounded-xl shadow-sm text-sm font-bold text-slate-300 hover:bg-slate-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-slate-900 focus:ring-slate-500 transition-all"
                            >
                                Return to Landing Page
                            </button>
                        </div>
                    </form>
                </div>

                <div className="bg-slate-900/50 p-4 text-center border-t border-slate-700">
                    <p className="text-xs text-slate-500">Secure Environment • v2.4.0</p>
                </div>
            </div>
        </div>
    );
};

export default AdminLogin;
