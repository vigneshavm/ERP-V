import React from 'react';
import { Rocket, ArrowRight, CheckCircle2, ShoppingBag } from 'lucide-react';
import { EcommercePlan } from '../../../types/tenant';

interface GrowHeroProps {
    isEnabled: boolean;
    isLoading: boolean;
    currentPlan: string;
    onActivate: () => void;
}

const GrowHero: React.FC<GrowHeroProps> = ({ isEnabled, isLoading, currentPlan, onActivate }) => {
    return (
        <header
            className="relative overflow-hidden bg-[#020617] border-b border-slate-800 pt-20 pb-40 px-6 lg:px-12 text-center lg:text-left rounded-b-[4rem] shadow-2xl"
            role="banner"
        >
            <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-[#4F46E5]/10 blur-[120px] rounded-full -mr-48 -mt-48 motion-safe:animate-pulse transition-opacity duration-300" aria-hidden="true" />
            <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-[#22C55E]/5 blur-[100px] rounded-full -ml-32 -mb-32 transition-opacity duration-300" aria-hidden="true" />

            <div className="relative z-10 max-w-7xl mx-auto flex flex-col lg:flex-row items-center justify-between gap-16">
                <div className="max-w-3xl">
                    <div className="inline-flex items-center gap-2 px-4 py-2 bg-[#4F46E5]/10 rounded-full border border-[#4F46E5]/20 text-[#4F46E5] dark:text-indigo-300 text-xs font-black uppercase tracking-widest mb-8">
                        <Rocket className="w-4 h-4" aria-hidden="true" />
                        Used by Global Stores
                    </div>

                    <h1 className="text-5xl lg:text-[4.5rem] font-black text-[#F8FAFC] tracking-tight leading-[1.1] mb-8 motion-safe:animate-in motion-safe:fade-in motion-safe:slide-in-from-left-4 duration-200">
                        Launch Your <br />
                        <span className="text-[#4F46E5]">Digital Empire</span>
                    </h1>

                    <p className="text-[#64748B] text-xl lg:text-2xl font-medium leading-relaxed max-w-xl mb-12 motion-safe:animate-in motion-safe:fade-in motion-safe:slide-in-from-left-6 duration-200">
                        Turn your store into a 24×7 online business in minutes. Reach global customers with integrated POS and inventory management.
                    </p>

                    <div className="flex flex-col sm:flex-row items-center gap-6">
                        {!isEnabled ? (
                            <button
                                onClick={onActivate}
                                disabled={isLoading}
                                aria-label="Start ecommerce free trial"
                                className="w-full sm:w-auto px-10 py-5 bg-[#4F46E5] text-white rounded-xl font-black uppercase tracking-widest text-sm hover:scale-105 active:scale-95 transition-all duration-200 focus:ring-4 focus:ring-[#4F46E5]/40 focus:outline-none flex items-center justify-center gap-4 group"
                            >
                                {isLoading ? 'Activating...' : 'Start Free Trial'}
                                <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform duration-200" aria-hidden="true" />
                            </button>
                        ) : (
                            <div className="inline-flex items-center gap-3 px-8 py-4 bg-[#22C55E]/10 rounded-xl border border-[#22C55E]/30 text-[#22C55E] font-black uppercase tracking-widest text-xs">
                                <CheckCircle2 className="w-5 h-5" aria-hidden="true" />
                                Empire Active: {currentPlan} Tier
                            </div>
                        )}
                        <span className="text-[#64748B] text-xs font-bold uppercase tracking-widest">Global Ready</span>
                    </div>
                </div>

                <div className="hidden xl:block w-full max-w-md" aria-hidden="true">
                    <div className="relative aspect-square bg-[#020617] rounded-[3rem] border border-slate-800 p-8 shadow-inner overflow-hidden">
                        <div className="absolute inset-0 bg-gradient-to-br from-[#4F46E5]/20 to-transparent" />
                        <div className="relative h-full flex flex-col justify-center items-center text-center">
                            <ShoppingBag className="w-24 h-24 text-[#F8FAFC] mb-8" />
                            <div className="space-y-4 w-full px-12">
                                <div className="h-2 w-full bg-slate-800 rounded-full" />
                                <div className="h-2 w-2/3 bg-slate-800/50 rounded-full mx-auto" />
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </header>
    );
};

export default GrowHero;
