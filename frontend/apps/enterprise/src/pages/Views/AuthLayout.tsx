import React, { ReactNode } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ShieldCheck, Fingerprint, Lock, Zap } from 'lucide-react';

interface AuthLayoutProps {
    children: ReactNode;
    title: string;
    subtitle: string;
    secondarySubtitle?: string;
    description: string;
}

const AuthLayout: React.FC<AuthLayoutProps> = ({ children, title, subtitle, secondarySubtitle, description }) => {
    return (
        <div className="min-h-screen flex bg-[#030408] text-white transition-colors duration-300 font-[Inter,system-ui] overflow-hidden relative selection:bg-indigo-500/30">
            {/* === DEEP SPACE BACKGROUND === */}
            <div className="absolute inset-0 pointer-events-none overflow-hidden">
                {/* Primary nebula glows */}
                <div className="absolute -top-[20%] -left-[10%] w-[80%] h-[80%] bg-indigo-600/[0.08] blur-[180px] rounded-full animate-pulse-slow" />
                <div className="absolute -bottom-[20%] -right-[10%] w-[70%] h-[70%] bg-violet-600/[0.06] blur-[160px] rounded-full animate-pulse-slow" style={{ animationDelay: '2s' }} />
                
                {/* Secondary accent pulses */}
                <div className="absolute top-1/4 right-1/4 w-[30%] h-[30%] bg-sky-500/[0.03] blur-[120px] rounded-full animate-float" />
                <div className="absolute bottom-1/4 left-1/4 w-[25%] h-[25%] bg-emerald-500/[0.02] blur-[100px] rounded-full animate-float" style={{ animationDelay: '4s' }} />

                {/* Tactical grid with mesh noise */}
                <div className="absolute inset-0 opacity-[0.03] mix-blend-overlay" style={{
                    backgroundImage: 'radial-gradient(circle at 1px 1px, rgba(255,255,255,0.15) 1px, transparent 0)',
                    backgroundSize: '32px 32px'
                }} />
                
                {/* Grainy Texture */}
                <svg className="absolute inset-0 w-full h-full opacity-[0.15] pointer-events-none mix-blend-soft-light">
                    <filter id="noiseFilter">
                        <feTurbulence type="fractalNoise" baseFrequency="0.65" numOctaves="3" stitchTiles="stitch" />
                    </filter>
                    <rect width="100%" height="100%" filter="url(#noiseFilter)" />
                </svg>
            </div>

            {/* === LEFT PANEL — SECURITY BRANDING === */}
            <div className="hidden lg:flex w-[45%] xl:w-[42%] relative flex-col justify-between p-12 xl:p-16 z-20">
                {/* Vertical separator glow */}
                <div className="absolute inset-y-12 right-0 w-px bg-gradient-to-b from-transparent via-white/5 to-transparent" />

                <motion.div
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 1, ease: [0.22, 1, 0.36, 1] }}
                >
                    {/* Premium Logo */}
                    <div className="flex items-center gap-5 mb-20 group">
                        <div className="relative">
                            <div className="absolute -inset-2 bg-indigo-500/20 blur-xl opacity-0 group-hover:opacity-100 transition-opacity duration-700 rounded-full" />
                            <div className="relative w-12 h-12 rounded-2xl bg-gradient-to-br from-indigo-500 via-indigo-600 to-violet-700 flex items-center justify-center shadow-2xl shadow-indigo-500/30 ring-1 ring-white/20 overflow-hidden transform group-hover:scale-105 transition-transform duration-500">
                                <span className="font-black text-2xl text-white tracking-tighter italic">E</span>
                                <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent" />
                            </div>
                        </div>
                        <div className="space-y-0.5">
                            <span className="text-xl font-black text-white tracking-tighter block leading-none uppercase italic">ERP <span className="text-indigo-500">Matrix</span></span>
                            <span className="text-[9px] font-black text-white/20 uppercase tracking-[0.4em] flex items-center gap-2">
                                <div className="w-1 h-1 bg-indigo-500 rounded-full animate-pulse" />
                                Secure Nexus
                            </span>
                        </div>
                    </div>

                    {/* Dynamic Title Cluster */}
                    <div className="max-w-md space-y-8">
                        <div className="space-y-4">
                            <h1 className="text-5xl xl:text-6xl font-black text-white leading-[0.95] tracking-tighter italic uppercase underline decoration-indigo-500/30 decoration-8 underline-offset-8">
                                {title}
                            </h1>
                            <div className="h-1.5 w-24 bg-gradient-to-r from-indigo-500 to-transparent rounded-full" />
                        </div>
                        <p className="text-white/40 text-base xl:text-lg leading-relaxed font-bold max-w-sm uppercase italic tracking-tight">
                            {description}
                        </p>
                    </div>
                </motion.div>

                {/* Security Pulse Indicator */}
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.8, duration: 1 }}
                    className="space-y-8"
                >
                    <div className="grid grid-cols-2 gap-4">
                        <div className="p-5 rounded-[2rem] bg-white/[0.02] border border-white/[0.05] backdrop-blur-xl relative overflow-hidden group/card hover:bg-white/[0.04] transition-colors">
                            <div className="absolute top-0 right-0 p-4 opacity-5 group-hover/card:scale-110 transition-transform duration-700">
                                <ShieldCheck className="w-16 h-16 text-emerald-500" />
                            </div>
                            <ShieldCheck className="w-5 h-5 text-emerald-500 mb-4" />
                            <p className="text-[9px] font-black text-white/20 uppercase tracking-[0.2em] mb-1">Encryption</p>
                            <p className="text-xs font-black text-white/80 italic">AES-256 QUANTUM</p>
                        </div>
                        <div className="p-5 rounded-[2rem] bg-white/[0.02] border border-white/[0.05] backdrop-blur-xl relative overflow-hidden group/card hover:bg-white/[0.04] transition-colors font-mono">
                            <div className="absolute top-0 right-0 p-4 opacity-5 group-hover/card:scale-110 transition-transform duration-700">
                                <Lock className="w-16 h-16 text-indigo-500" />
                            </div>
                            <Fingerprint className="w-5 h-5 text-indigo-500 mb-4" />
                            <p className="text-[9px] font-black text-white/20 uppercase tracking-[0.2em] mb-1">Identity</p>
                            <p className="text-xs font-black text-white/80 italic">BIOMETRIC_SYNC</p>
                        </div>
                    </div>
                    
                    <div className="flex items-center justify-between">
                        <p className="text-white/10 text-[10px] font-black uppercase tracking-[0.3em]">
                            &copy; {new Date().getFullYear()} BizzAI Enterprise // V4.0.2
                        </p>
                        <div className="flex gap-2">
                             {[1, 2, 3].map(i => (
                                 <div key={i} className="w-1.5 h-1.5 rounded-full bg-indigo-500/20 animate-pulse" style={{ animationDelay: `${i * 0.2}s` }} />
                             ))}
                        </div>
                    </div>
                </motion.div>
            </div>

            {/* === RIGHT PANEL — INTERACTIVE SURFACE === */}
            <div className="w-full lg:w-[55%] xl:w-[58%] flex items-center justify-center p-6 sm:p-10 lg:p-16 z-30 overflow-y-auto min-h-screen relative">
                {/* Decorative floating elements for the form side */}
                <div className="absolute top-1/4 right-0 w-64 h-64 bg-indigo-500/5 blur-[120px] rounded-full pointer-events-none" />
                <div className="absolute bottom-1/4 left-0 w-48 h-48 bg-violet-500/5 blur-[100px] rounded-full pointer-events-none" />

                <motion.div
                    className="w-full max-w-[480px]"
                    initial={{ opacity: 0, y: 30, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1], delay: 0.2 }}
                >
                    {/* Luxury Glass Portal */}
                    <div className="bg-white/[0.015] backdrop-blur-3xl border border-white/[0.06] rounded-[3rem] p-8 sm:p-12 shadow-[0_24px_80px_rgba(0,0,0,0.5)] relative overflow-hidden group/form">
                        {/* Hidden Glow that appears on hover/interaction */}
                        <div className="absolute -inset-24 bg-gradient-to-tr from-indigo-500/[0.03] via-transparent to-violet-500/[0.03] opacity-0 group-hover/form:opacity-100 transition-opacity duration-1000 pointer-events-none" />
                        
                        <div className="relative z-10 space-y-10">
                            <div className="space-y-4">
                                {/* Mobile-only Brand Header */}
                                <div className="lg:hidden flex items-center gap-4 mb-8">
                                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-violet-700 flex items-center justify-center shadow-xl">
                                        <span className="font-black text-lg text-white">E</span>
                                    </div>
                                    <span className="text-xs font-black text-white/40 tracking-[0.3em] uppercase italic">ERP Matrix</span>
                                </div>

                                <h2 className="text-3xl sm:text-4xl font-black tracking-tighter text-white leading-none uppercase italic">{subtitle}</h2>
                                <div className="flex items-center gap-3">
                                    <div className="h-px w-8 bg-indigo-500" />
                                    <p className="text-[10px] font-black text-indigo-500 uppercase tracking-[0.25em] italic">
                                        {secondarySubtitle || "Secure Session Initialization"}
                                    </p>
                                </div>
                            </div>

                            <AnimatePresence mode="wait">
                                {children}
                            </AnimatePresence>
                        </div>
                    </div>

                    {/* Interaction Footer Help */}
                    <motion.div 
                        initial={{ opacity: 0 }} 
                        animate={{ opacity: 1 }} 
                        transition={{ delay: 1.2 }}
                        className="mt-10 flex items-center justify-center gap-6"
                    >
                        <div className="flex items-center gap-2 group/help cursor-help">
                            <Zap className="w-3.5 h-3.5 text-amber-500 animate-pulse" />
                            <span className="text-[10px] font-black text-white/15 uppercase tracking-widest group-hover/help:text-white/30 transition-colors">Low Latency</span>
                        </div>
                        <div className="w-1 h-1 bg-white/5 rounded-full" />
                        <div className="flex items-center gap-2 group/help cursor-help">
                            <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
                            <span className="text-[10px] font-black text-white/15 uppercase tracking-widest group-hover/help:text-white/30 transition-colors">Audit Active</span>
                        </div>
                    </motion.div>
                </motion.div>
            </div>

            <style>{`
                @keyframes pulse-slow {
                    0%, 100% { opacity: 0.1; transform: scale(1); }
                    50% { opacity: 0.15; transform: scale(1.05); }
                }
                @keyframes float {
                    0%, 100% { transform: translate(0, 0); }
                    50% { transform: translate(20px, -20px); }
                }
                .animate-pulse-slow { animation: pulse-slow 10s infinite ease-in-out; }
                .animate-float { animation: float 15s infinite ease-in-out; }
            `}</style>
        </div>
    );
};

export default AuthLayout;
