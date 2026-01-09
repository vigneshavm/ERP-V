import React from 'react';
import { Lightbulb, Quote, Star, MousePointer2, Smartphone, TrendingUp, Eye } from 'lucide-react';

const PerformanceTips: React.FC = () => {
    const tips = [
        { title: "Boost Trust", tip: "Add customer testimonials to showcase real product experiences.", icon: Quote },
        { title: "Visual Impact", tip: "Use high-quality product images to increase conversion rates.", icon: Star },
        { title: "Clear Path", tip: "Include clear call-to-action buttons for frictionless shopping.", icon: MousePointer2 },
        { title: "Mobile Ready", tip: "Optimize your layout specifically for mobile-first customers.", icon: Smartphone },
        { title: "Optimized Copy", tip: "A/B test different headlines to find what resonates best.", icon: TrendingUp },
        { title: "Visual Engagement", tip: "Monitor your profile views and clicks to adjust strategy.", icon: Eye }
    ];

    return (
        <section className="max-w-7xl mx-auto px-6 lg:px-12 mt-40 pb-20" aria-label="Performance Optimization Tips">
            <div className="bg-white dark:bg-[#020617] rounded-[4rem] border border-slate-200 dark:border-slate-800 p-12 lg:p-20 shadow-2xl overflow-hidden relative">
                <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-[#4F46E5] via-[#22C55E] to-[#4F46E5]" />

                <div className="flex flex-col lg:flex-row items-center justify-between gap-12 mb-16">
                    <div className="max-w-xl text-center lg:text-left">
                        <div className="inline-flex items-center gap-2 px-4 py-2 bg-[#F59E0B]/10 rounded-full text-[#F59E0B] text-xs font-black uppercase tracking-widest mb-6">
                            <Lightbulb className="w-4 h-4" /> Expansion Intelligence
                        </div>
                        <h2 className="text-3xl lg:text-5xl font-black text-[#020617] dark:text-[#F8FAFC] tracking-tight leading-none">
                            Performance <span className="text-[#4F46E5]">Insights</span>
                        </h2>
                    </div>
                    <div className="hidden lg:block">
                        <div className="flex -space-x-4">
                            {[1, 2, 3, 4].map(i => (
                                <div key={i} className="w-16 h-16 rounded-full border-4 border-white dark:border-[#020617] bg-slate-200 overflow-hidden shadow-lg">
                                    <img src={`https://i.pravatar.cc/150?u=${i + 10}`} alt="Expert" className="w-full h-full object-cover" />
                                </div>
                            ))}
                        </div>
                        <p className="text-xs font-bold text-[#64748B] text-center mt-4 uppercase tracking-widest">Expert Advice Team</p>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                    {tips.map((item, idx) => (
                        <div key={idx} className="group p-8 bg-slate-50 dark:bg-slate-900/50 rounded-3xl border border-slate-100 dark:border-slate-800 hover:border-[#4F46E5]/30 transition-all">
                            <div className="w-12 h-12 bg-white dark:bg-[#020617] rounded-xl flex items-center justify-center text-[#4F46E5] shadow-md group-hover:scale-110 transition-transform mb-6">
                                <item.icon className="w-6 h-6" />
                            </div>
                            <h3 className="text-lg font-black text-[#020617] dark:text-[#F8FAFC] mb-2">{item.title}</h3>
                            <p className="text-sm font-medium text-[#64748B] leading-relaxed">{item.tip}</p>
                        </div>
                    ))}
                </div>
            </div>
        </section>
    );
};

export default PerformanceTips;
