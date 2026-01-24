import React, { useState, useMemo } from 'react';
import { useSelector } from 'react-redux';
import { RootState } from '../../store';
import {
    Search,
    Truck,
    FolderPlus,
    Edit,
    Trash2,
    Tag,
    Percent,
    UserPlus,
    ChevronDown,
    ChevronUp,
    Crown,
    Building,
    Star,
    Clock,
    CreditCard
} from 'lucide-react';

interface SupplierGroup {
    id: string;
    name: string;
    description: string;
    color: string;
    paymentTerms: number;
    creditLimit: number;
    discountPercent: number;
    memberCount: number;
    icon: string;
}

const DEFAULT_GROUPS: SupplierGroup[] = [
    { id: 'regular', name: 'Regular', description: 'Standard suppliers', color: '#3b82f6', paymentTerms: 30, creditLimit: 50000, discountPercent: 0, memberCount: 0, icon: 'truck' },
    { id: 'strategic', name: 'Strategic', description: 'Key strategic partners', color: '#8b5cf6', paymentTerms: 45, creditLimit: 200000, discountPercent: 5, memberCount: 0, icon: 'crown' },
    { id: 'local', name: 'Local', description: 'Local/nearby suppliers', color: '#10b981', paymentTerms: 15, creditLimit: 25000, discountPercent: 0, memberCount: 0, icon: 'building' },
    { id: 'premium', name: 'Premium', description: 'High-quality premium suppliers', color: '#f59e0b', paymentTerms: 60, creditLimit: 500000, discountPercent: 10, memberCount: 0, icon: 'star' }
];

const SupplierGroups: React.FC = () => {
    const { vendors } = useSelector((state: RootState) => state.vendor);

    const [groups, setGroups] = useState<SupplierGroup[]>(DEFAULT_GROUPS);
    const [searchTerm, setSearchTerm] = useState('');
    const [expandedGroup, setExpandedGroup] = useState<string | null>(null);

    // Calculate member counts
    const groupsWithCounts = useMemo(() => {
        return groups.map(group => ({
            ...group,
            memberCount: vendors.filter(v => (v as any).groupId === group.id).length
        }));
    }, [groups, vendors]);

    const filteredGroups = groupsWithCounts.filter(g =>
        g.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        g.description.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const getGroupIcon = (iconName: string) => {
        switch (iconName) {
            case 'crown': return <Crown className="w-5 h-5" />;
            case 'building': return <Building className="w-5 h-5" />;
            case 'star': return <Star className="w-5 h-5" />;
            default: return <Truck className="w-5 h-5" />;
        }
    };

    const totalSuppliers = vendors.length;
    const assignedSuppliers = groupsWithCounts.reduce((acc, g) => acc + g.memberCount, 0);

    return (
        <div className="space-y-6 animate-fade-in">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h2 className="text-2xl font-bold text-neutral-900 dark:text-white flex items-center gap-2">
                        <Tag className="w-6 h-6 text-primary" />
                        Supplier Groups
                    </h2>
                    <p className="text-neutral-500 text-sm mt-1">Organize suppliers into groups with custom terms and limits</p>
                </div>
                <button
                    className="px-4 py-2 bg-primary text-white rounded-lg text-sm font-bold hover:bg-primary/90 flex items-center gap-2"
                >
                    <FolderPlus className="w-4 h-4" /> Create Group
                </button>
            </div>

            {/* Summary Cards */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="bg-white dark:bg-neutral-800 p-4 rounded-xl border border-neutral-200 dark:border-neutral-700">
                    <p className="text-xs font-medium text-neutral-500 uppercase">Total Groups</p>
                    <p className="text-2xl font-bold text-neutral-900 dark:text-white mt-1">{groups.length}</p>
                </div>
                <div className="bg-white dark:bg-neutral-800 p-4 rounded-xl border border-neutral-200 dark:border-neutral-700">
                    <p className="text-xs font-medium text-neutral-500 uppercase">Total Suppliers</p>
                    <p className="text-2xl font-bold text-primary mt-1">{totalSuppliers}</p>
                </div>
                <div className="bg-white dark:bg-neutral-800 p-4 rounded-xl border border-neutral-200 dark:border-neutral-700">
                    <p className="text-xs font-medium text-neutral-500 uppercase">Assigned</p>
                    <p className="text-2xl font-bold text-success mt-1">{assignedSuppliers}</p>
                </div>
                <div className="bg-white dark:bg-neutral-800 p-4 rounded-xl border border-neutral-200 dark:border-neutral-700">
                    <p className="text-xs font-medium text-neutral-500 uppercase">Unassigned</p>
                    <p className="text-2xl font-bold text-warning mt-1">{totalSuppliers - assignedSuppliers}</p>
                </div>
            </div>

            {/* Search */}
            <div className="bg-white dark:bg-neutral-800 p-4 rounded-xl border border-neutral-200 dark:border-neutral-700">
                <div className="relative max-w-md">
                    <input
                        type="text"
                        placeholder="Search groups..."
                        className="w-full pl-9 pr-4 py-2 bg-neutral-100 dark:bg-neutral-700 border border-neutral-200 dark:border-neutral-600 rounded-lg text-neutral-900 dark:text-white text-sm"
                        value={searchTerm}
                        onChange={e => setSearchTerm(e.target.value)}
                    />
                    <Search className="w-4 h-4 absolute left-3 top-2.5 text-neutral-400" />
                </div>
            </div>

            {/* Groups List */}
            <div className="space-y-4">
                {filteredGroups.length === 0 ? (
                    <div className="bg-white dark:bg-neutral-800 p-12 rounded-xl border border-neutral-200 dark:border-neutral-700 text-center">
                        <Tag className="w-12 h-12 mx-auto mb-4 text-neutral-300" />
                        <p className="text-neutral-500">No supplier groups found</p>
                    </div>
                ) : (
                    filteredGroups.map(group => (
                        <div key={group.id} className="bg-white dark:bg-neutral-800 rounded-xl border border-neutral-200 dark:border-neutral-700 overflow-hidden">
                            {/* Group Header */}
                            <div
                                className="p-4 flex justify-between items-center cursor-pointer hover:bg-neutral-50 dark:hover:bg-neutral-700/50"
                                onClick={() => setExpandedGroup(expandedGroup === group.id ? null : group.id)}
                            >
                                <div className="flex items-center gap-4">
                                    <div
                                        className="w-12 h-12 rounded-xl flex items-center justify-center text-white"
                                        style={{ backgroundColor: group.color }}
                                    >
                                        {getGroupIcon(group.icon)}
                                    </div>
                                    <div>
                                        <h3 className="font-bold text-neutral-900 dark:text-white">{group.name}</h3>
                                        <p className="text-sm text-neutral-500">{group.description}</p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-6">
                                    <div className="text-center hidden md:block">
                                        <p className="text-xs text-neutral-500">Members</p>
                                        <p className="font-bold text-primary">{group.memberCount}</p>
                                    </div>
                                    <div className="text-center hidden md:block">
                                        <p className="text-xs text-neutral-500">Payment Terms</p>
                                        <p className="font-bold text-neutral-700 dark:text-neutral-300">{group.paymentTerms} days</p>
                                    </div>
                                    <div className="text-center hidden md:block">
                                        <p className="text-xs text-neutral-500">Credit Limit</p>
                                        <p className="font-bold text-neutral-700 dark:text-neutral-300">₹{group.creditLimit.toLocaleString()}</p>
                                    </div>
                                    {expandedGroup === group.id ? (
                                        <ChevronUp className="w-5 h-5 text-neutral-400" />
                                    ) : (
                                        <ChevronDown className="w-5 h-5 text-neutral-400" />
                                    )}
                                </div>
                            </div>

                            {/* Expanded Details */}
                            {expandedGroup === group.id && (
                                <div className="border-t border-neutral-100 dark:border-neutral-700 p-4 bg-neutral-50 dark:bg-neutral-900">
                                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                                        <div className="bg-white dark:bg-neutral-800 p-3 rounded-lg">
                                            <p className="text-xs text-neutral-500 flex items-center gap-1">
                                                <Truck className="w-3 h-3" /> Members
                                            </p>
                                            <p className="text-lg font-bold text-primary">{group.memberCount}</p>
                                        </div>
                                        <div className="bg-white dark:bg-neutral-800 p-3 rounded-lg">
                                            <p className="text-xs text-neutral-500 flex items-center gap-1">
                                                <Clock className="w-3 h-3" /> Payment Terms
                                            </p>
                                            <p className="text-lg font-bold text-neutral-700 dark:text-neutral-300">{group.paymentTerms} days</p>
                                        </div>
                                        <div className="bg-white dark:bg-neutral-800 p-3 rounded-lg">
                                            <p className="text-xs text-neutral-500 flex items-center gap-1">
                                                <CreditCard className="w-3 h-3" /> Credit Limit
                                            </p>
                                            <p className="text-lg font-bold text-neutral-700 dark:text-neutral-300">₹{group.creditLimit.toLocaleString()}</p>
                                        </div>
                                        <div className="bg-white dark:bg-neutral-800 p-3 rounded-lg">
                                            <p className="text-xs text-neutral-500 flex items-center gap-1">
                                                <Percent className="w-3 h-3" /> Discount Rate
                                            </p>
                                            <p className="text-lg font-bold text-success">{group.discountPercent}%</p>
                                        </div>
                                    </div>

                                    <div className="flex gap-2">
                                        <button
                                            className="px-4 py-2 bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-lg text-sm font-medium hover:bg-neutral-100 dark:hover:bg-neutral-700 flex items-center gap-2"
                                        >
                                            <Edit className="w-4 h-4" /> Edit Group
                                        </button>
                                        <button className="px-4 py-2 bg-primary/10 text-primary rounded-lg text-sm font-bold hover:bg-primary/20 flex items-center gap-2">
                                            <UserPlus className="w-4 h-4" /> Add Suppliers
                                        </button>
                                        <button className="px-4 py-2 bg-error/10 text-error rounded-lg text-sm font-bold hover:bg-error/20 flex items-center gap-2 ml-auto">
                                            <Trash2 className="w-4 h-4" /> Delete
                                        </button>
                                    </div>
                                </div>
                            )}
                        </div>
                    ))
                )}
            </div>

            {/* Quick Tips */}
            <div className="bg-gradient-to-r from-primary/10 to-primary/5 p-4 rounded-xl border border-primary/20">
                <h4 className="font-bold text-neutral-900 dark:text-white flex items-center gap-2">
                    <Star className="w-4 h-4 text-primary" /> Tips for Supplier Groups
                </h4>
                <ul className="text-sm text-neutral-600 dark:text-neutral-400 mt-2 space-y-1">
                    <li>• Group suppliers by reliability and importance for better management</li>
                    <li>• Set appropriate payment terms based on supplier relationships</li>
                    <li>• Define credit limits to control purchasing exposure</li>
                    <li>• Use discount rates to track negotiated pricing from strategic partners</li>
                </ul>
            </div>
        </div>
    );
};

export default SupplierGroups;
