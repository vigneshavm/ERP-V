"use client";

import React from 'react';
import { User, Briefcase, ChevronRight, Zap, Building2 } from 'lucide-react';
import { useAuthStore } from '../store/authStore';

interface SelectionPageProps {
  onSelect: (type: 'personal' | 'business' | 'enterprise') => void;
}

export const SelectionPage: React.FC<SelectionPageProps> = ({ onSelect }) => {
  const logout = useAuthStore((state) => state.logout);

  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-[#0a0a0a] relative overflow-hidden p-6 font-sans">
      {/* Background Decor (Matching Login) */}
      <div className="absolute top-[-20%] right-[-10%] w-[60%] h-[60%] bg-blue-600/10 blur-[150px] rounded-full pointer-events-none" />
      <div className="absolute bottom-[-20%] left-[-10%] w-[60%] h-[60%] bg-purple-600/10 blur-[150px] rounded-full pointer-events-none" />

      <div className="relative z-10 w-full max-w-5xl flex flex-col items-center animate-in fade-in duration-1000">
        <div className="mb-16 text-center space-y-6">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-400 text-xs font-bold uppercase tracking-widest mb-2 shadow-sm shadow-blue-500/5">
            <Zap size={14} className="animate-pulse" /> Successful Authentication
          </div>
          <h1 className="text-5xl md:text-6xl font-black text-white tracking-tight leading-tight">
            Where would you like to <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-purple-500">start today?</span>
          </h1>
          <p className="text-gray-400 text-lg max-w-lg mx-auto leading-relaxed">
            Your personalized command center is ready. Choose a workspace to begin managing your enterprise operations.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 w-full">
          {/* Personal Card */}
          <button
            onClick={() => onSelect('personal')}
            className="group relative flex flex-col p-1 bg-white/[0.03] backdrop-blur-sm rounded-[32px] border border-white/10 hover:border-blue-500/50 transition-all duration-500 overflow-hidden text-left hover:shadow-2xl hover:shadow-blue-500/10 hover:-translate-y-2"
          >
            <div className="absolute inset-0 bg-blue-600/0 group-hover:bg-blue-600/[0.02] transition-colors duration-500" />
            <div className="relative p-10 space-y-8">
              <div className="w-16 h-16 bg-blue-600/20 rounded-2xl flex items-center justify-center text-blue-400 group-hover:scale-110 group-hover:rotate-3 transition-transform duration-500 shadow-inner">
                <User size={32} />
              </div>
              <div className="space-y-3">
                <h2 className="text-2xl font-bold text-white group-hover:text-blue-400 transition-colors">Personal Budget</h2>
                <p className="text-gray-400 leading-relaxed text-sm">
                  Track daily expenses, set saving goals, and visualize financial health with the AI-assisted Budget Planner.
                </p>
              </div>
              <div className="pt-4 flex items-center text-blue-400 font-bold text-sm group-hover:translate-x-2 transition-transform">
                Go to Planner <ChevronRight size={18} />
              </div>
            </div>
          </button>

          {/* Business Card */}
          <button
            onClick={() => onSelect('business')}
            className="group relative flex flex-col p-1 bg-white/[0.03] backdrop-blur-sm rounded-[32px] border border-white/10 hover:border-purple-500/50 transition-all duration-500 overflow-hidden text-left hover:shadow-2xl hover:shadow-purple-500/10 hover:-translate-y-2"
          >
            <div className="absolute inset-0 bg-purple-600/0 group-hover:bg-purple-600/[0.02] transition-colors duration-500" />
            <div className="relative p-10 space-y-8">
              <div className="w-16 h-16 bg-purple-600/20 rounded-2xl flex items-center justify-center text-purple-400 group-hover:scale-110 group-hover:-rotate-3 transition-transform duration-500 shadow-inner">
                <Briefcase size={32} />
              </div>
              <div className="space-y-3">
                <h2 className="text-2xl font-bold text-white group-hover:text-purple-400 transition-colors">Business Store</h2>
                <p className="text-gray-400 leading-relaxed text-sm">
                  Full control over inventory, sales tracking, and multi-channel store operations with integrated POS.
                </p>
              </div>
              <div className="pt-4 flex items-center text-purple-400 font-bold text-sm group-hover:translate-x-2 transition-transform">
                Open Store Manager <ChevronRight size={18} />
              </div>
            </div>
          </button>

          {/* Enterprise Card */}
          <button
            onClick={() => onSelect('enterprise')}
            className="group relative flex flex-col p-1 bg-white/[0.03] backdrop-blur-sm rounded-[32px] border border-white/10 hover:border-amber-500/50 transition-all duration-500 overflow-hidden text-left hover:shadow-2xl hover:shadow-amber-500/10 hover:-translate-y-2"
          >
            <div className="absolute inset-0 bg-amber-600/0 group-hover:bg-amber-600/[0.02] transition-colors duration-500" />
            <div className="relative p-10 space-y-8">
              <div className="w-16 h-16 bg-amber-600/20 rounded-2xl flex items-center justify-center text-amber-400 group-hover:scale-110 group-hover:rotate-6 transition-transform duration-500 shadow-inner">
                <Building2 size={32} />
              </div>
              <div className="space-y-3">
                <h2 className="text-2xl font-bold text-white group-hover:text-amber-400 transition-colors">Enterprise</h2>
                <p className="text-gray-400 leading-relaxed text-sm">
                  Advanced corporate ERP covering procurement, accounting, human resources, and multi-tenant logic.
                </p>
              </div>
              <div className="pt-4 flex items-center text-amber-400 font-bold text-sm group-hover:translate-x-2 transition-transform">
                Enter Management <ChevronRight size={18} />
              </div>
            </div>
          </button>
        </div>

        <button 
          onClick={() => logout()}
          className="mt-16 group flex items-center gap-2 text-gray-500 hover:text-white text-sm font-semibold transition-all"
        >
          <span className="w-8 h-px bg-white/10 group-hover:w-12 transition-all"></span>
          Securely Sign Out
        </button>
      </div>
    </div>
  );
};
