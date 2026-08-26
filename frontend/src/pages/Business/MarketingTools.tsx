import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Megaphone,
    Rocket,
    Tag,
    Calendar,
    Share2,
    Mail,
    Layout as LayoutIcon,
    Image as ImageIcon,
    Palette,
    Download,
    Send,
    Zap,
    ChevronRight,
    Smartphone,
    CheckCircle2,
    Plus,
    UploadCloud
} from 'lucide-react';
import Layout from "../../components/shared/Layout/index.js";
import PageHeader from "../../components/shared/Layout/PageHeader.js";
import BusinessSubNav from './BusinessSubNav.js';

import api from "../../services/api.js";

interface Template {
    id: number;
    name: string;
    category: string;
    icon: React.ReactNode;
    description: string;
    color: string;
}

interface Theme {
    id: string;
    name: string;
    color: string;
    gradient: string;
}

const MarketingTools: React.FC = () => {
    const [selectedTemplate, setSelectedTemplate] = useState<Template | null>(null);
    const [customMessage, setCustomMessage] = useState<string>('');
    const [selectedTheme, setSelectedTheme] = useState<string>('indigo');
    const [uploadedImage, setUploadedImage] = useState<string | null>(null);
    const [isGenerating, setIsGenerating] = useState(false);

    const [instagramAccounts, setInstagramAccounts] = useState<any[]>([]);
    const [selectedAccount, setSelectedAccount] = useState<string>('');
    const [publicImageUrl, setPublicImageUrl] = useState<string>('');
    const [isPublishing, setIsPublishing] = useState(false);

    const fetchAccounts = async () => {
        try {
            const response = await api.get('/api/marketing/meta/pages');
            if (response.data.success) {
                const accounts = response.data.data.filter((p: any) => p.instagramBusinessAccountId);
                setInstagramAccounts(accounts);
                if (accounts.length > 0) {
                    setSelectedAccount(accounts[0].instagramBusinessAccountId);
                }
            }
        } catch (error) {
            console.error("Error fetching accounts", error);
        }
    };

    React.useEffect(() => {
        fetchAccounts();

        // Check for OAuth Callback
        const params = new URLSearchParams(window.location.search);
        const code = params.get('code');
        if (code) {
            handleAuthCallback(code);
        }
    }, []);

    const handleAuthCallback = async (code: string) => {
        try {
            const response = await api.post('/api/marketing/meta/auth/callback', { code });
            if (response.data.success) {
                // Clear query params
                window.history.replaceState({}, document.title, window.location.pathname);
                alert("Successfully connected to Meta!");
                fetchAccounts();
            } else {
                alert("Failed to connect: " + response.data.message);
            }
        } catch (error) {
            console.error("Error confirming Meta auth", error);
        }
    };

    const handlePublish = async () => {
        if (!selectedAccount) {
            alert("Please select an Instagram account");
            return;
        }
        if (!publicImageUrl) {
            alert("Please enter a public Image URL for the API to access");
            return;
        }

        setIsPublishing(true);
        try {
            const response = await api.post('/api/marketing/meta/publish/instagram', {
                instagramAccountId: selectedAccount,
                imageUrl: publicImageUrl,
                caption: customMessage || selectedTemplate?.name || "Check this out!"
            });

            if (response.data.success) {
                alert("Posted to Instagram successfully!");
            } else {
                alert("Failed to post: " + response.data.message);
            }
        } catch (error) {
            console.error("Error publishing", error);
            alert("Error publishing post");
        } finally {
            setIsPublishing(false);
        }
    };

    const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            const reader = new FileReader();
            reader.onloadend = () => {
                setUploadedImage(reader.result as string);
            };
            reader.readAsDataURL(file);
        }
    };

    const templates: Template[] = [
        { id: 1, name: 'Sale Announcement', category: 'Flyer', icon: <Megaphone className="w-6 h-6" />, description: 'Announce special sales and offers', color: 'blue' },
        { id: 2, name: 'Product Launch', category: 'Banner', icon: <Rocket className="w-6 h-6" />, description: 'Promote new premium products', color: 'purple' },
        { id: 3, name: 'Discount Offer', category: 'Offer', icon: <Tag className="w-6 h-6" />, description: 'Share limited time discount deals', color: 'orange' },
        { id: 4, name: 'Event Invite', category: 'Events', icon: <Calendar className="w-6 h-6" />, description: 'Professional business event invites', color: 'emerald' },
        { id: 5, name: 'Social Media', category: 'Social', icon: <Share2 className="w-6 h-6" />, description: 'Viral-ready social media content', color: 'pink' },
        { id: 6, name: 'Email Campaign', category: 'Email', icon: <Mail className="w-6 h-6" />, description: 'High-conversion email templates', color: 'indigo' }
    ];

    const themes: Theme[] = [
        { id: 'indigo', name: 'Royal Indigo', color: 'bg-indigo-600', gradient: 'from-indigo-600 to-violet-700' },
        { id: 'rose', name: 'Rose Gold', color: 'bg-rose-500', gradient: 'from-rose-500 to-pink-600' },
        { id: 'emerald', name: 'Deep Emerald', color: 'bg-emerald-600', gradient: 'from-emerald-600 to-teal-700' },
        { id: 'amber', name: 'Sunset Amber', color: 'bg-amber-500', gradient: 'from-amber-500 to-orange-600' },
        { id: 'slate', name: 'Midnight', color: 'bg-slate-800', gradient: 'from-slate-800 to-slate-900' }
    ];

    const suggestions = [
        'Add customer testimonials to build trust',
        'Use high-quality product images',
        'Include clear call-to-action buttons',
        'Optimize for mobile viewing',
        'A/B test different headlines'
    ];

    const containerVariants = {
        hidden: { opacity: 0, y: 20 },
        visible: {
            opacity: 1,
            y: 0,
            transition: { duration: 0.5, staggerChildren: 0.1 }
        }
    };

    const itemVariants = {
        hidden: { opacity: 0, y: 10 },
        visible: { opacity: 1, y: 0 }
    };

    const handleConnect = async () => {
        try {
            const response = await api.get('/api/marketing/meta/auth/url');
            if (response.data.success && response.data.url) {
                window.location.href = response.data.url;
            } else {
                alert("Failed to initiate connection.");
            }
        } catch (error) {
            console.error("Error connecting", error);
            alert("Error connecting to Meta.");
        }
    };

    return (
        <Layout>
            <div className="min-h-screen bg-[#f8fafc]">
                {/* <PageHeader
                    title="Marketing Suite"
                    description="Professional-grade tools to scale your brand presence"
                    breadcrumbs={[
                        { label: 'Dashboard', link: '/' },
                        { label: 'Business', link: '/business/online-shop' },
                        { label: 'Marketing' }
                    ]}
                /> */}

                {/* <BusinessSubNav /> */}

                <motion.div
                    initial="hidden"
                    animate="visible"
                    variants={containerVariants}
                    className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8"
                >
                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                        {/* Editor Section */}
                        <div className="lg:col-span-8 space-y-8">
                            {/* Template Discovery */}
                            <motion.div variants={itemVariants} className="bg-white rounded-sm shadow-sm border border-slate-200 p-8 overflow-hidden relative">
                                <div className="absolute top-0 right-0 -mt-4 -mr-4 w-24 h-24 bg-indigo-50 rounded-full blur-3xl opacity-50" />
                                <div className="relative z-10">
                                    <div className="flex items-center justify-between mb-8">
                                        <div>
                                            <h2 className="text-2xl font-bold text-slate-900 tracking-tight">Template Gallery</h2>
                                            <p className="text-slate-500 text-sm mt-1">Start with a professionally crafted foundation</p>
                                        </div>
                                        <div className="flex -space-x-2">
                                            {[1, 2, 3].map(i => (
                                                <div key={i} className="w-8 h-8 rounded-full border-2 border-white bg-slate-100 flex items-center justify-center overflow-hidden">
                                                    <img src={`https://i.pravatar.cc/100?u=${i}`} alt="user" className="w-full h-full object-cover" />
                                                </div>
                                            ))}
                                            <div className="w-8 h-8 rounded-full border-2 border-white bg-indigo-600 flex items-center justify-center text-[10px] text-white font-bold">+12</div>
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                                        {templates.map((template) => (
                                            <motion.div
                                                key={template.id}
                                                whileHover={{ y: -4 }}
                                                whileTap={{ scale: 0.98 }}
                                                onClick={() => setSelectedTemplate(template)}
                                                className={`group relative p-5 rounded-sm border-2 cursor-pointer transition-all duration-300 ${selectedTemplate?.id === template.id
                                                    ? 'border-indigo-600 bg-indigo-50/30'
                                                    : 'border-slate-100 hover:border-indigo-200 hover:bg-slate-50/50'
                                                    }`}
                                            >
                                                <div className={`w-12 h-12 rounded-xl flex items-center justify-center mb-4 transition-transform group-hover:scale-110 shadow-sm ${selectedTemplate?.id === template.id ? 'bg-indigo-600 text-white' : 'bg-white text-slate-600'
                                                    }`}>
                                                    {template.icon}
                                                </div>
                                                <h3 className="font-bold text-slate-900 mb-1 flex items-center">
                                                    {template.name}
                                                    {template.id === 1 && <span className="ml-2 w-2 h-2 bg-indigo-500 rounded-full animate-pulse" />}
                                                </h3>
                                                <p className="text-xs text-slate-500 mb-4 line-clamp-2 leading-relaxed">{template.description}</p>
                                                <div className="flex items-center justify-between">
                                                    <span className="text-[10px] uppercase tracking-wider font-bold text-primary bg-indigo-50 px-2 py-0.5 rounded">
                                                        {template.category}
                                                    </span>
                                                    <ChevronRight className={`w-4 h-4 transition-transform ${selectedTemplate?.id === template.id ? 'text-primary translate-x-0' : 'text-slate-300 -translate-x-2 opacity-0 group-hover:opacity-100 group-hover:translate-x-0'}`} />
                                                </div>
                                            </motion.div>
                                        ))}
                                    </div>
                                </div>
                            </motion.div>

                            {/* Creative Canvas */}
                            <motion.div variants={itemVariants} className="bg-white rounded-sm shadow-sm border border-slate-200 overflow-hidden">
                                <div className="border-b border-slate-100 p-6 flex items-center justify-between">
                                    <div className="flex items-center space-x-3">
                                        <div className="p-2 bg-indigo-50 rounded-lg">
                                            <Palette className="w-5 h-5 text-primary" />
                                        </div>
                                        <h2 className="text-xl font-bold text-slate-900">Creative Editor</h2>
                                    </div>
                                    <div className="flex items-center space-x-2 text-xs font-medium text-slate-400">
                                        <span className="w-2 h-2 bg-emerald-500 rounded-full" />
                                        <span>Autosaved</span>
                                    </div>
                                </div>

                                <div className="p-8 space-y-8">
                                    {/* Message Input */}
                                    <div>
                                        <label className="flex items-center justify-between text-sm font-semibold text-slate-700 mb-3">
                                            <span>Campaign Message</span>
                                            <span className="text-xs font-normal text-slate-400">{280 - customMessage.length} characters left</span>
                                        </label>
                                        <textarea
                                            value={customMessage}
                                            onChange={(e) => setCustomMessage(e.target.value)}
                                            rows={4}
                                            className="w-full px-5 py-4 rounded-xl border border-slate-200 focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all outline-none text-slate-700 bg-slate-50/30 placeholder:text-slate-400"
                                            placeholder="Ex: Flash Sale! 50% OFF on all premium collections. Don't miss out! 🚀"
                                        ></textarea>
                                    </div>

                                    {/* Asset Upload */}
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        <div className="space-y-4">
                                            <label className="block text-sm font-semibold text-slate-700">Creative Visual</label>

                                            {/* URL Input for API */}
                                            <input
                                                type="text"
                                                value={publicImageUrl}
                                                onChange={(e) => setPublicImageUrl(e.target.value)}
                                                className="w-full px-4 py-3 rounded-xl border border-slate-200 text-sm focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all outline-none"
                                                placeholder="Public Image URL (Required for API)"
                                            />

                                            <label className="group relative border-2 border-dashed border-slate-200 rounded-sm p-6 flex flex-col items-center justify-center hover:bg-slate-50 hover:border-indigo-300 transition-all cursor-pointer overflow-hidden">
                                                <input type="file" className="hidden" accept="image/*" onChange={handleImageUpload} />

                                                {uploadedImage ? (
                                                    <div className="absolute inset-0 z-0">
                                                        <img src={uploadedImage} alt="Preview" className="w-full h-full object-cover opacity-10 blur-[2px]" />
                                                    </div>
                                                ) : (
                                                    <div className="w-12 h-12 bg-slate-50 text-slate-400 rounded-xl flex items-center justify-center mb-3 group-hover:scale-110 group-hover:bg-indigo-50 group-hover:text-primary transition-all">
                                                        <UploadCloud className="w-6 h-6" />
                                                    </div>
                                                )}

                                                <div className="relative z-10 text-center">
                                                    <p className="text-sm font-bold text-slate-700">
                                                        {uploadedImage ? "Replace Visual" : "Drop Visual Here"}
                                                    </p>
                                                    <p className="text-[10px] text-slate-400 mt-1 uppercase tracking-wider">PNG, JPG • Max 5MB</p>
                                                </div>
                                            </label>
                                        </div>

                                        {/* Theme Selection */}
                                        <div>
                                            <label className="block text-sm font-semibold text-slate-700 mb-3">Brand Theme</label>
                                            <div className="grid grid-cols-5 gap-3">
                                                {themes.map((theme) => (
                                                    <button
                                                        key={theme.id}
                                                        onClick={() => setSelectedTheme(theme.id)}
                                                        className={`relative group p-1 rounded-xl transition-all ${selectedTheme === theme.id ? 'ring-2 ring-indigo-500 ring-offset-2' : 'hover:scale-105'
                                                            }`}
                                                    >
                                                        <div className={`aspect-square rounded-lg ${theme.color} shadow-sm`} />
                                                        <AnimatePresence>
                                                            {selectedTheme === theme.id && (
                                                                <motion.div
                                                                    initial={{ scale: 0 }}
                                                                    animate={{ scale: 1 }}
                                                                    className="absolute -top-1 -right-1 w-4 h-4 bg-indigo-600 text-white rounded-full flex items-center justify-center shadow-lg"
                                                                >
                                                                    <CheckCircle2 className="w-3 h-3" />
                                                                </motion.div>
                                                            )}
                                                        </AnimatePresence>
                                                    </button>
                                                ))}
                                            </div>
                                            <p className="mt-3 text-[10px] text-slate-400 font-medium italic underline cursor-pointer hover:text-primary">Sync with brand guidelines</p>
                                        </div>
                                    </div>
                                </div>
                            </motion.div>
                        </div>

                        {/* Preview Sidebar */}
                        <div className="lg:col-span-4 space-y-8">
                            <motion.div variants={itemVariants} className="sticky top-8 space-y-8">
                                {/* iPhone Mockup */}
                                <div className="bg-white rounded-[2.5rem] shadow-2xl border-[8px] border-slate-900 p-2 relative overflow-hidden max-w-[320px] mx-auto group">
                                    {/* Notch */}
                                    <div className="absolute top-0 left-1/2 -translate-x-1/2 w-32 h-6 bg-slate-900 rounded-b-2xl z-20 flex items-center justify-center space-x-1">
                                        <div className="w-8 h-1 bg-slate-800 rounded-full opacity-50" />
                                        <div className="w-2 h-2 bg-slate-800 rounded-full opacity-50" />
                                    </div>

                                    <div className="bg-slate-50 rounded-[2rem] overflow-hidden min-h-[520px] flex flex-col">
                                        {/* Status Bar */}
                                        <div className="h-6 mt-4 px-6 flex justify-between items-center z-10">
                                            <span className="text-[10px] font-bold text-slate-800">9:41</span>
                                            <div className="flex items-center space-x-1">
                                                <div className="w-3 h-2 border border-slate-800 rounded-sm" />
                                                <div className="w-3 h-3 bg-slate-800 rounded-full opacity-20" />
                                            </div>
                                        </div>

                                        {/* Mock App Header */}
                                        <div className="px-5 py-4 border-b border-slate-100 flex items-center space-x-3">
                                            <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-indigo-500 to-purple-600 flex items-center justify-center text-white shadow-lg">
                                                <Zap className="w-5 h-5" />
                                            </div>
                                            <div>
                                                <p className="text-xs font-bold text-slate-900">BizzAI Pro</p>
                                                <p className="text-[9px] text-slate-500 font-medium">Business Account</p>
                                            </div>
                                        </div>

                                        {/* Preview Content Area */}
                                        <div className="flex-1 p-5 flex flex-col justify-center">
                                            <AnimatePresence mode="wait">
                                                {selectedTemplate ? (
                                                    <motion.div
                                                        key={selectedTemplate.id}
                                                        initial={{ opacity: 0, scale: 0.95 }}
                                                        animate={{ opacity: 1, scale: 1 }}
                                                        exit={{ opacity: 0, scale: 0.9 }}
                                                        className="w-full bg-white rounded-sm shadow-[0_8px_30px_rgb(0,0,0,0.04)] overflow-hidden border border-slate-100/50"
                                                    >
                                                        {uploadedImage || publicImageUrl ? (
                                                            <div className="relative h-48 group-hover:scale-105 transition-transform duration-700">
                                                                <img src={publicImageUrl || uploadedImage || ""} alt="Post" className="w-full h-full object-cover" />
                                                                <div className={`absolute inset-0 bg-gradient-to-t opacity-40 ${themes.find(t => t.id === selectedTheme)?.gradient}`} />
                                                            </div>
                                                        ) : (
                                                            <div className={`h-48 flex items-center justify-center bg-gradient-to-br transition-all duration-500 ${themes.find(t => t.id === selectedTheme)?.gradient}`}>
                                                                <div className="p-4 bg-white/20 backdrop-blur-md rounded-sm border border-white/30 text-white">
                                                                    {React.cloneElement(selectedTemplate.icon as React.ReactElement<{ className?: string }>, { className: 'w-12 h-12' })}
                                                                </div>
                                                            </div>
                                                        )}

                                                        <div className="p-5">
                                                            <div className="flex items-center space-x-2 mb-3">
                                                                <span className="text-[9px] font-bold text-primary uppercase tracking-widest bg-indigo-50 px-2 py-0.5 rounded">
                                                                    {selectedTemplate.category}
                                                                </span>
                                                            </div>
                                                            <h3 className="font-bold text-slate-900 text-base mb-2">{selectedTemplate.name}</h3>
                                                            <p className="text-sm text-slate-500 leading-relaxed min-h-[60px]">
                                                                {customMessage || "Type your message in the editor to see it come to life..."}
                                                            </p>
                                                            <div className={`mt-6 h-10 rounded-xl flex items-center justify-center text-white text-xs font-bold shadow-lg transition-all duration-500 bg-gradient-to-r ${themes.find(t => t.id === selectedTheme)?.gradient}`}>
                                                                Learn More
                                                            </div>
                                                        </div>
                                                    </motion.div>
                                                ) : (
                                                    <div className="text-center p-8 space-y-4">
                                                        <div className="w-20 h-20 bg-slate-100 rounded-sm mx-auto flex items-center justify-center animate-pulse">
                                                            <LayoutIcon className="w-8 h-8 text-slate-300" />
                                                        </div>
                                                        <p className="text-sm font-medium text-slate-400">Select a template to<br />begin crafting</p>
                                                    </div>
                                                )}
                                            </AnimatePresence>
                                        </div>

                                        {/* Mock Home Indicator */}
                                        <div className="h-1 w-20 bg-slate-300 rounded-full mx-auto mb-4 opacity-50" />
                                    </div>
                                </div>

                                {/* Action Buttons */}
                                <div className="space-y-3">
                                    <motion.button
                                        whileHover={{ scale: 1.02 }}
                                        whileTap={{ scale: 0.98 }}
                                        disabled={isGenerating}
                                        onClick={() => {
                                            setIsGenerating(true);
                                            setTimeout(() => setIsGenerating(false), 2000);
                                        }}
                                        className="btn-primary w-full py-4 bg-indigo-600 hover:bg-indigo-700 text-white rounded-sm font-bold shadow-xl shadow-indigo-200 flex items-center justify-center space-x-2 relative overflow-hidden"
                                    >
                                        {isGenerating ? (
                                            <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                        ) : (
                                            <>
                                                <Download className="w-5 h-5" />
                                                <span>Download Ultra HD</span>
                                            </>
                                        )}
                                    </motion.button>

                                    {instagramAccounts.length > 0 ? (
                                        <div className="mb-2">
                                            <label className="block text-xs font-bold text-slate-500 mb-1 ml-1">Select Instagram Account</label>
                                            <select
                                                value={selectedAccount}
                                                onChange={(e) => setSelectedAccount(e.target.value)}
                                                className="w-full px-4 py-2 rounded-xl border border-indigo-100 text-xs font-bold text-slate-700 bg-indigo-50/50 outline-none focus:ring-2 focus:ring-indigo-500 mb-2"
                                            >
                                                {instagramAccounts.map(account => (
                                                    <option key={account.instagramBusinessAccountId} value={account.instagramBusinessAccountId}>
                                                        {account.name} (Insta)
                                                    </option>
                                                ))}
                                            </select>
                                        </div>
                                    ) : (
                                        <div className="mb-2 p-3 bg-amber-50 rounded-xl border border-amber-100 text-amber-800 text-xs font-medium text-center">
                                            No Instagram accounts connected.
                                            <button onClick={handleConnect} className="text-primary font-bold underline ml-1 hover:text-indigo-700">Connect Now</button>
                                        </div>
                                    )}

                                    <div className="grid grid-cols-2 gap-3">
                                        <button
                                            onClick={handlePublish}
                                            disabled={isPublishing}
                                            className="flex items-center justify-center space-x-2 py-3.5 border border-slate-200 text-slate-700 font-bold rounded-sm hover:bg-slate-50 transition-all disabled:opacity-50"
                                        >
                                            {isPublishing ? <div className="w-4 h-4 border-2 border-slate-500 border-t-transparent rounded-full animate-spin" /> : <Share2 className="w-4 h-4" />}
                                            <span className="text-sm">Post to Insta</span>
                                        </button>
                                        <button className="flex items-center justify-center space-x-2 py-3.5 border border-slate-200 text-slate-700 font-bold rounded-sm hover:bg-slate-50 transition-all">
                                            <Smartphone className="w-4 h-4" />
                                            <span className="text-sm">Preview App</span>
                                        </button>
                                    </div>
                                </div>

                                {/* Pro Tips */}
                                <div className="bg-gradient-to-br from-indigo-900 to-indigo-950 rounded-[2rem] p-8 text-white relative overflow-hidden shadow-2xl">
                                    <div className="absolute top-0 right-0 -mt-10 -mr-10 w-32 h-32 bg-indigo-500 rounded-full blur-[80px] opacity-40" />
                                    <div className="relative z-10">
                                        <div className="flex items-center space-x-2 mb-6 text-indigo-300">
                                            <Zap className="w-5 h-5 fill-current" />
                                            <span className="text-xs font-bold uppercase tracking-[0.2em]">Strategy Guide</span>
                                        </div>
                                        <h4 className="text-lg font-bold mb-6">Master Your Marketing</h4>
                                        <ul className="space-y-4">
                                            {suggestions.map((tip, idx) => (
                                                <motion.li
                                                    key={idx}
                                                    initial={{ opacity: 0, x: -10 }}
                                                    animate={{ opacity: 1, x: 0 }}
                                                    transition={{ delay: 0.5 + idx * 0.1 }}
                                                    className="flex items-start space-x-4 group cursor-default"
                                                >
                                                    <div className="mt-1 p-0.5 bg-primary/20 rounded-full border border-primary/30 group-hover:bg-indigo-500 transition-colors">
                                                        <CheckCircle2 className="w-3.5 h-3.5" />
                                                    </div>
                                                    <span className="text-sm text-indigo-100/80 leading-snug font-medium group-hover:text-white transition-colors">{tip}</span>
                                                </motion.li>
                                            ))}
                                        </ul>
                                        <button className="mt-8 w-full py-4 bg-white/10 hover:bg-white/20 border border-white/20 rounded-sm text-xs font-bold transition-all flex items-center justify-center space-x-2">
                                            <span>Full Strategy E-Book</span>
                                            <Plus className="w-4 h-4" />
                                        </button>
                                    </div>
                                </div>
                            </motion.div>
                        </div>
                    </div>
                </motion.div>
            </div>
        </Layout>
    );
};

export default MarketingTools;

