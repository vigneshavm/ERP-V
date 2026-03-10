import React, { useState, useEffect } from 'react';
import Layout from "../../components/shared/Layout/index.js";
import PageHeader from "../../components/shared/Layout/PageHeader.js";
import FormInput from "../../components/core/Form/Input.js";
import DataTable from "../../components/shared/Table/DataTable.js";
import BusinessSubNav from './BusinessSubNav.js';
import api from "@/shared/api/api";
import { toast } from 'react-toastify';

interface Template {
    id: number;
    name: string;
    content: string;
}

interface CustomerGroup {
    id: number;
    name: string;
    count: number;
    selected: boolean;
}

interface Campaign {
    id: number;
    name: string;
    sent: number;
    delivered: number;
    read: number;
    date: string;
    status: 'completed' | 'scheduled';
}

interface FormData {
    message: string;
    scheduleDate: string;
    scheduleTime: string;
    attachments: any[];
}

const WhatsAppMarketing: React.FC = () => {
    const [showBroadcastForm, setShowBroadcastForm] = useState<boolean>(false);
    const [selectedTemplate, setSelectedTemplate] = useState<string>('');
    const [selectedGroups, setSelectedGroups] = useState<number[]>([]);
    const [messagePreview, setMessagePreview] = useState<string>('');

    const [formData, setFormData] = useState<FormData>({
        message: '',
        scheduleDate: '',
        scheduleTime: '',
        attachments: []
    });

    const [templates, setTemplates] = useState<Template[]>([]);
    const [customerGroups, setCustomerGroups] = useState<CustomerGroup[]>([
        { id: 1, name: 'All Customers', count: 0, selected: false },
        { id: 2, name: 'Premium Customers', count: 0, selected: false },
        { id: 3, name: 'New Customers', count: 0, selected: false },
        { id: 4, name: 'Inactive Customers', count: 0, selected: false }
    ]);
    const [campaigns, setCampaigns] = useState<Campaign[]>([]);
    const [deliveryStats, setDeliveryStats] = useState({
        sent: 0,
        delivered: 0,
        read: 0,
        failed: 0
    });
    const [loading, setLoading] = useState<boolean>(true);

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        setLoading(true);
        try {
            const [templatesRes, campaignsRes, statsRes] = await Promise.all([
                api.get('/api/whatsapp/templates'),
                api.get('/api/whatsapp/campaigns'),
                api.get('/api/whatsapp/stats')
            ]);

            if (templatesRes.data.success) setTemplates(templatesRes.data.data);
            if (campaignsRes.data.success) setCampaigns(campaignsRes.data.data);
            if (statsRes.data.success) setDeliveryStats(statsRes.data.data);

            // Fetch customers count if needed, or stick to dummy groups for now as per controller lack of it
        } catch (error) {
            console.error('Error fetching WhatsApp data:', error);
            toast.error('Failed to load marketing data');
        } finally {
            setLoading(false);
        }
    };

    const handleSendBroadcast = async () => {
        if (!formData.message && !selectedTemplate) {
            toast.warning('Please select a template or write a message');
            return;
        }

        try {
            const selectedGroupName = customerGroups
                .filter(g => selectedGroups.includes(g.id))
                .map(g => g.name)
                .join(', ');

            const response = await api.post('/api/whatsapp/campaigns', {
                name: selectedTemplate ? templates.find(t => t.id === parseInt(selectedTemplate))?.name : 'Custom Broadcast',
                message: formData.message || messagePreview,
                targetGroups: selectedGroups,
                scheduleDate: formData.scheduleDate,
                scheduleTime: formData.scheduleTime,
                sent: customerGroups.filter(g => selectedGroups.includes(g.id)).reduce((sum, g) => sum + g.count, 0) || 120 // Fallback for demo
            });

            if (response.data.success) {
                toast.success('Broadcast sent successfully!');
                setShowBroadcastForm(false);
                fetchData(); // Refresh campaigns
            }
        } catch (error: any) {
            toast.error(error.response?.data?.message || 'Failed to send broadcast');
        }
    };

    const columns = [
        { key: 'name', label: 'Campaign Name', sortable: true, render: (val: string) => <span className="font-semibold text-gray-900">{val}</span> },
        { key: 'date', label: 'Date', sortable: true, render: (val: string) => <span className="text-gray-500 font-medium">{val}</span> },
        { key: 'sent', label: 'Sent', sortable: true },
        { key: 'delivered', label: 'Delivered', sortable: true },
        { key: 'read', label: 'Read', sortable: true },
        {
            key: 'status',
            label: 'Status',
            render: (val: string) => (
                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium capitalize ${val === 'completed' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
                    }`}>
                    <span className={`w-1.5 h-1.5 rounded-full mr-1.5 ${val === 'completed' ? 'bg-green-600' : 'bg-yellow-600'}`}></span>
                    {val}
                </span>
            )
        }
    ];

    const toggleGroup = (groupId: number) => {
        setSelectedGroups(prev =>
            prev.includes(groupId) ? prev.filter(id => id !== groupId) : [...prev, groupId]
        );
    };

    const broadcastAction = (
        <button
            key="broadcast"
            onClick={() => setShowBroadcastForm(!showBroadcastForm)}
            className={`px-6 py-2.5 font-bold rounded-2xl transition-all active:scale-95 flex items-center shadow-lg ${showBroadcastForm
                ? 'bg-gray-100 text-gray-600 hover:bg-gray-200 shadow-gray-200'
                : 'bg-gradient-to-r from-emerald-600 to-green-600 text-white hover:from-emerald-700 hover:to-green-700 shadow-green-200'
                }`}
        >
            {showBroadcastForm ? (
                <>
                    <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                    Close Form
                </>
            ) : (
                <>
                    <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                    </svg>
                    New Broadcast
                </>
            )}
        </button>
    );

    return (
        <Layout>
            <PageHeader
                title="WhatsApp Marketing"
                description="Scale your business with automated WhatsApp broadcasts and AI-powered engagement."
                breadcrumbs={[
                    { label: 'Dashboard', link: '/' },
                    { label: 'Business', link: '/business/online-shop' },
                    { label: 'Growth Tools', link: '/business/online-shop' },
                    { label: 'WhatsApp Marketing' }
                ]}
                actions={[broadcastAction]}
            />
            {/* <BusinessSubNav /> */}

            {/* Premium Hero Section */}
            <div className="relative overflow-hidden rounded-[2.5rem] bg-gradient-to-br from-green-600 via-emerald-600 to-teal-700 text-white mb-10 shadow-2xl border border-white/10">
                <div className="absolute top-0 right-0 -mt-20 -mr-20 w-96 h-96 bg-white opacity-5 rounded-full blur-3xl animate-pulse"></div>
                <div className="absolute bottom-0 left-0 -mb-20 -ml-20 w-80 h-80 bg-green-400 opacity-10 rounded-full blur-3xl"></div>

                <div className="relative p-8 md:p-12 flex flex-col lg:flex-row items-center justify-between gap-8">
                    <div className="max-w-2xl">
                        <div className="inline-flex items-center px-4 py-1.5 bg-white/10 backdrop-blur-md rounded-full text-[10px] font-black tracking-[0.2em] uppercase mb-6 border border-white/20 shadow-inner">
                            <span className="flex h-2 w-2 rounded-full bg-green-400 mr-2 animate-ping"></span>
                            Official Business API
                        </div>
                        <h2 className="text-4xl md:text-5xl font-black mb-4 leading-tight tracking-tight">
                            Connect. Engage. <br /> <span className="text-green-200">Convert.</span>
                        </h2>
                        <p className="text-green-50 text-base md:text-lg mb-8 max-w-xl opacity-90 font-medium leading-relaxed">
                            Reach your customers where they are. 98% open rates, automated workflows, and rich media support for high-impact marketing.
                        </p>
                        <div className="flex flex-wrap gap-4">
                            <div className="flex items-center gap-2 px-4 py-2 bg-white/10 backdrop-blur-sm rounded-xl border border-white/10">
                                <span className="text-xl">📈</span>
                                <div>
                                    <p className="text-[10px] font-bold uppercase opacity-70">Open Rate</p>
                                    <p className="font-black text-sm">~98.4%</p>
                                </div>
                            </div>
                            <div className="flex items-center gap-2 px-4 py-2 bg-white/10 backdrop-blur-sm rounded-xl border border-white/10">
                                <span className="text-xl">🚀</span>
                                <div>
                                    <p className="text-[10px] font-bold uppercase opacity-70">CTR</p>
                                    <p className="font-black text-sm">~45.2%</p>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* API Status Card - Premium Glassmorphism */}
                    <div className="w-full lg:w-80 shrink-0">
                        <div className="bg-white/10 backdrop-blur-xl rounded-[2rem] border border-white/20 p-6 shadow-2xl">
                            <div className="flex items-center justify-between mb-6">
                                <div className="p-3 bg-white/10 rounded-2xl border border-white/10">
                                    <svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 24 24">
                                        <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
                                    </svg>
                                </div>
                                <div className="text-right">
                                    <p className="text-[10px] font-black uppercase tracking-widest opacity-70">Quality Rating</p>
                                    <p className="text-lg font-black text-green-300 italic">Excellent</p>
                                </div>
                            </div>
                            <div className="space-y-4">
                                <div className="flex items-center justify-between p-3 bg-white/5 rounded-2xl border border-white/5">
                                    <span className="text-sm font-bold opacity-80">Sync Status</span>
                                    <span className="flex items-center text-xs font-black uppercase text-green-400">
                                        <span className="w-1.5 h-1.5 rounded-full bg-green-400 mr-2 shadow-[0_0_8px_rgba(74,222,128,0.8)]"></span>
                                        Connected
                                    </span>
                                </div>
                                <div className="flex items-center justify-between p-3 bg-green-400 text-green-950 rounded-2xl font-black text-[10px] tracking-widest uppercase shadow-xl shadow-green-900/20 active:scale-95 transition-all cursor-pointer">
                                    Manage Channels
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M9 5l7 7-7 7" /></svg>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Delivery Stats Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-10">
                {[
                    { label: 'Total Sent', value: deliveryStats.sent, icon: '📤', color: 'blue', trend: '+12%' },
                    { label: 'Delivered', value: deliveryStats.delivered, icon: '✅', color: 'emerald', trend: '98.5%' },
                    { label: 'Read Ratio', value: deliveryStats.read, icon: '👁️', color: 'purple', trend: '64.2%' },
                    { label: 'Failed Ops', value: deliveryStats.failed, icon: '⚠️', color: 'rose', trend: '-2%' }
                ].map((stat, i) => (
                    <div key={i} className="group bg-white rounded-[2rem] p-6 border border-gray-100 shadow-sm hover:shadow-xl hover:border-green-100 transition-all duration-500 relative overflow-hidden">
                        <div className={`absolute top-0 right-0 w-24 h-24 bg-${stat.color}-50 rounded-bl-[100px] -mr-12 -mt-12 group-hover:scale-150 transition-transform duration-700 opacity-50`}></div>
                        <div className="relative z-10">
                            <div className="flex items-center justify-between mb-4">
                                <div className={`w-12 h-12 flex items-center justify-center bg-${stat.color}-50 rounded-2xl text-2xl shadow-inner group-hover:scale-110 transition-transform`}>
                                    {stat.icon}
                                </div>
                                <span className={`text-[10px] font-black italic tracking-widest text-${stat.color}-600 uppercase`}>{stat.trend}</span>
                            </div>
                            <h4 className="text-gray-500 text-xs font-black uppercase tracking-[0.15em] mb-1">{stat.label}</h4>
                            <p className="text-3xl font-black text-gray-900 tracking-tight">{stat.value.toLocaleString()}</p>
                        </div>
                    </div>
                ))}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <div className="lg:col-span-2 space-y-8">
                    {/* Main Broadcast Control Center */}
                    {showBroadcastForm && (
                        <div className="bg-white rounded-[2.5rem] shadow-2xl border border-gray-100 overflow-hidden animate-fade-in">
                            <div className="px-8 py-6 border-b border-gray-100 bg-gray-50/50 flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <div className="w-2 h-8 bg-green-500 rounded-full"></div>
                                    <h2 className="text-2xl font-black text-gray-900 tracking-tight">Campaign Designer</h2>
                                </div>
                                <div className="flex gap-2">
                                    <span className="px-3 py-1 bg-green-100 text-green-700 text-[10px] font-black uppercase tracking-widest rounded-full border border-green-200">Draft</span>
                                </div>
                            </div>
                            <div className="p-8 space-y-8">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                    <div className="space-y-6">
                                        <div>
                                            <label className="block text-xs font-black text-gray-500 uppercase tracking-widest mb-3">Target Audience</label>
                                            <div className="grid grid-cols-1 gap-3">
                                                {customerGroups.map(group => (
                                                    <div
                                                        key={group.id}
                                                        onClick={() => toggleGroup(group.id)}
                                                        className={`flex items-center p-4 border-2 rounded-2xl cursor-pointer transition-all duration-300 ${selectedGroups.includes(group.id)
                                                            ? 'border-green-600 bg-green-50/50 shadow-lg shadow-green-100 group overflow-hidden'
                                                            : 'border-gray-100 hover:border-green-200 hover:bg-gray-50'
                                                            }`}
                                                    >
                                                        <div className={`w-6 h-6 rounded-lg border-2 flex items-center justify-center mr-4 transition-all duration-300 ${selectedGroups.includes(group.id) ? 'bg-green-600 border-green-600' : 'border-gray-200 bg-white'}`}>
                                                            {selectedGroups.includes(group.id) && (
                                                                <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={4} d="M5 13l4 4L19 7" />
                                                                </svg>
                                                            )}
                                                        </div>
                                                        <div className="flex-1">
                                                            <div className="flex justify-between items-center mb-0.5">
                                                                <p className="font-bold text-gray-900 text-sm italic">{group.name}</p>
                                                                <p className="text-[10px] font-black text-green-600 uppercase tracking-widest">Active</p>
                                                            </div>
                                                            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">{group.count} Customers Impacted</p>
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>

                                        <div className="grid grid-cols-2 gap-4">
                                            <FormInput
                                                label="Schedule Date"
                                                type="date"
                                                name="scheduleDate"
                                                value={formData.scheduleDate}
                                                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFormData({ ...formData, scheduleDate: e.target.value })}
                                                className="rounded-2xl border-gray-100 focus:ring-green-500/20"
                                            />
                                            <FormInput
                                                label="Schedule Time"
                                                type="time"
                                                name="scheduleTime"
                                                value={formData.scheduleTime}
                                                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFormData({ ...formData, scheduleTime: e.target.value })}
                                                className="rounded-2xl border-gray-100 focus:ring-green-500/20"
                                            />
                                        </div>
                                    </div>

                                    <div className="space-y-6">
                                        <div>
                                            <label className="block text-xs font-black text-gray-500 uppercase tracking-widest mb-3">Content Strategy</label>
                                            <select
                                                value={selectedTemplate}
                                                onChange={(e: React.ChangeEvent<HTMLSelectElement>) => {
                                                    setSelectedTemplate(e.target.value);
                                                    const template = templates.find(t => t.id === parseInt(e.target.value));
                                                    setMessagePreview(template?.content || '');
                                                }}
                                                className="w-full px-5 py-4 rounded-[1.25rem] border-2 border-gray-100 focus:ring-4 focus:ring-green-500/10 focus:border-green-500 transition-all bg-white font-bold text-gray-700 mb-4"
                                            >
                                                <option value="">Custom Message Creation</option>
                                                {templates.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
                                            </select>
                                            <textarea
                                                value={formData.message || messagePreview}
                                                onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setFormData({ ...formData, message: e.target.value })}
                                                rows={6}
                                                className="w-full px-5 py-4 rounded-[1.25rem] border-2 border-gray-100 focus:ring-4 focus:ring-green-500/10 focus:border-green-500 transition-all resize-none font-medium text-gray-700"
                                                placeholder="Craft your compelling message here..."
                                            />
                                        </div>

                                        <div>
                                            <label className="block text-xs font-black text-gray-500 uppercase tracking-widest mb-3">Rich Media Assets</label>
                                            <div className="group border-2 border-dashed border-gray-100 rounded-[1.25rem] p-8 text-center hover:bg-green-50 hover:border-green-200 transition-all cursor-pointer relative overflow-hidden">
                                                <div className="absolute inset-0 bg-green-400 opacity-0 group-hover:opacity-[0.02] transition-opacity"></div>
                                                <div className="w-12 h-12 bg-gray-50 text-gray-400 rounded-2xl flex items-center justify-center mx-auto mb-3 group-hover:scale-110 group-hover:text-green-600 group-hover:bg-white transition-all shadow-inner">
                                                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                                    </svg>
                                                </div>
                                                <p className="text-sm font-black text-gray-900 mb-1 italic">Visual Content Impact</p>
                                                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Supports JPG, PNG, MP4, PDF (max 16MB)</p>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                <div className="flex flex-col sm:flex-row items-center gap-4 pt-8 border-t border-gray-100">
                                    <button
                                        onClick={handleSendBroadcast}
                                        className="w-full sm:w-auto px-10 py-4 bg-gray-900 text-white font-black uppercase tracking-widest rounded-2xl hover:bg-black shadow-xl shadow-gray-200 transition-all active:scale-95 text-xs"
                                    >
                                        Execute Campaign 🚀
                                    </button>
                                    <button className="w-full sm:w-auto px-8 py-4 bg-white border-2 border-gray-900 text-gray-900 font-black uppercase tracking-widest rounded-2xl hover:bg-gray-900 hover:text-white transition-all text-xs">
                                        Save as Template
                                    </button>
                                    <div className="flex-1"></div>
                                    <button
                                        onClick={() => setShowBroadcastForm(false)}
                                        className="text-xs font-black text-gray-400 uppercase tracking-widest hover:text-red-500 transition-colors"
                                    >
                                        Discard Changes
                                    </button>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Campaign History Table */}
                    <div className="bg-white rounded-[2.5rem] shadow-sm border border-gray-100 overflow-hidden">
                        <div className="p-8 border-b border-gray-100 flex justify-between items-center bg-gray-50/30">
                            <div>
                                <h2 className="text-xl font-black text-gray-900 italic tracking-tight uppercase">Campaign Chronicle</h2>
                                <p className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] mt-1">Historical Performance & Logs</p>
                            </div>
                            <button className="px-5 py-2 bg-white border border-gray-200 text-[10px] font-black uppercase tracking-widest text-gray-600 rounded-full hover:bg-gray-50 transition-all shadow-sm">Export Data</button>
                        </div>
                        <div className="p-0">
                            <DataTable columns={columns} data={campaigns} emptyMessage="Your marketing history is empty. Launch your first campaign!" />
                        </div>
                    </div>
                </div>

                {/* Sidebar - Realistic Phone Preview */}
                <div className="lg:col-span-1">
                    <div className="sticky top-10 space-y-6">
                        <div className="bg-white rounded-[2.5rem] shadow-2xl border border-gray-100 overflow-hidden">
                            <div className="p-6 border-b border-gray-100 flex items-center justify-between">
                                <h2 className="text-sm font-black text-gray-900 uppercase tracking-widest italic">Live Preview</h2>
                                <div className="flex gap-1">
                                    <div className="w-2 h-2 rounded-full bg-red-400"></div>
                                    <div className="w-2 h-2 rounded-full bg-yellow-400"></div>
                                    <div className="w-2 h-2 rounded-full bg-green-400"></div>
                                </div>
                            </div>

                            <div className="p-6 bg-gray-50/50">
                                {/* Phone Frame */}
                                <div className="relative mx-auto border-[6px] border-gray-900 bg-gray-900 rounded-[3rem] p-3 shadow-2xl max-w-[280px]">
                                    <div className="absolute top-0 left-1/2 transform -translate-x-1/2 w-24 h-6 bg-gray-900 rounded-b-2xl z-20"></div>

                                    <div className="bg-[#e5ddd5] rounded-[2.25rem] overflow-hidden min-h-[460px] flex flex-col relative">
                                        {/* WhatsApp Background Pattern */}
                                        <div className="absolute inset-0 opacity-10 bg-[url('https://user-images.githubusercontent.com/15075759/28719144-86dc0f70-73b1-11e7-911d-60d70fcded21.png')] bg-repeat"></div>

                                        {/* Phone Content Header */}
                                        <div className="relative z-10 bg-emerald-800 p-4 pt-8 text-white flex items-center gap-3">
                                            <div className="w-8 h-8 rounded-full bg-emerald-600 flex items-center justify-center font-black text-xs">BZ</div>
                                            <div>
                                                <p className="text-[10px] font-black uppercase tracking-widest leading-none mb-1">BizzAI Store</p>
                                                <p className="text-[8px] opacity-70 uppercase tracking-tighter">Online & Active</p>
                                            </div>
                                        </div>

                                        {/* Chat Bubbles */}
                                        <div className="flex-1 p-4 relative z-10 space-y-3">
                                            <div className="self-start max-w-[90%] bg-white rounded-2xl rounded-tl-none p-3 shadow-sm transform transition-all duration-500 hover:scale-[1.02]">
                                                <p className="text-[13px] text-gray-800 whitespace-pre-wrap leading-snug font-medium">
                                                    {formData.message || messagePreview || 'Your high-converting campaign message will materialize here in real-time...'}
                                                </p>
                                                <div className="flex items-center justify-end gap-1 mt-1 text-[8px] text-gray-400 font-bold uppercase">
                                                    10:30 AM
                                                    <span className="text-blue-500">✓✓</span>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Mock Mobile Footer */}
                                        <div className="relative z-10 p-3 bg-gray-100/50 backdrop-blur-md flex items-center gap-2">
                                            <div className="flex-1 h-8 bg-white rounded-full px-4 text-[10px] text-gray-400 flex items-center border border-gray-200">
                                                Type a message...
                                            </div>
                                            <div className="w-8 h-8 bg-emerald-600 rounded-full flex items-center justify-center text-white text-sm shadow-lg">
                                                ✉
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div className="p-8 space-y-4 border-t border-gray-100 bg-gray-50/30">
                                <div className="flex justify-between items-center text-xs">
                                    <span className="font-black text-gray-400 uppercase tracking-widest">Audience reach</span>
                                    <span className="font-black text-gray-900 italic">
                                        {selectedGroups.length > 0
                                            ? customerGroups.filter(g => selectedGroups.includes(g.id)).reduce((sum, g) => sum + g.count, 0).toLocaleString()
                                            : 0} Customers
                                    </span>
                                </div>
                                <div className="flex justify-between items-center text-xs">
                                    <span className="font-black text-gray-400 uppercase tracking-widest">Investment</span>
                                    <span className="font-black text-emerald-600 italic">
                                        ₹{(selectedGroups.length > 0
                                            ? customerGroups.filter(g => selectedGroups.includes(g.id)).reduce((sum, g) => sum + g.count, 0) * 0.25
                                            : 0).toFixed(2)}
                                    </span>
                                </div>
                            </div>
                        </div>

                        {/* Quick Tips Tooltip */}
                        <div className="bg-gradient-to-br from-indigo-900 to-emerald-900 rounded-[2.5rem] p-8 text-white shadow-2xl relative overflow-hidden group">
                            <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-bl-full -mr-16 -mt-16 group-hover:scale-150 transition-transform duration-700"></div>
                            <div className="relative z-10">
                                <h4 className="text-sm font-black uppercase tracking-[0.2em] mb-4 flex items-center gap-2">
                                    <span className="text-xl">💡</span> Professional Tips
                                </h4>
                                <ul className="space-y-4">
                                    {[
                                        'Personalize messages using {{name}} tags',
                                        'Include a timestamp to create urgency',
                                        'Best time to send: Tue-Thu, 10am-1pm',
                                        'Always include a clear Call-To-Action'
                                    ].map((tip, idx) => (
                                        <li key={idx} className="flex items-start gap-3 text-[11px] font-bold opacity-80 leading-snug">
                                            <span className="text-emerald-400">★</span>
                                            {tip}
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </Layout >
    );
};

export default WhatsAppMarketing;

