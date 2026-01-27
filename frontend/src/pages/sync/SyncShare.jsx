import { useState, useEffect } from 'react';
import Layout from '../../components/Layout';
import PageHeader from '../../components/PageHeader';
import {
    Smartphone,
    Monitor,
    Laptop,
    RefreshCw,
    CheckCircle2,
    Wifi,
    Clock,
    Shield,
    Cloud,
    Settings,
    AlertCircle,
    ArrowRightLeft,
    Database,
    FileText,
    Users,
    Package
} from 'lucide-react';

const DeviceIcon = ({ type, className }) => {
    switch (type.toLowerCase()) {
        case 'mobile': return <Smartphone className={className} />;
        case 'desktop': return <Monitor className={className} />;
        case 'laptop': return <Laptop className={className} />;
        default: return <Monitor className={className} />;
    }
};

const StatusBadge = ({ status }) => {
    const styles = {
        active: "bg-green-100 text-green-700 border-green-200",
        inactive: "bg-gray-100 text-gray-600 border-gray-200",
        syncing: "bg-blue-100 text-blue-700 border-blue-200"
    };

    return (
        <span className={`px-2.5 py-1 text-xs font-semibold rounded-full border flex items-center gap-1.5 ${styles[status] || styles.inactive}`}>
            <span className={`w-1.5 h-1.5 rounded-full ${status === 'active' ? 'bg-green-500' : status === 'syncing' ? 'bg-blue-500' : 'bg-gray-400'}`}></span>
            {status.charAt(0).toUpperCase() + status.slice(1)}
        </span>
    );
};

const ToggleSwitch = ({ checked, onChange }) => (
    <button
        onClick={() => onChange(!checked)}
        className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 ${checked ? 'bg-indigo-600' : 'bg-gray-200'}`}
    >
        <span
            className={`${checked ? 'translate-x-6' : 'translate-x-1'} inline-block h-4 w-4 transform rounded-full bg-white transition-transform`}
        />
    </button>
);

const SyncShare = () => {
    const [isSyncing, setIsSyncing] = useState(false);
    const [devices, setDevices] = useState([
        { id: 1, name: 'Main Office Desktop', type: 'desktop', lastSync: '2 minutes ago', status: 'active', ip: '192.168.1.10' },
        { id: 2, name: 'Warehouse Tablet', type: 'mobile', lastSync: '1 hour ago', status: 'active', ip: '192.168.1.15' },
        { id: 3, name: 'Manager MacBook', type: 'laptop', lastSync: '5 minutes ago', status: 'inactive', ip: '192.168.1.22' }
    ]);

    const [syncSettings, setSyncSettings] = useState({
        autoSync: true,
        syncInterval: '15',
        syncOnWifi: true,
        syncData: {
            invoices: true,
            customers: true,
            inventory: true,
            reports: false
        }
    });

    const handleSync = () => {
        setIsSyncing(true);
        setTimeout(() => setIsSyncing(false), 2000); // Simulate sync
    };

    const handleSettingChange = (key, value) => {
        setSyncSettings(prev => ({
            ...prev,
            [key]: value
        }));
    };

    const handleDataToggle = (key) => {
        setSyncSettings(prev => ({
            ...prev,
            syncData: {
                ...prev.syncData,
                [key]: !prev.syncData[key]
            }
        }));
    };

    return (
        <Layout>
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                <PageHeader
                    title="Sync & Share"
                    description="Manage device synchronization and data sharing preferences"
                />

                {/* Status Overview */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8 mt-6">
                    <div className="bg-gradient-to-br from-indigo-500 to-indigo-600 rounded-xl p-6 text-white shadow-lg overflow-hidden relative">
                        <div className="relative z-10">
                            <p className="text-indigo-100 font-medium mb-1">Sync Status</p>
                            <h3 className="text-2xl font-bold flex items-center gap-2">
                                <CheckCircle2 className="w-6 h-6" /> All Systems Go
                            </h3>
                            <p className="mt-4 text-indigo-100 text-sm opacity-90">Last synchronized successfully 2 mins ago across 3 devices.</p>
                        </div>
                        <Cloud className="absolute -right-4 -bottom-4 w-32 h-32 text-white/10" />
                    </div>

                    <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
                        <div className="flex items-start justify-between">
                            <div>
                                <p className="text-gray-500 text-sm font-medium">Active Devices</p>
                                <h3 className="text-3xl font-bold text-gray-900 mt-2">2<span className="text-lg text-gray-400 font-normal">/3</span></h3>
                            </div>
                            <div className="p-3 bg-green-50 rounded-lg">
                                <Monitor className="w-6 h-6 text-green-600" />
                            </div>
                        </div>
                        <div className="mt-4 flex items-center text-sm text-green-600 font-medium">
                            <Wifi className="w-4 h-4 mr-1" /> Network Stable
                        </div>
                    </div>

                    <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
                        <div className="flex items-start justify-between">
                            <div>
                                <p className="text-gray-500 text-sm font-medium">Pending Data</p>
                                <h3 className="text-3xl font-bold text-gray-900 mt-2">0 <span className="text-sm font-normal text-gray-500">records</span></h3>
                            </div>
                            <div className="p-3 bg-blue-50 rounded-lg">
                                <Database className="w-6 h-6 text-blue-600" />
                            </div>
                        </div>
                        <div className="mt-4 text-sm text-gray-500">
                            Up to date
                        </div>
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* Main Content Area */}
                    <div className="lg:col-span-2 space-y-6">

                        {/* Connected Devices */}
                        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                            <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
                                <div>
                                    <h2 className="text-lg font-bold text-gray-900">Connected Devices</h2>
                                    <p className="text-sm text-gray-500">Manage access and sync status for your devices</p>
                                </div>
                                <button className="text-sm font-medium text-indigo-600 hover:text-indigo-700 hover:underline">
                                    + Add New
                                </button>
                            </div>
                            <div className="divide-y divide-gray-100">
                                {devices.map((device) => (
                                    <div key={device.id} className="p-5 flex items-center justify-between hover:bg-gray-50 transition-colors group">
                                        <div className="flex items-center space-x-4">
                                            <div className="p-3 bg-gray-100 rounded-lg group-hover:bg-white group-hover:shadow-sm transition-all border border-transparent group-hover:border-gray-200">
                                                <DeviceIcon type={device.type} className="w-6 h-6 text-gray-600" />
                                            </div>
                                            <div>
                                                <h3 className="font-semibold text-gray-900">{device.name}</h3>
                                                <div className="flex items-center gap-3 mt-1">
                                                    <span className="text-xs text-gray-500 font-mono bg-gray-100 px-1.5 py-0.5 rounded">{device.ip}</span>
                                                    <span className="text-xs text-gray-400 flex items-center">
                                                        <Clock className="w-3 h-3 mr-1" /> {device.lastSync}
                                                    </span>
                                                </div>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-4">
                                            <StatusBadge status={device.status} />
                                            <button className="text-gray-400 hover:text-red-600 transition-colors p-2 hover:bg-red-50 rounded-lg">
                                                <Settings className="w-4 h-4" />
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Data Preferences */}
                        <div className="bg-white rounded-xl shadow-sm border border-gray-100">
                            <div className="p-6 border-b border-gray-100">
                                <h2 className="text-lg font-bold text-gray-900">Synchronization Preferences</h2>
                                <p className="text-sm text-gray-500">Choose which data modules to sync automatically</p>
                            </div>
                            <div className="p-6 grid grid-cols-1 sm:grid-cols-2 gap-4">
                                {[
                                    { key: 'invoices', label: 'Invoices & Quotes', icon: FileText, desc: 'Sync all financial documents' },
                                    { key: 'customers', label: 'Customer Database', icon: Users, desc: 'Contacts and history' },
                                    { key: 'inventory', label: 'Inventory Items', icon: Package, desc: 'Stock levels and SKUs' },
                                    { key: 'reports', label: 'Analytical Reports', icon: AlertCircle, desc: 'Daily/Monthly summaries' }
                                ].map((item) => (
                                    <div key={item.key}
                                        onClick={() => handleDataToggle(item.key)}
                                        className={`p-4 border rounded-xl cursor-pointer transition-all ${syncSettings.syncData[item.key]
                                                ? 'border-indigo-200 bg-indigo-50/30'
                                                : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                                            }`}>
                                        <div className="flex items-start justify-between">
                                            <div className="flex items-center gap-3">
                                                <div className={`p-2 rounded-lg ${syncSettings.syncData[item.key] ? 'bg-indigo-100 text-indigo-600' : 'bg-gray-100 text-gray-500'}`}>
                                                    <item.icon className="w-5 h-5" />
                                                </div>
                                                <div>
                                                    <h4 className={`font-semibold ${syncSettings.syncData[item.key] ? 'text-indigo-900' : 'text-gray-700'}`}>{item.label}</h4>
                                                    <p className="text-xs text-gray-500 mt-0.5">{item.desc}</p>
                                                </div>
                                            </div>
                                            <div className={`w-5 h-5 rounded-full border flex items-center justify-center ${syncSettings.syncData[item.key] ? 'bg-indigo-600 border-indigo-600' : 'border-gray-300 bg-white'
                                                }`}>
                                                {syncSettings.syncData[item.key] && <CheckCircle2 className="w-3.5 h-3.5 text-white" />}
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* Sidebar Settings */}
                    <div className="space-y-6">
                        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                            <h2 className="text-lg font-bold text-gray-900 mb-6 flex items-center gap-2">
                                <Settings className="w-5 h-5 text-gray-500" />
                                Sync Config
                            </h2>

                            <div className="space-y-6">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <p className="font-medium text-gray-900">Auto-Sync</p>
                                        <p className="text-xs text-gray-500">Sync data in background</p>
                                    </div>
                                    <ToggleSwitch
                                        checked={syncSettings.autoSync}
                                        onChange={(val) => handleSettingChange('autoSync', val)}
                                    />
                                </div>

                                <div className="border-t border-gray-100 pt-4">
                                    <label className="block text-sm font-medium text-gray-700 mb-2">Sync Interval</label>
                                    <div className="relative">
                                        <select
                                            value={syncSettings.syncInterval}
                                            onChange={(e) => handleSettingChange('syncInterval', e.target.value)}
                                            className="w-full pl-4 pr-10 py-2.5 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none appearance-none cursor-pointer"
                                        >
                                            <option value="5">Every 5 minutes</option>
                                            <option value="15">Every 15 minutes</option>
                                            <option value="30">Every 30 minutes</option>
                                            <option value="60">Every hour</option>
                                        </select>
                                        <Clock className="w-4 h-4 text-gray-500 absolute right-3 top-3 pointer-events-none" />
                                    </div>
                                </div>

                                <div className="flex items-center justify-between border-t border-gray-100 pt-4">
                                    <div className="flex items-start gap-2">
                                        <Wifi className="w-5 h-5 text-gray-400 mt-0.5" />
                                        <div>
                                            <p className="font-medium text-gray-900">Wi-Fi Only</p>
                                            <p className="text-xs text-gray-500">Save mobile data</p>
                                        </div>
                                    </div>
                                    <ToggleSwitch
                                        checked={syncSettings.syncOnWifi}
                                        onChange={(val) => handleSettingChange('syncOnWifi', val)}
                                    />
                                </div>
                            </div>

                            <div className="mt-8 pt-6 border-t border-gray-100">
                                <button
                                    onClick={handleSync}
                                    disabled={isSyncing}
                                    className={`w-full py-3.5 px-4 rounded-xl flex items-center justify-center gap-2 font-semibold text-white shadow-sm transition-all ${isSyncing
                                            ? 'bg-indigo-400 cursor-not-allowed'
                                            : 'bg-indigo-600 hover:bg-indigo-700 hover:shadow-indigo-200 hover:shadow-lg active:scale-[0.98]'
                                        }`}
                                >
                                    <ArrowRightLeft className={`w-5 h-5 ${isSyncing ? 'animate-spin' : ''}`} />
                                    {isSyncing ? 'Syncing...' : 'Sync Now'}
                                </button>
                                <p className="text-center text-xs text-gray-400 mt-3 flex items-center justify-center gap-1">
                                    <Shield className="w-3 h-3" /> End-to-end encrypted
                                </p>
                            </div>
                        </div>

                        {/* Recent Activity Mini-Feed */}
                        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                            <h3 className="font-bold text-gray-900 mb-4">Sync Log</h3>
                            <div className="space-y-4">
                                <div className="flex items-start gap-3">
                                    <div className="w-2 h-2 mt-2 bg-green-500 rounded-full flex-shrink-0"></div>
                                    <div>
                                        <p className="text-sm text-gray-700">Full inventory sync completed</p>
                                        <p className="text-xs text-gray-400">2 minutes ago</p>
                                    </div>
                                </div>
                                <div className="flex items-start gap-3">
                                    <div className="w-2 h-2 mt-2 bg-blue-500 rounded-full flex-shrink-0"></div>
                                    <div>
                                        <p className="text-sm text-gray-700">New invoice template downloaded</p>
                                        <p className="text-xs text-gray-400">15 minutes ago</p>
                                    </div>
                                </div>
                                <div className="flex items-start gap-3">
                                    <div className="w-2 h-2 mt-2 bg-gray-300 rounded-full flex-shrink-0"></div>
                                    <div>
                                        <p className="text-sm text-gray-700">Desktop app connected</p>
                                        <p className="text-xs text-gray-400">1 hour ago</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </Layout>
    );
};

export default SyncShare;
