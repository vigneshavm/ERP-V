import { useAuthStore } from '@repo/shared';

import React, { useState } from 'react';
import { useSelector } from 'react-redux';
import { RootState } from "@/app/store/store";
import {
    Layout, Image as ImageIcon, Type, Palette, Download,
    ChevronLeft, Check, Plus
} from 'lucide-react';
import { MarketingTemplate, MarketingCreative } from "@/entities/session/model/growth";

const Campaigns: React.FC = () => {
    const {  user  } = useAuthStore();
    const { tenants } = useSelector((state: RootState) => state.tenant);

    const activeTenant = tenants.find(t => t.id === user?.tenantId);
    const isOwnerOrAdmin = user?.systemRole === 'Owner' || user?.role?.toLowerCase() === 'admin';

    const [activeStep, setActiveStep] = useState<'gallery' | 'editor'>('gallery');
    const [creative, setCreative] = useState<MarketingCreative>({
        templateId: '',
        message: 'Elevate your shopping experience with our exclusive season sale! Visit us today.',
        imageUrl: '',
        theme: 'Ocean Blue',
        format: 'SQUARE'
    });

    const [previewImage, setPreviewImage] = useState<string | null>(null);

    const templates: MarketingTemplate[] = [
        { id: 't1', name: 'Sale Announcement', type: 'FLYER', useCase: 'Promotions' },
        { id: 't2', name: 'New Product Launch', type: 'BANNER', useCase: 'New arrivals' },
        { id: 't3', name: 'Discount Offer', type: 'OFFER_CARD', useCase: 'Deals' },
        { id: 't4', name: 'Festival Greetings', type: 'FLYER', useCase: 'Branding' },
        { id: 't5', name: 'Social Media Post', type: 'SQUARE', useCase: 'Instagram, WhatsApp' },
        { id: 't6', name: 'Email Campaign', type: 'EMAIL', useCase: 'Customer marketing' }
    ];

    const themes = [
        { name: 'Ocean Blue', colors: ['#0EA5E9', '#0369A1'], text: 'white' },
        { name: 'Bold Red', colors: ['#EF4444', '#991B1B'], text: 'white' },
        { name: 'Fresh Green', colors: ['#22C55E', '#166534'], text: 'white' },
        { name: 'Royal Purple', colors: ['#8B5CF6', '#5B21B6'], text: 'white' },
        { name: 'Vibrant Orange', colors: ['#F97316', '#C2410C'], text: 'white' }
    ];

    const handleTemplateSelect = (template: MarketingTemplate) => {
        setCreative(prev => ({ ...prev, templateId: template.id, format: template.type === 'SQUARE' ? 'SQUARE' : (template.type === 'BANNER' ? 'BANNER' : (template.type === 'EMAIL' ? 'EMAIL' : 'A4')) }));
        setActiveStep('editor');
    };

    const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            const reader = new FileReader();
            reader.onloadend = () => {
                setPreviewImage(reader.result as string);
                setCreative(prev => ({ ...prev, imageUrl: reader.result as string }));
            };
            reader.readAsDataURL(file);
        }
    };

    const formatStyles = {
        SQUARE: "aspect-square w-full",
        A4: "aspect-[1/1.414] w-full",
        BANNER: "aspect-[3/1] w-full",
        EMAIL: "aspect-[1/1.5] w-full"
    };

    const currentTheme = themes.find(t => t.name === creative.theme) || themes[0];

    return (
        <div className="pb-20">
            {activeStep === 'gallery' ? (
                <div className="animate-in fade-in slide-in-from-bottom-8 duration-500">
                    <div className="mb-12">
                        <h2 className="text-3xl font-black text-[#020617] dark:text-[#F8FAFC] tracking-tight mb-4">
                            Creative <span className="text-[#4F46E5]">Gallery</span>
                        </h2>
                        <p className="text-[#64748B] text-sm font-bold uppercase tracking-widest opacity-80">
                            Choose a template to start designing.
                        </p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {templates.map((template) => (
                            <div
                                key={template.id}
                                onClick={() => handleTemplateSelect(template)}
                                className="group bg-white dark:bg-[#020617] rounded-[2.5rem] border border-slate-200 dark:border-slate-800 p-8 hover:border-[#4F46E5] hover:shadow-xl hover:-translate-y-1 transition-all cursor-pointer relative overflow-hidden"
                            >
                                <div className="aspect-video bg-slate-100 dark:bg-slate-900 rounded-3xl mb-6 flex items-center justify-center relative overflow-hidden">
                                    <Layout className="w-10 h-10 text-[#64748B] group-hover:text-[#4F46E5] transition-colors" />
                                </div>
                                <h3 className="text-xl font-black text-[#020617] dark:text-[#F8FAFC] mb-1">{template.name}</h3>
                                <p className="text-xs font-bold text-[#64748B] uppercase tracking-wide">{template.useCase}</p>
                            </div>
                        ))}
                    </div>
                </div>
            ) : (
                <div className="animate-in fade-in zoom-in duration-500 h-full flex flex-col md:flex-row gap-8">
                    {/* Editor Sidebar */}
                    <div className="w-full md:w-96 bg-white dark:bg-[#020617] border border-slate-200 dark:border-slate-800 rounded-[2.5rem] p-8 shadow-xl h-fit">
                        <button onClick={() => setActiveStep('gallery')} className="flex items-center gap-2 text-[#64748B] hover:text-[#4F46E5] text-xs font-black uppercase tracking-widest mb-6">
                            <ChevronLeft className="w-4 h-4" /> Back to Gallery
                        </button>

                        <div className="space-y-8">
                            <div>
                                <label className="text-[10px] font-black uppercase tracking-[0.2rem] text-[#64748B] block mb-3 flex items-center gap-2">
                                    <Type className="w-3 h-3" /> Message
                                </label>
                                <textarea
                                    value={creative.message}
                                    onChange={(e) => setCreative(prev => ({ ...prev, message: e.target.value }))}
                                    className="w-full p-4 bg-slate-50 dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-2xl font-bold text-sm outline-none focus:ring-2 focus:ring-[#4F46E5] resize-none"
                                    rows={4}
                                />
                            </div>

                            <div>
                                <label className="text-[10px] font-black uppercase tracking-[0.2rem] text-[#64748B] block mb-3 flex items-center gap-2">
                                    <ImageIcon className="w-3 h-3" /> Image
                                </label>
                                <div className="relative group cursor-pointer">
                                    <input type="file" onChange={handleImageUpload} accept="image/*" className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10" />
                                    <div className="w-full py-8 border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-2xl flex flex-col items-center justify-center gap-2 text-[#64748B] group-hover:border-[#4F46E5] group-hover:bg-[#4F46E5]/5 transition-all">
                                        {previewImage ? <img src={previewImage} alt="Preview" className="w-12 h-12 object-cover rounded-xl" /> : <Plus className="w-6 h-6" />}
                                        <span className="text-[10px] font-black uppercase tracking-widest">Upload</span>
                                    </div>
                                </div>
                            </div>

                            <div>
                                <label className="text-[10px] font-black uppercase tracking-[0.2rem] text-[#64748B] block mb-3 flex items-center gap-2">
                                    <Palette className="w-3 h-3" /> Theme
                                </label>
                                <div className="grid grid-cols-5 gap-2">
                                    {themes.map((theme) => (
                                        <button
                                            key={theme.name}
                                            onClick={() => setCreative(prev => ({ ...prev, theme: theme.name }))}
                                            className={`aspect-square rounded-xl flex items-center justify-center transition-all ${creative.theme === theme.name ? 'ring-2 ring-[#4F46E5] scale-110' : 'hover:scale-105'}`}
                                            style={{ background: `linear-gradient(135deg, ${theme.colors[0]}, ${theme.colors[1]})` }}
                                        >
                                            {creative.theme === theme.name && <Check className="w-3 h-3 text-white" />}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {isOwnerOrAdmin && (
                                <button className="w-full py-4 bg-[#4F46E5] text-white rounded-xl font-black uppercase tracking-widest text-xs hover:scale-105 transition-all flex items-center justify-center gap-2 shadow-lg shadow-[#4F46E5]/30">
                                    <Download className="w-4 h-4" /> Download
                                </button>
                            )}
                        </div>
                    </div>

                    {/* Preview Area */}
                    <div className="flex-1 bg-slate-100 dark:bg-slate-900/50 rounded-[3rem] p-8 flex items-center justify-center border border-slate-200 dark:border-slate-800">
                        <div className={`relative w-full max-w-md shadow-2xl rounded-[2rem] overflow-hidden transition-all duration-300 ${formatStyles[creative.format as keyof typeof formatStyles]}`}>
                            <div className="absolute inset-0" style={{ background: `linear-gradient(135deg, ${currentTheme.colors[0]}, ${currentTheme.colors[1]})` }}>
                                <div className="h-full flex flex-col p-8 relative z-10 text-white">
                                    <div className="flex items-center gap-3 mb-6">
                                        <div className="w-10 h-10 bg-white rounded-lg shadow-sm flex items-center justify-center">
                                            {activeTenant?.loginLogoUrl ? <img src={activeTenant.loginLogoUrl} alt="Logo" className="w-6 h-6 object-contain" /> : <div className="w-4 h-4 bg-[#4F46E5] rounded-sm" />}
                                        </div>
                                        <div>
                                            <h4 className="font-black text-xs uppercase tracking-widest">{activeTenant?.name || 'Your Brand'}</h4>
                                        </div>
                                    </div>

                                    {creative.format !== 'BANNER' && (
                                        <div className="flex-1 bg-white/10 backdrop-blur-md rounded-2xl border border-white/20 mb-6 overflow-hidden">
                                            {previewImage && <img src={previewImage} className="w-full h-full object-cover" />}
                                        </div>
                                    )}

                                    <div>
                                        <h2 className={`font-black leading-tight mb-3 ${creative.format === 'BANNER' ? 'text-xl' : 'text-2xl'}`}>Limited Time Offer</h2>
                                        <p className="text-xs font-medium opacity-90">{creative.message}</p>
                                    </div>

                                    <div className="mt-auto pt-6 border-t border-white/20 flex justify-between text-[10px] font-bold uppercase tracking-widest opacity-80">
                                        <span>{activeTenant?.companyDetails?.phone || 'Contact Us'}</span>
                                        <span>{activeTenant?.companyDetails?.city || 'Visit Store'}</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Campaigns;
