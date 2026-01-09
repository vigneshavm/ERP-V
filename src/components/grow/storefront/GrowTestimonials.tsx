import React from 'react';
import { Quote } from 'lucide-react';

const GrowTestimonials: React.FC = () => {
    const testimonials = [
        { quote: "Since launching our digital storefront, our sales have increased by 40%. The integration with our physical store is flawless.", author: "Sarah", role: "Boutique Owner" },
        { quote: "The Google Business Profile sync is a game changer. We've seen a massive spike in foot traffic.", author: "John", role: "Cafe Manager" },
        { quote: "Easy to set up, and the premium design immediately wowed our customers. Highly recommend!", author: "Emily", role: "Jewelry Designer" }
    ];

    return (
        <section className="max-w-7xl mx-auto px-6 lg:px-12 mt-40" aria-label="Customer Success Stories">
            <div className="bg-[#020617] rounded-[4rem] p-12 lg:p-24 relative overflow-hidden">
                <div className="absolute top-0 right-0 w-96 h-96 bg-[#4F46E5]/10 blur-[100px] rounded-full" aria-hidden="true" />

                <div className="relative z-10">
                    <h2 className="text-3xl lg:text-5xl font-black text-[#F8FAFC] tracking-tight mb-16 text-center">
                        Trusted by <span className="text-[#4F46E5]">Empire Builders</span>
                    </h2>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                        {testimonials.map((t, i) => (
                            <div key={i} className="bg-white/5 backdrop-blur-sm border border-white/10 p-8 rounded-[2.5rem] flex flex-col justify-between">
                                <div>
                                    <Quote className="w-10 h-10 text-[#4F46E5] mb-6 opacity-50" />
                                    <p className="text-[#F8FAFC] text-lg font-medium leading-relaxed mb-8 italic">"{t.quote}"</p>
                                </div>
                                <div>
                                    <p className="text-[#F8FAFC] font-black uppercase tracking-widest text-xs">{t.author}</p>
                                    <p className="text-[#64748B] text-[10px] font-bold uppercase tracking-widest mt-1">{t.role}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </section>
    );
};

export default GrowTestimonials;
