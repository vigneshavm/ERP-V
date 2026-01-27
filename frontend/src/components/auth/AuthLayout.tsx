import React, { ReactNode } from 'react';

interface AuthLayoutProps {
    children: ReactNode;
    title: string;
    subtitle: string;
    secondarySubtitle?: string;
    description: string;
}

const AuthLayout: React.FC<AuthLayoutProps> = ({ children, title, subtitle, secondarySubtitle, description }) => {
    return (
        <div className="min-h-screen flex bg-slate-50 dark:bg-slate-950 transition-colors duration-300">
            {/* LEFT SIDE - BRAND PANEL */}
            <div className="hidden lg:flex w-5/12 bg-slate-900 relative overflow-hidden flex-col justify-between p-12">
                {/* Background Pattern */}
                <div className="absolute inset-0 z-0 opacity-20">
                    <svg className="w-full h-full" viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true">
                        <path d="M0 100 C 20 0 50 0 100 100 Z" fill="url(#grad1)" />
                        <defs>
                            <linearGradient id="grad1" x1="0%" y1="0%" x2="100%" y2="0%">
                                <stop offset="0%" style={{ stopColor: 'rgb(99, 102, 241)', stopOpacity: 1 }} />
                                <stop offset="100%" style={{ stopColor: 'rgb(168, 85, 247)', stopOpacity: 1 }} />
                            </linearGradient>
                        </defs>
                    </svg>
                </div>

                <div className="z-10 mt-10">
                    <div className="flex items-center gap-3 mb-8">
                        <div className="w-10 h-10 rounded-lg bg-indigo-500 flex items-center justify-center">
                            <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                            </svg>
                        </div>
                        <span className="text-2xl font-bold text-white tracking-tight">BizzAI ERP</span>
                    </div>

                    <h1 className="text-4xl font-extrabold text-white leading-tight mb-6">
                        {title}
                    </h1>
                    <p className="text-slate-400 text-lg leading-relaxed max-w-md">
                        {description}
                    </p>
                </div>

                <div className="z-10 text-slate-500 text-sm">
                    &copy; {new Date().getFullYear()} BizzAI Enterprise Solutions.
                </div>
            </div>

            {/* RIGHT SIDE - FORM PANEL */}
            <div className="w-full lg:w-7/12 flex items-center justify-center p-6 lg:p-12 overflow-y-auto dark:bg-slate-900/50">
                <div className="w-full max-w-md space-y-8">
                    <div className="text-center lg:text-left transition-all">
                        <h2 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-white">{subtitle}</h2>
                        {secondarySubtitle && (
                            <p className="mt-2 text-sm text-slate-600 dark:text-slate-400">
                                {secondarySubtitle}
                            </p>
                        )}
                    </div>
                    {children}
                </div>
            </div>
        </div>
    );
};

export default AuthLayout;
