import React from 'react';

const LoadingScreen: React.FC = () => (
  <div className="min-h-screen bg-app flex flex-col items-center justify-center p-4">
    <div className="w-16 h-16 relative">
      <div className="absolute inset-0 border-4 border-primary/20 rounded-full"></div>
      <div className="absolute inset-0 border-4 border-t-primary rounded-full animate-spin"></div>
    </div>
    <p className="mt-6 text-secondary font-black text-[10px] uppercase tracking-[0.3em] animate-pulse">Initializing Neural Link</p>
  </div>
);

export default LoadingScreen;
