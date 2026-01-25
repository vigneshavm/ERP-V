import React, { useState, useEffect } from 'react';
import Layout from '../../components/Layout';
import PageHeader from '../../components/PageHeader';
import FormInput from '../../components/FormInput';
import StatsCard from '../../components/StatsCard';
import DataTable from '../../components/DataTable';
import BusinessSubNav from './BusinessSubNav';
import api from '../../services/api';
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

    return (
        <Layout>
            <PageHeader
                title="WhatsApp Marketing"
                description="Send broadcast messages to your customers"
                breadcrumbs={[
                    { label: 'Dashboard', link: '/' },
                    { label: 'Business', link: '/business/online-shop' },
                    { label: 'Growth Tools', link: '/business/online-shop' },
                    { label: 'WhatsApp Marketing' }
                ]}
                actions={[
                    <button
                        key="broadcast"
                        onClick={() => setShowBroadcastForm(!showBroadcastForm)}
                        className="px-6 py-2.5 bg-green-600 text-white font-medium rounded-lg hover:bg-green-700 shadow-sm shadow-green-200 transition-all active:scale-95 flex items-center"
                    >
                        <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                        </svg>
                        New Broadcast
                    </button>
                ]}
            />
            <BusinessSubNav />

            {/* WhatsApp API Status */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 mb-8 flex flex-col md:flex-row items-center justify-between gap-4">
                <div className="flex items-center space-x-4">
                    <div className="p-3 bg-green-50 text-green-600 rounded-xl relative">
                        <svg className="w-8 h-8" fill="currentColor" viewBox="0 0 24 24">
                            <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
                        </svg>
                        <span className="absolute top-1 right-1 flex h-3 w-3">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                            <span className="relative inline-flex rounded-full h-3 w-3 bg-green-500"></span>
                        </span>
                    </div>
                    <div>
                        <h3 className="font-bold text-gray-900 text-lg">WhatsApp Business API</h3>
                        <div className="flex items-center text-sm text-green-600 font-medium">
                            <span className="w-2 h-2 rounded-full bg-green-600 mr-2"></span>
                            Connected & Active
                        </div>
                    </div>
                </div>
                <div className="text-right">
                    <p className="text-sm text-gray-500">Quality Rating</p>
                    <p className="text-lg font-bold text-green-600">High</p>
                </div>
            </div>

            {/* Delivery Report Stats */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
                <StatsCard
                    title="Messages Sent"
                    value={deliveryStats.sent.toString()}
                    icon={<svg fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" /></svg>}
                    iconBgColor="bg-blue-50"
                    iconColor="text-blue-600"
                />
                <StatsCard
                    title="Delivered"
                    value={deliveryStats.delivered.toString()}
                    icon={<svg fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>}
                    iconBgColor="bg-green-50"
                    iconColor="text-green-600"
                />
                <StatsCard
                    title="Read"
                    value={deliveryStats.read.toString()}
                    icon={<svg fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>}
                    iconBgColor="bg-purple-50"
                    iconColor="text-purple-600"
                />
                <StatsCard
                    title="Failed"
                    value={deliveryStats.failed.toString()}
                    icon={<svg fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>}
                    iconBgColor="bg-red-50"
                    iconColor="text-red-600"
                />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <div className="lg:col-span-2 space-y-8">
                    {/* Broadcast Form */}
                    {showBroadcastForm && (
                        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 animate-fade-in-down">
                            <h2 className="text-xl font-bold text-gray-900 mb-6 flex items-center">
                                <span className="w-1 h-6 bg-green-500 rounded-full mr-3"></span>
                                New Broadcast
                            </h2>
                            <div className="space-y-6">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">Select Template</label>
                                    <select
                                        value={selectedTemplate}
                                        onChange={(e: React.ChangeEvent<HTMLSelectElement>) => {
                                            setSelectedTemplate(e.target.value);
                                            const template = templates.find(t => t.id === parseInt(e.target.value));
                                            setMessagePreview(template?.content || '');
                                        }}
                                        className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-shadow bg-white"
                                    >
                                        <option value="">Choose a template...</option>
                                        {templates.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">Message Content</label>
                                    <textarea
                                        value={formData.message || messagePreview}
                                        onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setFormData({ ...formData, message: e.target.value })}
                                        rows={4}
                                        className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-shadow resize-none"
                                        placeholder="Type your message..."
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-3">Target Audience</label>
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                        {customerGroups.map(group => (
                                            <div
                                                key={group.id}
                                                onClick={() => toggleGroup(group.id)}
                                                className={`flex items-center p-3 border rounded-lg cursor-pointer transition-all ${selectedGroups.includes(group.id)
                                                    ? 'border-green-500 bg-green-50/50'
                                                    : 'border-gray-200 hover:border-green-300 hover:bg-gray-50'
                                                    }`}
                                            >
                                                <div className={`w-5 h-5 rounded border flex items-center justify-center mr-3 transition-colors ${selectedGroups.includes(group.id) ? 'bg-green-500 border-green-500' : 'border-gray-300 bg-white'
                                                    }`}>
                                                    {selectedGroups.includes(group.id) && (
                                                        <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                                                        </svg>
                                                    )}
                                                </div>
                                                <div>
                                                    <p className="font-medium text-gray-900 text-sm">{group.name}</p>
                                                    <p className="text-xs text-gray-500">{group.count} customers</p>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">Attachments</label>
                                    <div className="border-2 border-dashed border-gray-200 rounded-xl p-6 text-center hover:bg-gray-50 transition-colors cursor-pointer group">
                                        <svg className="mx-auto w-10 h-10 text-gray-400 group-hover:text-green-500 transition-colors mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" />
                                        </svg>
                                        <p className="text-sm text-gray-600 font-medium">Click to upload media</p>
                                        <p className="text-xs text-gray-400 mt-1">Images, PDF, or Video</p>
                                    </div>
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <FormInput
                                        label="Schedule Date"
                                        type="date"
                                        name="scheduleDate"
                                        value={formData.scheduleDate}
                                        onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFormData({ ...formData, scheduleDate: e.target.value })}
                                        className="h-[46px]"
                                    />
                                    <FormInput
                                        label="Schedule Time"
                                        type="time"
                                        name="scheduleTime"
                                        value={formData.scheduleTime}
                                        onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFormData({ ...formData, scheduleTime: e.target.value })}
                                        className="h-[46px]"
                                    />
                                </div>
                                <div className="flex gap-3 pt-4 border-t border-gray-100">
                                    <button
                                        onClick={handleSendBroadcast}
                                        className="px-6 py-2.5 bg-green-600 text-white font-medium rounded-lg hover:bg-green-700 shadow-sm transition-all active:scale-95"
                                    >
                                        Send Broadcast
                                    </button>
                                    <button className="px-6 py-2.5 bg-white border border-gray-300 text-gray-700 font-medium rounded-lg hover:bg-gray-50 transition-colors">
                                        Schedule for Later
                                    </button>
                                    <button
                                        onClick={() => setShowBroadcastForm(false)}
                                        className="px-6 py-2.5 text-gray-500 hover:text-gray-700 font-medium ml-auto"
                                    >
                                        Cancel
                                    </button>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Campaign History */}
                    <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                        <div className="p-6 border-b border-gray-100 flex justify-between items-center">
                            <h2 className="text-lg font-bold text-gray-900">Recent Campaigns</h2>
                            <button className="text-green-600 text-sm font-medium hover:text-green-700">View All</button>
                        </div>
                        <div className="p-0">
                            <DataTable columns={columns} data={campaigns} emptyMessage="No campaigns yet" />
                        </div>
                    </div>
                </div>

                {/* Sidebar - Message Preview */}
                <div className="lg:col-span-1">
                    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 sticky top-6">
                        <div className="flex items-center justify-between mb-6">
                            <h2 className="text-lg font-bold text-gray-900">Message Preview</h2>
                            <span className="text-xs font-semibold px-2 py-1 bg-green-100 text-green-800 rounded">WhatsApp</span>
                        </div>

                        <div className="bg-[#e5ddd5] rounded-lg p-4 mb-4 min-h-[300px] flex flex-col relative overflow-hidden">
                            {/* WhatsApp Background Pattern opacity */}
                            <div className="absolute inset-0 opacity-10 bg-[url('https://user-images.githubusercontent.com/15075759/28719144-86dc0f70-73b1-11e7-911d-60d70fcded21.png')] bg-repeat"></div>

                            <div className="relative z-10 self-start max-w-[90%] bg-white rounded-lg rounded-tl-none p-3 shadow-sm mb-2">
                                <p className="text-sm text-gray-900 whitespace-pre-wrap leading-relaxed">
                                    {formData.message || messagePreview || 'Your message will appear here...'}
                                </p>
                                <span className="text-[10px] text-gray-400 block text-right mt-1">10:30 AM</span>
                            </div>
                        </div>

                        <div className="space-y-4 pt-4 border-t border-gray-100">
                            <div className="flex justify-between items-center">
                                <span className="text-sm text-gray-600">Recipients</span>
                                <span className="font-bold text-gray-900">
                                    {selectedGroups.length > 0
                                        ? customerGroups.filter(g => selectedGroups.includes(g.id)).reduce((sum, g) => sum + g.count, 0)
                                        : 0}
                                </span>
                            </div>
                            <div className="flex justify-between items-center">
                                <span className="text-sm text-gray-600">Est. Cost</span>
                                <span className="font-bold text-gray-900">
                                    ₹{(selectedGroups.length > 0
                                        ? customerGroups.filter(g => selectedGroups.includes(g.id)).reduce((sum, g) => sum + g.count, 0) * 0.25
                                        : 0).toFixed(2)}
                                </span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </Layout>
    );
};

export default WhatsAppMarketing;
