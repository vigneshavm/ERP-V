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
    <div className="min-h-screen w-full flex items-center justify-center bg-[#0a0a0a] relative overflow-hidden p-6">
      {/* Background Decor */}
      <div className="absolute top-[-20%] right-[-10%] w-[60%] h-[60%] bg-blue-600/10 blur-[150px] rounded-full" />
      <div className="absolute bottom-[-20%] left-[-10%] w-[60%] h-[60%] bg-purple-600/10 blur-[150px] rounded-full" />

      <div className="relative z-10 w-full max-w-4xl flex flex-col items-center">
        <div className="mb-12 text-center space-y-4">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-400 text-xs font-bold uppercase tracking-widest mb-2 animate-bounce">
            <Zap size={14} /> Successful Authentication
          </div>
          <h1 className="text-4xl md:text-5xl font-black text-white tracking-tight">
            Where would you like to <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-purple-500">start?</span>
          </h1>
          <p className="text-gray-400 text-lg max-w-md mx-auto">
            Choose your workspace to begin managing your finances or business operations.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 w-full">
          {/* Personal Card */}
          <button
            onClick={() => onSelect('personal')}
            className="group relative flex flex-col p-1 bg-gradient-to-br from-white/10 to-transparent rounded-3xl border border-white/10 hover:border-blue-500/50 transition-all duration-500 overflow-hidden text-left"
          >
            <div className="absolute inset-0 bg-blue-600/0 group-hover:bg-blue-600/5 transition-colors duration-500" />
            <div className="relative p-8 space-y-6">
              <div className="w-16 h-16 bg-blue-600/20 rounded-2xl flex items-center justify-center text-blue-400 group-hover:scale-110 group-hover:rotate-3 transition-transform duration-500">
                <User size={32} />
              </div>
              <div className="space-y-2">
                <h2 className="text-2xl font-bold text-white group-hover:text-blue-400 transition-colors">Personal Budget</h2>
                <p className="text-gray-400 leading-relaxed">
                  Track your daily expenses, set saving goals, and visualize your financial health with the Budget Planner.
                </p>
              </div>
              <div className="pt-4 flex items-center text-blue-400 font-bold group-hover:translate-x-2 transition-transform">
                Go to Planner <ChevronRight size={18} />
              </div>
            </div>
          </button>

          {/* Business Card */}
          <button
            onClick={() => onSelect('business')}
            className="group relative flex flex-col p-1 bg-gradient-to-br from-white/10 to-transparent rounded-3xl border border-white/10 hover:border-purple-500/50 transition-all duration-500 overflow-hidden text-left"
          >
            <div className="absolute inset-0 bg-purple-600/0 group-hover:bg-purple-600/5 transition-colors duration-500" />
            <div className="relative p-8 space-y-6">
              <div className="w-16 h-16 bg-purple-600/20 rounded-2xl flex items-center justify-center text-purple-400 group-hover:scale-110 group-hover:-rotate-3 transition-transform duration-500">
                <Briefcase size={32} />
              </div>
              <div className="space-y-2">
                <h2 className="text-2xl font-bold text-white group-hover:text-purple-400 transition-colors">Business Store</h2>
                <p className="text-gray-400 leading-relaxed">
                  Manage your inventory, track sales, and oversee store operations in the Business Online Store module.
                </p>
              </div>
              <div className="pt-4 flex items-center text-purple-400 font-bold group-hover:translate-x-2 transition-transform">
                Open Store Manager <ChevronRight size={18} />
              </div>
            </div>
          </button>

          {/* Enterprise Card */}
          <button
            onClick={() => onSelect('enterprise')}
            className="group relative flex flex-col p-1 bg-gradient-to-br from-white/10 to-transparent rounded-3xl border border-white/10 hover:border-amber-500/50 transition-all duration-500 overflow-hidden text-left"
          >
            <div className="absolute inset-0 bg-amber-600/0 group-hover:bg-amber-600/5 transition-colors duration-500" />
            <div className="relative p-8 space-y-6">
              <div className="w-16 h-16 bg-amber-600/20 rounded-2xl flex items-center justify-center text-amber-400 group-hover:scale-110 group-hover:rotate-6 transition-transform duration-500">
                <Building2 size={32} />
              </div>
              <div className="space-y-2">
                <h2 className="text-2xl font-bold text-white group-hover:text-amber-400 transition-colors">Enterprise</h2>
                <p className="text-gray-400 leading-relaxed">
                  Advanced corporate management, multi-tenant coordination, and high-level administrative overviews.
                </p>
              </div>
              <div className="pt-4 flex items-center text-amber-400 font-bold group-hover:translate-x-2 transition-transform">
                Enter Management <ChevronRight size={18} />
              </div>
            </div>
          </button>
        </div>

        <button 
          onClick={() => logout()}
          className="mt-12 text-gray-500 hover:text-white text-sm transition-colors"
        >
          Signout
        </button>
      </div>
    </div>
  );
};
