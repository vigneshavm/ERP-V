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
        <div className="min-h-screen flex bg-app text-main transition-colors duration-300 font-body">
            {/* LEFT SIDE - BRAND PANEL */}
            <div className="hidden lg:flex w-5/12 bg-sidebar border-r border-default relative overflow-hidden flex-col justify-between p-12">
                {/* Background Pattern */}
                <div className="absolute inset-0 z-0 opacity-10">
                    <svg className="w-full h-full" viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true">
                        <path d="M0 100 C 20 0 50 0 100 100 Z" fill="url(#grad_cyber)" />
                        <defs>
                            <linearGradient id="grad_cyber" x1="0%" y1="0%" x2="100%" y2="0%">
                                <stop offset="0%" style={{ stopColor: 'var(--primary)', stopOpacity: 1 }} />
                                <stop offset="100%" style={{ stopColor: 'var(--secondary)', stopOpacity: 1 }} />
                            </linearGradient>
                        </defs>
                    </svg>
                </div>

                <div className="z-10 mt-10">
                    <div className="flex items-center gap-4 mb-10">
                        <div className="w-12 h-12 rounded-xl bg-primary flex items-center justify-center shadow-lg shadow-primary/20 rotate-3">
                            <span className="font-display font-black text-2xl text-white">E</span>
                        </div>
                        <span className="text-2xl font-display font-bold text-main tracking-tight uppercase">ERP Matrix</span>
                    </div>

                    <h1 className="text-5xl font-display font-black text-main leading-[1.1] mb-8 tracking-tighter">
                        {title}
                    </h1>
                    <p className="text-secondary text-lg leading-relaxed max-w-md opacity-70">
                        {description}
                    </p>
                </div>

                <div className="z-10 text-slate-500 text-sm">
                    &copy; {new Date().getFullYear()} BizzAI Enterprise Solutions.
                </div>
            </div>

            {/* RIGHT SIDE - FORM PANEL */}
            <div className="w-full lg:w-7/12 flex items-center justify-center p-6 lg:p-12 overflow-y-auto bg-app">
                <div className="w-full max-w-md space-y-10">
                    <div className="text-center lg:text-left transition-all">
                        <h2 className="text-4xl font-display font-black tracking-tighter text-main">{subtitle}</h2>
                        {secondarySubtitle && (
                            <p className="mt-2 text-sm font-bold text-secondary uppercase tracking-[0.15em] opacity-60">
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
