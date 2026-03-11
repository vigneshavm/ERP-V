import React from 'react';
import { LoginForm } from '../components/LoginForm';

export const LoginPage: React.FC = () => {
  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-[#0a0a0a] relative overflow-hidden">
      {/* Dynamic Background Gradients */}
      <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-blue-600/20 blur-[120px] rounded-full animate-pulse" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-purple-600/20 blur-[120px] rounded-full animate-pulse delay-700" />
      
      <div className="relative z-10 w-full flex flex-col items-center">
        {/* Company Logo or Name */}
        <div className="mb-8 flex items-center gap-2">
          <div className="w-10 h-10 bg-gradient-to-tr from-blue-600 to-purple-600 rounded-xl flex items-center justify-center shadow-lg">
            <span className="text-white font-bold text-xl">B</span>
          </div>
          <span className="text-2xl font-bold text-white tracking-tight">BIZZAI ERP</span>
        </div>

        <LoginForm />
        
        <p className="mt-8 text-sm text-gray-500">
          Don&apos;t have an account?{' '}
          <a href="#" className="text-blue-400 hover:underline">
            Contact your administrator
          </a>
        </p>
      </div>
    </div>
  );
};
