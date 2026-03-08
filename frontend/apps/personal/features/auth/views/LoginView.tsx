"use client";

import React, { useState } from 'react';
import { Mail, Lock, ArrowRight, Github, Chrome } from 'lucide-react';
import { useAuth } from '../../../contexts/AuthContext';

const LoginView: React.FC = () => {
    const { login, setAuthScreen } = useAuth();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');

        if (!email || !password) {
            setError('Please fill in all fields');
            return;
        }

        setIsLoading(true);
        setTimeout(() => {
            setIsLoading(false);
            login(email);
        }, 1500);
    };

    return (
        <div className="flex min-h-screen items-center justify-center p-4 bg-black overflow-hidden relative">
            <div className="absolute inset-0 z-0 opacity-20 pointer-events-none">
                <div className="absolute top-[-10%] right-[-10%] w-[50%] h-[50%] bg-primary rounded-full blur-[120px]" />
                <div className="absolute bottom-[-10%] left-[-10%] w-[30%] h-[30%] bg-primary rounded-full blur-[80px]" />
            </div>

            <div className="w-full max-w-5xl grid lg:grid-cols-2 bg-zinc-900/50 backdrop-blur-xl border border-white/10 rounded-3xl overflow-hidden shadow-2xl relative z-10">
                <div className="hidden lg:flex flex-col justify-center p-12 bg-gradient-to-br from-primary/10 to-transparent text-white">
                    <div className="w-12 h-12 bg-primary text-black font-black flex items-center justify-center rounded-xl text-xl mb-8">
                        EX
                    </div>
                    <h1 className="text-5xl font-bold font-heading mb-6 tracking-tight">Expanager</h1>
                    <p className="text-zinc-400 text-lg mb-8 leading-relaxed">
                        Master your finances with elegance and precision. Track, analyze, and grow your wealth effortlessly.
                    </p>

                    <div className="space-y-6">
                        {[
                            'Real-time expense tracking',
                            'Deep financial insights',
                            'Secure cloud synchronization'
                        ].map((feat) => (
                            <div key={feat} className="flex items-center gap-4 group">
                                <div className="w-2 h-2 rounded-full bg-primary" />
                                <span className="text-zinc-300 group-hover:text-white transition-colors">{feat}</span>
                            </div>
                        ))}
                    </div>
                </div>

                <div className="p-8 md:p-12 border-l border-white/5">
                    <div className="lg:hidden flex items-center gap-3 mb-10">
                        <div className="w-10 h-10 bg-primary text-black font-black flex items-center justify-center rounded-lg text-lg">
                            EX
                        </div>
                        <h2 className="text-2xl font-bold font-heading">Welcome Back</h2>
                    </div>

                    <div className="mb-10 text-center lg:text-left">
                        <h2 className="hidden lg:block text-3xl font-bold font-heading mb-2">Sign In</h2>
                        <p className="text-zinc-500">Enter your details to access your account</p>
                    </div>

                    {error && (
                        <div className="mb-6 p-4 bg-danger/10 border border-danger/20 text-danger rounded-xl text-sm">
                            {error}
                        </div>
                    )}

                    <form onSubmit={handleSubmit} className="space-y-6">
                        <div className="space-y-2">
                            <label className="text-sm font-medium text-zinc-400 ml-1">Email</label>
                            <div className="relative group">
                                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-500 group-focus-within:text-primary transition-colors" size={18} />
                                <input
                                    type="email"
                                    placeholder="admin@example.com"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    disabled={isLoading}
                                    className="w-full bg-black/40 border border-white/5 rounded-2xl py-4 pl-12 pr-4 text-white placeholder:text-zinc-600 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary/50 transition-all font-sans"
                                />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <div className="flex justify-between items-center ml-1">
                                <label className="text-sm font-medium text-zinc-400">Password</label>
                                <button type="button" className="text-xs text-primary hover:underline">Forgot password?</button>
                            </div>
                            <div className="relative group">
                                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-500 group-focus-within:text-primary transition-colors" size={18} />
                                <input
                                    type="password"
                                    placeholder="••••••••"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    disabled={isLoading}
                                    className="w-full bg-black/40 border border-white/5 rounded-2xl py-4 pl-12 pr-4 text-white placeholder:text-zinc-600 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary/50 transition-all font-sans"
                                />
                            </div>
                        </div>

                        <button
                            type="submit"
                            disabled={isLoading}
                            className="w-full bg-primary hover:bg-primary/90 text-black font-bold py-4 rounded-2xl flex items-center justify-center gap-2 transition-all hover:scale-[1.01] active:scale-[0.99] disabled:opacity-50"
                        >
                            {isLoading ? (
                                <div className="w-5 h-5 border-2 border-black/30 border-t-black rounded-full animate-spin" />
                            ) : (
                                <>
                                    Sign In <ArrowRight size={18} />
                                </>
                            )}
                        </button>
                    </form>

                    <div className="relative my-10 text-center">
                        <div className="absolute inset-0 flex items-center">
                            <div className="w-full border-t border-white/5"></div>
                        </div>
                        <span className="relative px-4 bg-zinc-900/50 text-xs text-zinc-500 uppercase tracking-widest">or continue with</span>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <button className="flex items-center justify-center gap-3 py-3.5 bg-white/5 hover:bg-white/10 border border-white/5 rounded-2xl text-sm transition-all group">
                            <Chrome size={18} className="group-hover:text-primary transition-colors" />
                            <span>Google</span>
                        </button>
                        <button className="flex items-center justify-center gap-3 py-3.5 bg-white/5 hover:bg-white/10 border border-white/5 rounded-2xl text-sm transition-all group">
                            <Github size={18} className="group-hover:text-primary transition-colors" />
                            <span>Github</span>
                        </button>
                    </div>

                    <p className="mt-10 text-center text-zinc-500 text-sm">
                        Don't have an account?{' '}
                        <button
                            onClick={() => setAuthScreen('signup')}
                            className="text-primary hover:underline font-medium"
                        >
                            Create one for free
                        </button>
                    </p>
                </div>
            </div>
        </div>
    );
};

export default LoginView;
