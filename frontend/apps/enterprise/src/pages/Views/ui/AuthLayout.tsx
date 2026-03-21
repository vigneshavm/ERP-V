import React, { ReactNode } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ShieldCheck, Fingerprint } from 'lucide-react';

interface AuthLayoutProps {
    children: ReactNode;
    title: string;
    subtitle: string;
    secondarySubtitle?: string;
    description: string;
}

const AuthLayout: React.FC<AuthLayoutProps> = ({ children, title, subtitle, secondarySubtitle, description }) => {
    return (
        <div className="min-h-screen flex bg-[var(--erp-bg)] text-main transition-colors duration-300 font-[system-ui] overflow-hidden relative">
            {/* === AMBIENT BACKGROUND GRADIENTS === */}
            <div className="absolute inset-0 pointer-events-none overflow-hidden">
                <div className="absolute -top-[30%] -left-[15%] w-[70%] h-[70%] bg-indigo-600/[0.07] blur-[160px] rounded-full animate-pulse" style={{ animationDuration: '8s' }} />
                <div className="absolute -bottom-[30%] -right-[15%] w-[60%] h-[60%] bg-violet-600/[0.06] blur-[140px] rounded-full animate-pulse" style={{ animationDuration: '12s' }} />
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[40%] h-[40%] bg-sky-600/[0.04] blur-[120px] rounded-full" />
                {/* Subtle grid pattern */}
                <div className="absolute inset-0 opacity-[0.015]" style={{
                    backgroundImage: 'linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)',
                    backgroundSize: '64px 64px'
                }} />
            </div>

            {/* === LEFT PANEL — BRAND SHOWCASE === */}
            <div className="hidden lg:flex w-[45%] xl:w-[42%] relative flex-col justify-between p-10 xl:p-14 z-10">
                {/* Decorative border glow */}
                <div className="absolute inset-y-8 right-0 w-px bg-gradient-to-b from-transparent via-indigo-500/20 to-transparent" />

                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
                >
                    {/* Logo */}
                    <div className="flex items-center gap-4 mb-16">
                        <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center shadow-lg shadow-indigo-500/20 ring-1 ring-white/10">
                            <span className="font-black text-xl text-main tracking-tighter">E</span>
                        </div>
                        <div>
                            <span className="text-lg font-bold text-main tracking-tight block leading-none">ERP Matrix</span>
                            <span className="text-[9px] font-bold text-muted uppercase tracking-[0.25em]">Enterprise Platform</span>
                        </div>
                    </div>

                    {/* Title block */}
                    <div className="max-w-sm">
                        <h1 className="text-4xl xl:text-5xl font-black text-main leading-[1.08] tracking-tight mb-6">
                            {title}
                        </h1>
                        <p className="text-main/35 text-sm xl:text-[15px] leading-relaxed font-medium max-w-xs">
                            {description}
                        </p>
                    </div>
                </motion.div>

                {/* Bottom badges */}
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.5, duration: 1 }}
                    className="space-y-6"
                >
                    <div className="flex items-center gap-6">
                        <div className="flex items-center gap-2.5 px-3.5 py-2 bg-white/[0.03] border border-white/[0.06] rounded-xl backdrop-blur-sm">
                            <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                            <span className="text-[9px] font-bold text-main/40 uppercase tracking-[0.2em]">256-bit SSL</span>
                        </div>
                        <div className="flex items-center gap-2.5 px-3.5 py-2 bg-white/[0.03] border border-white/[0.06] rounded-xl backdrop-blur-sm">
                            <Fingerprint className="w-3.5 h-3.5 text-indigo-400" />
                            <span className="text-[9px] font-bold text-main/40 uppercase tracking-[0.2em]">Enterprise Auth</span>
                        </div>
                    </div>
                    <p className="text-muted text-[11px] font-medium">
                        &copy; {new Date().getFullYear()} BizzAI Enterprise Solutions. All rights reserved.
                    </p>
                </motion.div>
            </div>

            {/* === RIGHT PANEL — FORM SURFACE === */}
            <div className="w-full lg:w-[55%] xl:w-[58%] flex items-center justify-center p-5 sm:p-8 lg:p-12 xl:p-16 z-10 overflow-y-auto min-h-screen">
                <motion.div
                    className="w-full max-w-[440px]"
                    initial={{ opacity: 0, y: 24, scale: 0.98 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1], delay: 0.1 }}
                >
                    {/* Glass card */}
                    <div className="bg-white/[0.025] backdrop-blur-2xl border border-white/[0.06] rounded-3xl xl:rounded-[2rem] p-7 sm:p-9 xl:p-10 shadow-2xl shadow-black/20">
                        <div className="mb-8">
                            {/* Mobile logo */}
                            <div className="lg:hidden flex items-center gap-3 mb-6">
                                <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center">
                                    <span className="font-black text-base text-main">E</span>
                                </div>
                                <span className="text-sm font-bold text-main/60 tracking-tight">ERP Matrix</span>
                            </div>

                            <h2 className="text-2xl sm:text-3xl font-black tracking-tight text-main leading-tight">{subtitle}</h2>
                            {secondarySubtitle && (
                                <p className="mt-2 text-[10px] font-bold text-muted uppercase tracking-[0.18em]">
                                    {secondarySubtitle}
                                </p>
                            )}
                        </div>

                        <AnimatePresence mode="wait">
                            {children}
                        </AnimatePresence>
                    </div>

                    {/* Mobile footer */}
                    <p className="lg:hidden mt-6 text-center text-main/15 text-[10px] font-medium">
                        &copy; {new Date().getFullYear()} BizzAI Enterprise Solutions
                    </p>
                </motion.div>
            </div>
        </div>
    );
};

export default AuthLayout;
