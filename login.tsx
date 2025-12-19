
import React, { useState } from 'react';
import { useDispatch } from 'react-redux';
import { login } from './store';
import { Box, TrendingUp, ShieldCheck, Lock, ArrowRight } from 'lucide-react';

const Login: React.FC = () => {
  const dispatch = useDispatch();
  const [pin, setPin] = useState('');

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (pin === '0000') {
       dispatch(login({ user: 'Owner', role: 'Owner' }));
    } else if (pin === '1111') {
       dispatch(login({ user: 'Staff', role: 'Staff' }));
    } else {
       setPin('');
       alert('Invalid PIN');
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4 lg:p-0 relative overflow-hidden">
        {/* Abstract Background Elements */}
        <div className="absolute top-[-20%] right-[-10%] w-[600px] h-[600px] bg-indigo-600/20 rounded-full blur-[120px] pointer-events-none"></div>
        <div className="absolute bottom-[-20%] left-[-10%] w-[500px] h-[500px] bg-emerald-600/10 rounded-full blur-[100px] pointer-events-none"></div>

        <div className="max-w-5xl w-full bg-slate-900/80 backdrop-blur-xl rounded-3xl shadow-2xl border border-slate-800 overflow-hidden flex flex-col lg:flex-row h-auto lg:h-[650px] relative z-10">
          
          {/* Left Side: Visuals */}
          <div className="lg:w-1/2 relative bg-slate-800 hidden lg:flex flex-col">
            <div className="absolute inset-0">
                <img 
                    src="https://images.unsplash.com/photo-1460925895917-afdab827c52f?q=80&w=2426&auto=format&fit=crop" 
                    alt="Analytics Dashboard" 
                    className="w-full h-full object-cover opacity-60 mix-blend-overlay"
                />
                <div className="absolute inset-0 bg-gradient-to-b from-transparent via-slate-900/60 to-slate-900"></div>
            </div>
            
            <div className="relative z-10 p-12 mt-auto">
                <div className="flex items-center gap-3 mb-6">
                    <div className="w-12 h-12 bg-indigo-600 rounded-xl flex items-center justify-center shadow-lg shadow-indigo-500/30">
                        <Box className="w-7 h-7 text-white" />
                    </div>
                    <span className="text-3xl font-bold text-white tracking-tight">Enterprise<span className="text-indigo-400">Mgr</span></span>
                </div>
                <h2 className="text-3xl font-bold text-white mb-4 leading-tight">Manage your business with intelligent insights.</h2>
                <div className="flex gap-4 mt-8">
                    <div className="flex items-center gap-2 text-slate-300 text-sm">
                        <div className="p-1 bg-emerald-500/20 rounded-full"><TrendingUp size={14} className="text-emerald-400" /></div>
                        <span>Real-time Analytics</span>
                    </div>
                    <div className="flex items-center gap-2 text-slate-300 text-sm">
                        <div className="p-1 bg-indigo-500/20 rounded-full"><ShieldCheck size={14} className="text-indigo-400" /></div>
                        <span>Secure Access</span>
                    </div>
                </div>
            </div>
          </div>

          {/* Right Side: Form */}
          <div className="lg:w-1/2 p-8 lg:p-16 flex flex-col justify-center bg-slate-900 relative">
            <div className="mb-10 text-center lg:text-left">
                <div className="lg:hidden flex items-center justify-center gap-2 mb-6 text-white font-bold text-xl">
                    <Box className="w-6 h-6 text-indigo-500" /> EnterpriseMgr
                </div>
                <h1 className="text-2xl font-bold text-white mb-2">Welcome Back</h1>
                <p className="text-slate-400 text-sm">Enter your secure PIN to access the terminal.</p>
            </div>

            <form onSubmit={handleLogin} className="space-y-8 max-w-sm mx-auto lg:mx-0 w-full">
                <div className="space-y-2">
                    <label className="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1">
                        <Lock size={12} /> Security PIN
                    </label>
                    <input 
                        type="password" 
                        maxLength={4} 
                        value={pin} 
                        autoFocus 
                        onChange={(e) => setPin(e.target.value)} 
                        placeholder="••••" 
                        className="w-full bg-slate-800/50 border border-slate-700 focus:border-indigo-500 rounded-xl py-4 px-6 text-center text-4xl font-black text-white tracking-[0.5em] focus:outline-none focus:ring-4 focus:ring-indigo-500/10 transition-all placeholder:text-slate-700" 
                    />
                </div>
                <button 
                    type="submit" 
                    className="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-bold py-4 rounded-xl shadow-lg shadow-indigo-500/20 active:scale-95 transition-all flex items-center justify-center gap-2 group"
                >
                    Unlock Terminal
                    <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                </button>
            </form>

            <div className="mt-12 pt-6 border-t border-slate-800 flex justify-between text-[10px] font-medium text-slate-500 uppercase px-2">
                <div>
                    <span className="block text-slate-600 mb-1">Owner Access</span>
                    <span className="bg-slate-800 px-2 py-1 rounded text-slate-300 font-mono tracking-wider">0000</span>
                </div>
                <div className="text-right">
                    <span className="block text-slate-600 mb-1">Staff Access</span>
                    <span className="bg-slate-800 px-2 py-1 rounded text-slate-300 font-mono tracking-wider">1111</span>
                </div>
            </div>
          </div>
        </div>
      </div>
  );
};

export default Login;
