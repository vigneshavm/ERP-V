import React from 'react';
import { AlertCircle, RefreshCw, Home } from 'lucide-react';

interface RouteErrorFallbackProps {
  error: Error;
  resetError: () => void;
}

const RouteErrorFallback: React.FC<RouteErrorFallbackProps> = ({ error, resetError }) => {
  return (
    <div className="min-h-[400px] w-full flex flex-col items-center justify-center p-6 animate-in fade-in duration-500">
      <div className="max-w-md w-full glass-panel border border-error/20 p-8 rounded-3xl relative overflow-hidden shadow-2xl shadow-error/5">
        {/* Background Glow */}
        <div className="absolute -top-24 -right-24 w-48 h-48 bg-error/10 rounded-full blur-3xl pointer-events-none"></div>
        
        <div className="relative z-10 flex flex-col items-center text-center">
          <div className="w-20 h-20 bg-error/10 rounded-2xl flex items-center justify-center text-error mb-6 ring-1 ring-error/20">
            <AlertCircle className="w-10 h-10" />
          </div>
          
          <h2 className="text-2xl font-display font-black text-main mb-2 tracking-tight">
            Module Encountered a Glitch
          </h2>
          
          <p className="text-secondary opacity-80 mb-8 leading-relaxed">
            Something unexpected happened while rendering this component. 
            The neural link was temporarily interrupted.
          </p>
          
          {/* Error Details (Collapsible or subtle) */}
          <div className="w-full bg-black/5 dark:bg-[var(--erp-bg-sunken)] rounded-xl p-4 mb-8 text-left border border-default">
            <div className="text-[10px] font-bold text-primary uppercase tracking-widest mb-1">Diagnostic Log</div>
            <code className="text-xs text-secondary font-mono break-all line-clamp-2">
              {error.message || 'Unknown execution error'}
            </code>
          </div>
          
          <div className="flex flex-col sm:flex-row gap-3 w-full">
            <button
              onClick={resetError}
              className="flex-1 flex items-center justify-center gap-2 px-6 py-3 bg-primary text-white rounded-xl font-bold text-sm transition-all hover:scale-105 active:scale-95 shadow-lg shadow-primary/20"
            >
              <RefreshCw className="w-4 h-4" />
              Try Again
            </button>
            
            <a
              href="/enterprise/dashboard"
              className="flex-1 flex items-center justify-center gap-2 px-6 py-3 bg-[var(--erp-bg-sunken)] border border-default text-main rounded-xl font-bold text-sm transition-all hover:bg-white/10"
            >
              <Home className="w-4 h-4" />
              Dashboard
            </a>
          </div>
          
          <p className="mt-8 text-[10px] text-secondary font-bold tracking-[0.2em] uppercase opacity-40">
            Error intercepted by BizzAI Core
          </p>
        </div>
      </div>
    </div>
  );
};

export default RouteErrorFallback;
