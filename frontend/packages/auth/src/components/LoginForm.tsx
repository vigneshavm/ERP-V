"use client";

import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useLogin } from '../api/authApi';
import { Loader2, AlertCircle, Zap, ShieldCheck, ArrowRight } from 'lucide-react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

const loginSchema = z.object({
  email: z.string().min(3, 'Email or username must be at least 3 characters'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
});

type LoginFormValues = z.infer<typeof loginSchema>;

export const LoginForm: React.FC = () => {
  const [loginSuccess, setLoginSuccess] = useState(false);
  const { mutate: login, isPending, error, isError } = useLogin();

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
  });

  const onSubmit = (data: LoginFormValues) => {
    const sanitizedEmail = data.email.replace(/^["']|["']$/g, '').trim();
    login({ username: sanitizedEmail, password: data.password }, {
      onSuccess: () => {
        setLoginSuccess(true);
      }
    });
  };

  return (
    <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center p-4 font-sans text-white overflow-hidden relative">
      {/* Background Glows (Matching Shell) */}
      <div className="absolute top-[-20%] right-[-10%] w-[60%] h-[60%] bg-blue-600/10 blur-[150px] rounded-full pointer-events-none" />
      <div className="absolute bottom-[-20%] left-[-10%] w-[60%] h-[60%] bg-purple-600/10 blur-[150px] rounded-full pointer-events-none" />

      <div className="w-full max-w-[1100px] flex flex-col lg:flex-row gap-12 lg:gap-20 items-center justify-between relative z-10">
        
        {/* LEFT COLUMN: HERO & BRANDING */}
        <div className="flex-1 text-center lg:text-left space-y-8 animate-in fade-in slide-in-from-left-10 duration-1000">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-400 text-xs font-bold uppercase tracking-widest mb-4">
             <Zap size={14} /> AI-Powered ERP Ecosystem
          </div>
          
          <div className="space-y-4">
            <h1 className="text-5xl lg:text-7xl font-black leading-[1.05] tracking-tight">
              Manage assets <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-purple-500">
                captured in flow.
              </span>
            </h1>
            <p className="text-gray-400 text-lg lg:text-xl max-w-lg mx-auto lg:mx-0 leading-relaxed font-normal">
              The next generation of enterprise resource planning. Fully integrated, multi-tenant, and driven by intelligence.
            </p>
          </div>

          <div className="hidden lg:flex items-center gap-8 pt-8 border-t border-white/5">
             <div className="flex flex-col">
                <span className="text-2xl font-bold">100+</span>
                <span className="text-gray-500 text-sm uppercase tracking-wider font-semibold">Integrations</span>
             </div>
             <div className="flex flex-col">
                <span className="text-2xl font-bold">99.9%</span>
                <span className="text-gray-500 text-sm uppercase tracking-wider font-semibold">Uptime</span>
             </div>
             <div className="flex flex-col">
                <span className="text-2xl font-bold">AES-256</span>
                <span className="text-gray-500 text-sm uppercase tracking-wider font-semibold">Encryption</span>
             </div>
          </div>
        </div>

        {/* RIGHT COLUMN: LOGIN FORM CARD */}
        <div className="w-full max-w-[440px] animate-in fade-in slide-in-from-right-10 duration-1000">
          <div className="relative group">
            {/* Ambient Card Glow */}
            <div className="absolute -inset-0.5 bg-gradient-to-r from-blue-500 to-purple-600 rounded-3xl blur opacity-20 group-hover:opacity-30 transition duration-1000 group-hover:duration-200"></div>
            
            <div className="relative bg-[#111111]/80 backdrop-blur-xl border border-white/10 p-8 lg:p-10 rounded-3xl shadow-2xl space-y-8">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-2xl font-bold tracking-tight">Login</h2>
                  <p className="text-gray-500 text-sm">Enter your credentials below</p>
                </div>
                <div className="w-12 h-12 bg-white/5 rounded-2xl flex items-center justify-center border border-white/10 text-blue-400 shadow-inner">
                  <ShieldCheck size={24} />
                </div>
              </div>

              <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                {isError && (
                  <div className="p-4 text-xs font-semibold text-[#ff4d4d] bg-[#ff4d4d]/10 border border-[#ff4d4d]/20 rounded-2xl flex items-center gap-3 animate-shake">
                    <AlertCircle className="w-4 h-4 shrink-0" />
                    {(error as Error).message}
                  </div>
                )}

                <div className="space-y-3">
                  <div className="relative group/input">
                    <input
                      {...register('email')}
                      type="text"
                      id="email_input"
                      placeholder="Email or Username"
                      className={cn(
                        "w-full h-[54px] px-5 bg-white/5 border border-white/10 rounded-2xl text-[16px] focus:outline-none focus:border-blue-500/50 focus:bg-white/10 focus:ring-4 focus:ring-blue-500/5 transition-all outline-none placeholder:text-gray-600",
                        errors.email && "border-red-500/50 focus:border-red-500/50 focus:ring-red-500/5"
                      )}
                    />
                    {errors.email && <p className="text-[11px] text-red-400 mt-1.5 ml-1 font-medium">{errors.email.message}</p>}
                  </div>
                  
                  <div className="relative group/input">
                    <input
                      {...register('password')}
                      type="password"
                      id="pass_input"
                      placeholder="Password"
                      className={cn(
                        "w-full h-[54px] px-5 bg-white/5 border border-white/10 rounded-2xl text-[16px] focus:outline-none focus:border-blue-500/50 focus:bg-white/10 focus:ring-4 focus:ring-blue-500/5 transition-all outline-none placeholder:text-gray-600",
                        errors.password && "border-red-500/50 focus:border-red-500/50 focus:ring-red-500/5"
                      )}
                    />
                    {errors.password && <p className="text-[11px] text-red-500 mt-1.5 ml-1 font-medium">{errors.password.message}</p>}
                  </div>
                </div>

                <div className="flex items-center justify-between text-xs px-1">
                  <label className="flex items-center gap-2 text-gray-400 cursor-pointer select-none">
                    <input type="checkbox" className="w-4 h-4 rounded border-white/10 bg-white/5 text-blue-500 focus:ring-offset-[#0a0a0a]" />
                    Remember me
                  </label>
                  <a href="#" className="text-blue-500 hover:text-blue-400 font-semibold transition-colors">Forgot password?</a>
                </div>

                <button
                  type="submit"
                  disabled={isPending || loginSuccess}
                  className="group/btn w-full h-[54px] bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-500 hover:to-blue-400 active:scale-[0.98] transition-all disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold text-[16px] rounded-2xl shadow-lg flex items-center justify-center gap-2 mt-4 overflow-hidden relative"
                >
                  <div className="absolute inset-0 bg-white/20 translate-y-full group-hover/btn:translate-y-0 transition-transform duration-300 pointer-events-none" />
                  <span className="relative z-10 flex items-center gap-2">
                    {isPending ? <Loader2 className="w-5 h-5 animate-spin" /> : (
                      <>
                        Sign In
                        <ArrowRight className="w-4 h-4 group-hover/btn:translate-x-1 transition-transform" />
                      </>
                    )}
                  </span>
                </button>
              </form>

              <div className="pt-6 relative">
                 <div className="absolute inset-0 flex items-center" aria-hidden="true">
                    <div className="w-full border-t border-white/5"></div>
                 </div>
                 <div className="relative flex justify-center text-xs uppercase">
                    <span className="bg-[#111111]/80 px-4 text-gray-500 font-bold tracking-widest">or continue with</span>
                 </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                 <button className="h-[48px] bg-white/5 border border-white/10 rounded-2xl hover:bg-white/10 transition-all flex items-center justify-center gap-2 text-sm font-semibold">
                    <img src="https://www.svgrepo.com/show/475656/google-color.svg" className="w-4 h-4" alt="Google" />
                    Google
                 </button>
                 <button className="h-[48px] bg-white/5 border border-white/10 rounded-2xl hover:bg-white/10 transition-all flex items-center justify-center gap-2 text-sm font-semibold">
                    <img src="https://www.svgrepo.com/show/475647/github-color.svg" className="w-4 h-4 invert opacity-70" alt="Github" />
                    Github
                 </button>
              </div>

              <p className="text-center text-sm text-gray-500">
                Don't have an account? <a href="#" className="text-white font-bold hover:text-blue-400 transition-colors">Sign up</a>
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Footer Branding */}
      <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex items-center gap-2 text-gray-700 font-bold text-sm tracking-tighter select-none">
         <span className="opacity-50 italic">POWERED BY</span>
         <span className="bg-white/5 px-2 py-0.5 rounded border border-white/5 text-gray-500">AI ERP CONSOLE v2.0</span>
      </div>
    </div>
  );
};
