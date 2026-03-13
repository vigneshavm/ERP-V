import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useLogin } from '../api/authApi';
import { Loader2, AlertCircle } from 'lucide-react';
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

  const emailValue = watch('email');
  const passwordValue = watch('password');

  const onSubmit = (data: LoginFormValues) => {
    // Sanitize email: remove leading/trailing quotes and whitespace
    const sanitizedEmail = data.email.replace(/^["']|["']$/g, '').trim();

    // We map 'email' to 'username' expected by the current loginApi implementation in authApi.ts
    // although it's better to update authApi.ts to be more descriptive.
    login({ username: sanitizedEmail, password: data.password }, {
      onSuccess: () => {
        setLoginSuccess(true);
      }
    });
  };

  return (
    <div className="h-[100dvh] bg-white flex flex-col font-sans text-[#1c1e21] selection:bg-[#1877f2]/20 selection:text-[#1877f2] overflow-hidden">
      {/* Main Content Area */}
      <div className="flex-grow flex flex-col lg:flex-row divide-x-0 lg:divide-x divide-[#dadde1] overflow-hidden">
        
        {/* LEFT COLUMN: HERO & VISUALS (Official FB DOM Alignment) */}
        <div className="flex-1 flex flex-col items-center justify-center p-8 sm:p-12 lg:p-16 bg-[#f0f2f5] lg:bg-white relative overflow-hidden">
          <div className="max-w-[580px] w-full relative z-10 transition-all duration-700 animate-in fade-in slide-in-from-left-12 flex flex-col items-center lg:items-start">
            
            {/* Official-style Brand 'W' Logo */}
            <div className="mb-2 text-[#1877f2]">
               <div className="w-[60px] h-[60px] bg-[#1877f2] rounded-full flex items-center justify-center shadow-lg transform hover:scale-105 transition-transform cursor-pointer">
                 <span className="text-white text-[2.8rem] font-black italic tracking-tighter -translate-y-0.5 select-none">W</span>
               </div>
            </div>

            {/* Official Tagline Structure */}
            <div className="mb-4 text-center lg:text-left">
                <h1 className="text-[2.5rem] sm:text-[3.5rem] lg:text-[4rem] font-bold leading-[1.1] tracking-tight text-[#1c1e21]" style={{ lineHeight: '1.1' }}>
                  Manage the assets <span className="text-[#1877f2]">you value</span>.
                </h1>
            </div>

            {/* Official Background Collage Image - Replaced with Finance ERP Visual */}
            <div className="relative pointer-events-none select-none animate-in fade-in zoom-in-95 duration-1000 w-full flex justify-center lg:justify-start">
               <img 
                 className="w-full h-auto max-w-[450px] lg:max-w-[500px] object-cover rounded-3xl shadow-lg border border-[#dadde1]" 
                 alt="Finance ERP Dashboard" 
                 referrerPolicy="origin-when-cross-origin" 
                 src="https://images.unsplash.com/photo-1460925895917-afdab827c52f?auto=format&fit=crop&q=80&w=1200" 
               />
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN: LOGIN FORM (Aligned with user provided snippets) */}
        <div className="flex-1 flex flex-col items-center justify-center p-8 sm:p-12 lg:p-16 bg-white overflow-y-auto lg:overflow-hidden">
          <div className="max-w-[420px] w-full transition-all duration-700 animate-in fade-in slide-in-from-right-12">
            
            <div className="space-y-6">
              <h2 className="text-[1.8rem] font-bold text-[#1c1e21] tracking-tight mb-4">Log in to WinERP</h2>

              <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                {isError && (
                  <div className="p-4 text-sm text-[#ff3b36] bg-[#ff3b36]/5 border border-[#ff3b36]/20 rounded-xl flex items-center gap-2 animate-shake">
                    <AlertCircle className="w-4 h-4 shrink-0" />
                    {(error as Error).message}
                  </div>
                )}

                <div className="space-y-3">
                  {/* Floating Label Wrapper for Email */}
                  <div className="relative group">
                    <input
                      {...register('email')}
                      dir="ltr"
                      autoComplete="username webauthn"
                      aria-invalid={!!errors.email}
                      type="text"
                      id="email_input"
                      placeholder=" "
                      className={cn(
                        "peer w-full h-[52px] px-4 pt-[18px] pb-[4px] bg-[#f5f6f7] border border-[#dddfe2] rounded-[6px] text-[17px] focus:outline-none focus:border-[#0866ff] focus:bg-white focus:ring-[2px] focus:ring-[#e7f3ff] transition-all",
                        errors.email && "border-[#ff3b36] focus:border-[#ff3b36] focus:ring-[#ff3b36]/10"
                      )}
                    />
                    <label 
                      htmlFor="email_input"
                      className={cn(
                        "absolute left-4 top-[14px] text-[#8e959f] transition-all duration-200 pointer-events-none select-none origin-left text-[17px]",
                        "peer-focus:-translate-y-2.5 peer-focus:scale-[0.75] peer-focus:text-[#0866ff]",
                        "peer-[:not(:placeholder-shown)]:-translate-y-2.5 peer-[:not(:placeholder-shown)]:scale-[0.75]",
                        emailValue && "-translate-y-2.5 scale-[0.75]"
                      )}
                    >
                      Email address or mobile number
                    </label>
                  </div>
                  
                  {/* Floating Label Wrapper for Password */}
                  <div className="relative group">
                    <input
                      {...register('password')}
                      dir="ltr"
                      autoComplete="current-password"
                      aria-invalid={!!errors.password}
                      type="password"
                      id="pass_input"
                      placeholder=" "
                      className={cn(
                        "peer w-full h-[54px] px-4 pt-[18px] pb-[4px] bg-[#f5f6f7] border border-[#dddfe2] rounded-[6px] text-[17px] focus:outline-none focus:border-[#0866ff] focus:bg-white focus:ring-[2px] focus:ring-[#e7f3ff] transition-all",
                        errors.password && "border-[#ff3b36] focus:border-[#ff3b36] focus:ring-[#ff3b36]/10"
                      )}
                    />
                    <label 
                      htmlFor="pass_input"
                      className={cn(
                        "absolute left-4 top-[14px] text-[#8e959f] transition-all duration-200 pointer-events-none select-none origin-left text-[17px]",
                        "peer-focus:-translate-y-2.5 peer-focus:scale-[0.75] peer-focus:text-[#0866ff]",
                        "peer-[:not(:placeholder-shown)]:-translate-y-2.5 peer-[:not(:placeholder-shown)]:scale-[0.75]",
                        passwordValue && "-translate-y-2.5 scale-[0.75]"
                      )}
                    >
                      Password
                    </label>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={isPending || loginSuccess}
                  className="w-full h-[48px] bg-[#1877f2] hover:bg-[#166fe5] active:scale-[0.98] transition-all disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold text-[20px] rounded-full shadow-md flex items-center justify-center gap-2 mt-2"
                >
                  {isPending ? <Loader2 className="w-7 h-7 animate-spin" /> : 'Log in'}
                </button>
              </form>

              <div className="text-center pt-2">
                <a href="#" className="text-[15px] text-[#1877f2] hover:underline font-semibold font-sans">
                  Forgotten password?
                </a>
              </div>

              <div className="h-10 border-b border-[#dadde1]" />

              <div className="flex justify-center flex-col gap-10 items-center pt-8">
                <button
                  type="button"
                  className="w-full h-[48px] border-2 border-[#1877f2] bg-white text-[#1877f2] hover:bg-[#1877f2]/5 active:scale-[0.98] transition-all font-bold text-[18px] rounded-full"
                >
                  Create new account
                </button>

                {/* OFFICIAL META LOGO SVG (From user snippet) */}
              </div>
            </div>
          </div>
        </div>
      </div>

    </div>
  );
};
