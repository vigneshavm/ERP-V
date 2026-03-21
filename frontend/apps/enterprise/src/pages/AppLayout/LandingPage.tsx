import React from 'react';
import { Shield, Store, ArrowRight } from 'lucide-react';
import { Tenant } from '@/entities/session/model/core';

interface LandingPageProps {
  setViewMode: (mode: 'LANDING' | 'ADMIN' | 'TENANT') => void;
  setCurrentTenant: (tenant: Tenant) => void;
  setIsLoggedIn: (isLoggedIn: boolean) => void;
}

const LandingPage: React.FC<LandingPageProps> = ({ setViewMode, setCurrentTenant, setIsLoggedIn }) => (
  <div className="min-h-screen bg-app flex flex-col items-center justify-center p-4 relative overflow-hidden">
    {/* Background Decoration */}
    <div className="absolute top-0 left-0 w-full h-full pointer-events-none opacity-40">
      <div className="absolute top-1/4 left-1/4 w-[500px] h-[500px] bg-primary/20 rounded-full blur-[160px] animate-pulse"></div>
      <div className="absolute bottom-1/4 right-1/4 w-[500px] h-[500px] bg-accent/20 rounded-full blur-[160px] animate-pulse" style={{ animationDelay: '2s' }}></div>
    </div>

    <div className="max-w-4xl w-full text-center mb-16 relative z-10">
      <div className="w-20 h-20 bg-primary rounded-2xl flex items-center justify-center mx-auto mb-8 shadow-2xl shadow-primary/20 rotate-3 animate-fade-in">
        <span className="font-display font-black text-4xl text-main">E</span>
      </div>
      <h1 className="text-5xl md:text-6xl font-display font-black text-main mb-6 tracking-tighter animate-slide-down">
        Next-Gen <span className="text-primary">ERP</span> Matrix
      </h1>
      <p className="text-xl text-secondary max-w-2xl mx-auto font-medium leading-relaxed opacity-80 animate-fade-in" style={{ animationDelay: '0.2s' }}>
        The intelligent neural center for modern commerce.
        Synchronize inventory, finance, and operations with industrial-grade precision.
      </p>
    </div>

    <div className="grid md:grid-cols-2 gap-8 max-w-4xl w-full relative z-10 animate-fade-in" style={{ animationDelay: '0.4s' }}>
      <button
        onClick={() => setViewMode('ADMIN')}
        className="card-interactive group text-left relative overflow-hidden"
      >
        <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-full -mr-16 -mt-16 transition-transform group-hover:scale-150"></div>
        <div className="w-14 h-14 bg-primary/10 rounded-xl flex items-center justify-center text-primary mb-6 group-hover:scale-110 transition-transform">
          <Shield className="w-7 h-7" />
        </div>
        <h2 className="text-2xl font-display font-bold text-main mb-2">Platform Control</h2>
        <p className="text-secondary opacity-70 mb-6">Manage global infrastructure, tenants, and system-level parameters.</p>
        <div className="flex items-center text-primary font-bold text-sm tracking-widest uppercase">
          Initialize Access <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-2 transition-transform" />
        </div>
      </button>

      <button
        onClick={() => {
          setCurrentTenant({
            id: 'demo',
            name: 'Neural Retail Co',
            subdomain: 'demo',
            sector: 'Retail',
            modules: ['POS', 'INVENTORY', 'FINANCE', 'HR'],
            isActive: true,
            region: { currency: 'USD', currencySymbol: '$', dateFormat: 'MM/DD/YYYY' }
          } as any);
          setViewMode('TENANT');
          setIsLoggedIn(false);
        }}
        className="card-interactive group text-left relative overflow-hidden"
      >
        <div className="absolute top-0 right-0 w-32 h-32 bg-secondary/5 rounded-full -mr-16 -mt-16 transition-transform group-hover:scale-150"></div>
        <div className="w-14 h-14 bg-secondary/10 rounded-xl flex items-center justify-center text-secondary mb-6 group-hover:scale-110 transition-transform">
          <Store className="w-7 h-7" />
        </div>
        <h2 className="text-2xl font-display font-bold text-main mb-2">Tenant Interface</h2>
        <p className="text-secondary opacity-70 mb-6">Launch specialized retail operations, POS terminals, and analytics.</p>
        <div className="flex items-center text-secondary font-bold text-sm tracking-widest uppercase">
          Authenticate Unit <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-2 transition-transform" />
        </div>
      </button>
    </div>

    <p className="mt-20 text-xs text-secondary font-bold tracking-[0.2em] opacity-40 uppercase">© 2026 ERP Matrix Systems // Secure Access Point</p>
  </div>
);

export default LandingPage;
