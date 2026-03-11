import React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useLogin } from '../api/authApi';
import { Loader2, Lock, User, AlertCircle, CheckCircle2 } from 'lucide-react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { useState, useEffect } from 'react';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

const loginSchema = z.object({
  username: z.string().min(3, 'Username must be at least 3 characters'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
});

type LoginFormValues = z.infer<typeof loginSchema>;

export const LoginForm: React.FC = () => {
  const [loginSuccess, setLoginSuccess] = useState(false);
  const { mutate: login, isPending, error, isError } = useLogin();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
  });

  const onSubmit = (data: LoginFormValues) => {
    login(data, {
      onSuccess: () => {
        setLoginSuccess(true);
      }
    });
  };

  return (
    <div className="w-full max-w-md p-8 space-y-6 bg-white/10 backdrop-blur-xl rounded-2xl border border-white/20 shadow-2xl">
      <div className="space-y-2 text-center">
        <h1 className="text-3xl font-bold tracking-tight text-white">Login</h1>
        <p className="text-sm text-gray-400">Enter your credentials to access your account</p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        {isError && (
          <div className="p-3 text-sm text-red-400 bg-red-400/10 border border-red-400/20 rounded-lg flex items-center gap-2 animate-in fade-in slide-in-from-top-1">
            <AlertCircle className="w-4 h-4" />
            {(error as Error).message}
          </div>
        )}

        {loginSuccess && (
          <div className="p-3 text-sm text-emerald-400 bg-emerald-400/10 border border-emerald-400/20 rounded-lg flex items-center gap-2 animate-in fade-in slide-in-from-top-1">
            <CheckCircle2 className="w-4 h-4" />
            Login successful! Redirecting...
          </div>
        )}

        <div className="space-y-1">
          <label className="text-sm font-medium text-gray-300" htmlFor="username">
            Username
          </label>
          <div className="relative">
            <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
            <input
              {...register('username')}
              id="username"
              type="text"
              placeholder="username"
              className={cn(
                "w-full pl-10 pr-4 py-2 bg-black/20 border border-white/10 rounded-lg text-white placeholder:text-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-all",
                errors.username && "border-red-500/50 focus:ring-red-500/50"
              )}
            />
          </div>
          {errors.username && <p className="text-xs text-red-400">{errors.username.message}</p>}
        </div>

        <div className="space-y-1">
          <label className="text-sm font-medium text-gray-300" htmlFor="password">
            Password
          </label>
          <div className="relative">
            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
            <input
              {...register('password')}
              id="password"
              type="password"
              placeholder="••••••••"
              className={cn(
                "w-full pl-10 pr-4 py-2 bg-black/20 border border-white/10 rounded-lg text-white placeholder:text-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-all",
                errors.password && "border-red-500/50 focus:ring-red-500/50"
              )}
            />
          </div>
          {errors.password && <p className="text-xs text-red-400">{errors.password.message}</p>}
        </div>

        <button
          type="submit"
          disabled={isPending || loginSuccess}
          className="w-full py-2.5 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold rounded-lg shadow-lg shadow-blue-600/20 transition-all active:scale-[0.98] flex items-center justify-center gap-2"
        >
          {isPending ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              Logging in...
            </>
          ) : loginSuccess ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              Success!
            </>
          ) : (
            'Sign In'
          )}
        </button>
      </form>

      <div className="text-center">
        <a href="#" className="text-xs text-blue-400 hover:text-blue-300 transition-colors">
          Forgot your password?
        </a>
      </div>
    </div>
  );
};
