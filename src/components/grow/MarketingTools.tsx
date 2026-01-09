import React, { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import { RootState } from '../../store';
import {
    Layout,
    Image as ImageIcon,
    Type,
    Palette,
    Download,
    Share2,
    Eye,
    ChevronLeft,
    Check,
    Smartphone,
    Mail,
    FileText,
    MessageSquare,
    Facebook,
    Instagram,
    Twitter,
    Link as LinkIcon,
    Plus,
    X,
    Monitor,
    Send
} from 'lucide-react';
import { MarketingTemplate, MarketingCreative, MarketingTemplateType } from '../../types/tenant';

const MarketingTools: React.FC = () => {
    const { user } = useSelector((state: RootState) => state.auth);
    const { tenants } = useSelector((state: RootState) => state.tenant);

    const activeTenant = tenants.find(t => t.id === user?.tenantId);
    const isOwnerOrAdmin = user?.systemRole === 'Owner' || (user?.role as string).toLowerCase() === 'admin';

    const [activeStep, setActiveStep] = useState<'gallery' | 'editor'>('gallery');
    const [selectedTemplate, setSelectedTemplate] = useState<MarketingTemplate | null>(null);
    const [creative, setCreative] = useState<MarketingCreative>({
        templateId: '',
        message: 'Elevate your shopping experience with our exclusive season sale! Visit us today.',
        imageUrl: '',
        theme: 'Ocean Blue',
        format: 'SQUARE'
    });

    const [previewFormat, setPreviewFormat] = useState<'SQUARE' | 'A4' | 'BANNER' | 'EMAIL'>('SQUARE');
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
        setSelectedTemplate(template);
        setCreative(prev => ({ ...prev, templateId: template.id, format: template.type === 'SQUARE' ? 'SQUARE' : (template.type === 'BANNER' ? 'BANNER' : (template.type === 'EMAIL' ? 'EMAIL' : 'A4')) }));
        setPreviewFormat(template.type === 'SQUARE' ? 'SQUARE' : (template.type === 'BANNER' ? 'BANNER' : (template.type === 'EMAIL' ? 'EMAIL' : 'A4')));
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

    const currentTheme = themes.find(t => t.name === creative.theme) || themes[0];

    const formatStyles = {
        SQUARE: "aspect-square w-full",
        A4: "aspect-[1/1.414] w-full",
        BANNER: "aspect-[3/1] w-full",
        EMAIL: "aspect-[1/1.5] w-full"
    };

    return (
        <div className="space-y-12 pb-32">
            {activeStep === 'gallery' ? (
                <div className="animate-in fade-in slide-in-from-bottom-8 duration-500">
                    <div className="text-center mb-16">
                        <h2 className="text-4xl lg:text-5xl font-black text-[#020617] dark:text-[#F8FAFC] tracking-tight mb-6">
                            Marketing <span className="text-[#4F46E5]">Suite</span>
                        </h2>
                        <p className="text-[#64748B] text-lg font-bold uppercase tracking-widest opacity-80 max-w-2xl mx-auto">
                            Design professional promotional materials in seconds. No external tools required.
                        </p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                        {templates.map((template) => (
                            <div
                                key={template.id}
                                onClick={() => handleTemplateSelect(template)}
                                className="group bg-white dark:bg-[#020617] rounded-[2.5rem] border border-slate-200 dark:border-slate-800 p-8 hover:border-[#4F46E5] hover:shadow-2xl hover:-translate-y-2 transition-all cursor-pointer relative overflow-hidden focus-within:ring-2 focus-within:ring-[#4F46E5]"
                                role="button"
                                tabIndex={0}
                            >
                                <div className="aspect-video bg-slate-100 dark:bg-slate-900 rounded-3xl mb-8 flex items-center justify-center relative overflow-hidden">
                                    <div className="absolute inset-0 bg-gradient-to-br from-[#4F46E5]/10 to-transparent flex items-center justify-center">
                                        <Layout className="w-12 h-12 text-[#64748B] group-hover:text-[#4F46E5] transition-colors" />
                                    </div>
                                    <div className="absolute top-4 left-4">
                                        <span className={`px-3 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest ${template.type === 'FLYER' ? 'bg-[#4F46E5] text-white' :
                                            template.type === 'SQUARE' ? 'bg-[#22C55E] text-white' :
                                                'bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-400'
                                            }`}>
                                            {template.type}
                                        </span>
                                    </div>
                                </div>
                                <h3 className="text-2xl font-black text-[#020617] dark:text-[#F8FAFC] mb-2 tracking-tight group-hover:text-[#4F46E5] transition-colors">{template.name}</h3>
                                <p className="text-sm font-bold text-[#64748B]">{template.useCase}</p>
                            </div>
                        ))}
                    </div>
                </div>
            ) : (
                <div className="animate-in fade-in zoom-in duration-500">
                    <div className="flex flex-col lg:flex-row gap-8">
                        {/* Editor Panel */}
                        <aside className="w-full lg:w-[400px] shrink-0 space-y-8">
                            <button
                                onClick={() => setActiveStep('gallery')}
                                className="flex items-center gap-2 text-[#64748B] hover:text-[#4F46E5] text-xs font-black uppercase tracking-widest transition-colors mb-4"
                            >
                                <ChevronLeft className="w-4 h-4" /> Back to Gallery
                            </button>

                            <div className="bg-white dark:bg-[#020617] rounded-[2.5rem] border border-slate-200 dark:border-slate-800 p-10 shadow-xl space-y-10">
                                <div>
                                    <label className="text-[10px] font-black uppercase tracking-[0.2rem] text-[#64748B] block mb-4 flex items-center gap-2">
                                        <Type className="w-3 h-3" /> Custom Message
                                    </label>
                                    <textarea
                                        value={creative.message}
                                        onChange={(e) => setCreative(prev => ({ ...prev, message: e.target.value }))}
                                        className="w-full p-6 bg-slate-50 dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-2xl font-bold text-sm focus:ring-4 focus:ring-[#4F46E5]/20 outline-none transition-all resize-none"
                                        rows={4}
                                        placeholder="Write your promo message..."
                                    />
                                </div>

                                <div>
                                    <label className="text-[10px] font-black uppercase tracking-[0.2rem] text-[#64748B] block mb-4 flex items-center gap-2">
                                        <ImageIcon className="w-3 h-3" /> Product Image
                                    </label>
                                    <div className="relative group">
                                        <input
                                            type="file"
                                            onChange={handleImageUpload}
                                            accept="image/*"
                                            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                                        />
                                        <div className="w-full py-12 border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-2xl flex flex-col items-center justify-center gap-3 text-[#64748B] group-hover:border-[#4F46E5] group-hover:bg-[#4F46E5]/5 transition-all">
                                            {previewImage ? (
                                                <img src={previewImage} alt="Preview" className="w-16 h-16 object-cover rounded-xl" />
                                            ) : (
                                                <Plus className="w-8 h-8" />
                                            )}
                                            <span className="text-[10px] font-black uppercase tracking-widest">Click to Upload</span>
                                        </div>
                                    </div>
                                </div>

                                <div>
                                    <label className="text-[10px] font-black uppercase tracking-[0.2rem] text-[#64748B] block mb-4 flex items-center gap-2">
                                        <Palette className="w-3 h-3" /> Theme Selector
                                    </label>
                                    <div className="grid grid-cols-5 gap-3">
                                        {themes.map((theme) => (
                                            <button
                                                key={theme.name}
                                                onClick={() => setCreative(prev => ({ ...prev, theme: theme.name }))}
                                                className={`aspect-square rounded-xl flex items-center justify-center transition-all ${creative.theme === theme.name ? 'ring-4 ring-[#4F46E5]/20 scale-110 shadow-lg' : 'hover:scale-105'}`}
                                                style={{ background: `linear-gradient(135deg, ${theme.colors[0]}, ${theme.colors[1]})` }}
                                                title={theme.name}
                                            >
                                                {creative.theme === theme.name && <Check className="w-4 h-4 text-white" />}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            </div>

                            {isOwnerOrAdmin && (
                                <button className="w-full py-6 bg-[#4F46E5] text-white rounded-[2rem] font-black uppercase tracking-[0.2rem] text-xs shadow-2xl shadow-[#4F46E5]/30 hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center justify-center gap-4">
                                    <Download className="w-5 h-5" /> Download Creative
                                </button>
                            )}
                        </aside>

                        {/* Live Preview Panel */}
                        <main className="flex-1 space-y-8">
                            <div className="bg-white dark:bg-[#020617] rounded-[3rem] border border-slate-200 dark:border-slate-800 p-8 shadow-xl flex flex-col items-center">
                                <header className="w-full flex items-center justify-between mb-8">
                                    <h3 className="text-sm font-black uppercase tracking-widest flex items-center gap-3">
                                        <Eye className="w-5 h-5 text-[#4F46E5]" /> Live Preview
                                    </h3>
                                    <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-900 p-1 rounded-xl">
                                        {(['SQUARE', 'A4', 'BANNER', 'EMAIL'] as const).map((fmt) => (
                                            <button
                                                key={fmt}
                                                onClick={() => setPreviewFormat(fmt)}
                                                className={`px-4 py-2 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all ${previewFormat === fmt ? 'bg-white dark:bg-[#020617] text-[#4F46E5] shadow-md' : 'text-[#64748B]'}`}
                                            >
                                                {fmt}
                                            </button>
                                        ))}
                                    </div>
                                </header>

                                {/* The Creative Canvas */}
                                <div className={`relative max-w-sm w-full mx-auto shadow-2xl rounded-[2.5rem] overflow-hidden transition-all duration-500 ${formatStyles[previewFormat]}`}>
                                    <div
                                        className="absolute inset-0 transition-colors duration-500"
                                        style={{ background: `linear-gradient(135deg, ${currentTheme.colors[0]}, ${currentTheme.colors[1]})` }}
                                    >
                                        {/* Content Wrapper */}
                                        <div className="h-full flex flex-col p-10 relative z-10">
                                            {/* Branding Header */}
                                            <div className="flex items-center gap-4 mb-8">
                                                <div className="w-12 h-12 bg-white rounded-xl shadow-lg flex items-center justify-center p-2">
                                                    {activeTenant?.loginLogoUrl ? (
                                                        <img src={activeTenant.loginLogoUrl} alt="Logo" className="w-full h-full object-contain" />
                                                    ) : (
                                                        <Plus className="w-6 h-6 text-[#4F46E5]" />
                                                    )}
                                                </div>
                                                <div className="text-white">
                                                    <h4 className="font-black text-sm uppercase tracking-widest">{activeTenant?.name || 'Your Brand'}</h4>
                                                    <p className="text-[10px] uppercase tracking-widest opacity-80">{activeTenant?.sector || 'Global Export'}</p>
                                                </div>
                                            </div>

                                            {/* Hero Image / Space */}
                                            {previewFormat !== 'BANNER' && (
                                                <div className="flex-1 bg-white/10 backdrop-blur-md rounded-[2rem] border border-white/20 mb-8 flex items-center justify-center overflow-hidden">
                                                    {previewImage ? (
                                                        <img src={previewImage} alt="Creative" className="w-full h-full object-cover" />
                                                    ) : (
                                                        <ImageIcon className="w-16 h-16 text-white opacity-20" />
                                                    )}
                                                </div>
                                            )}

                                            {/* Message Section */}
                                            <div className="text-white">
                                                <h2 className={`font-black leading-tight mb-4 ${previewFormat === 'BANNER' ? 'text-2xl' : 'text-3xl'}`}>
                                                    Limited Time Offer
                                                </h2>
                                                <p className="text-sm font-medium leading-relaxed opacity-90 max-w-xs">{creative.message}</p>
                                            </div>

                                            {/* Footer Branding */}
                                            <div className="mt-auto pt-8 border-t border-white/20 flex items-center justify-between text-white">
                                                <div>
                                                    <p className="text-[10px] font-black uppercase tracking-widest opacity-80">Call Us</p>
                                                    <p className="text-sm font-bold">{activeTenant?.companyDetails?.phone || '+91-9999999999'}</p>
                                                </div>
                                                <div className="text-right">
                                                    <p className="text-[10px] font-black uppercase tracking-widest opacity-80">Visit Us</p>
                                                    <p className="text-sm font-bold">{activeTenant?.companyDetails?.city || 'Worldwide'}</p>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                    {/* Glass Overlay Effects */}
                                    <div className="absolute inset-0 bg-gradient-to-tr from-white/5 to-transparent pointer-events-none" />
                                </div>

                                <div className="mt-12 flex flex-wrap justify-center gap-6">
                                    <button className="flex items-center gap-3 px-8 py-4 bg-slate-100 dark:bg-slate-900 rounded-2xl text-xs font-black uppercase tracking-widest hover:bg-slate-200 transition-all">
                                        <Share2 className="w-4 h-4 text-[#4F46E5]" /> Share on WhatsApp
                                    </button>
                                    <button className="flex items-center gap-3 px-8 py-4 bg-slate-100 dark:bg-slate-900 rounded-2xl text-xs font-black uppercase tracking-widest hover:bg-slate-200 transition-all">
                                        <Mail className="w-4 h-4 text-[#4F46E5]" /> Email Campaign
                                    </button>
                                    <button className="flex items-center gap-3 px-8 py-4 bg-slate-100 dark:bg-slate-900 rounded-2xl text-xs font-black uppercase tracking-widest hover:bg-slate-200 transition-all">
                                        <LinkIcon className="w-4 h-4 text-[#4F46E5]" /> Copy Link
                                    </button>
                                </div>
                            </div>
                        </main>
                    </div>
                </div>
            )}
        </div>
    );
};

export default MarketingTools;
