import React, { useState, useMemo } from 'react';
import { useSelector } from 'react-redux';
import { RootState } from "../../redux/store";
import {
    Search,
    Users,
    FolderPlus,
    Edit,
    Trash2,
    Tag,
    Percent,
    UserPlus,
    ChevronDown,
    ChevronUp,
    Crown,
    ShoppingBag,
    Building,
    Star
} from 'lucide-react';

interface CustomerGroup {
    id: string;
    name: string;
    description: string;
    color: string;
    discountPercent: number;
    creditLimit: number;
    paymentTerms: number; // days
    memberCount: number;
    icon: string;
}

const DEFAULT_GROUPS: CustomerGroup[] = [
    { id: 'retail', name: 'Retail', description: 'Walk-in retail customers', color: '#3b82f6', discountPercent: 0, creditLimit: 5000, paymentTerms: 0, memberCount: 0, icon: 'shopping' },
    { id: 'wholesale', name: 'Wholesale', description: 'Bulk purchase customers', color: '#8b5cf6', discountPercent: 10, creditLimit: 50000, paymentTerms: 30, memberCount: 0, icon: 'building' },
    { id: 'vip', name: 'VIP', description: 'Premium loyalty customers', color: '#f59e0b', discountPercent: 15, creditLimit: 100000, paymentTerms: 45, memberCount: 0, icon: 'crown' },
    { id: 'corporate', name: 'Corporate', description: 'Business accounts', color: '#10b981', discountPercent: 12, creditLimit: 200000, paymentTerms: 60, memberCount: 0, icon: 'building' }
];

const CustomerGroups: React.FC = () => {
    const { customers } = useSelector((state: RootState) => state.customers);

    const [groups] = useState<CustomerGroup[]>(DEFAULT_GROUPS);
    const [searchTerm, setSearchTerm] = useState('');
    const [expandedGroup, setExpandedGroup] = useState<string | null>(null);
    const [_showAddModal, setShowAddModal] = useState(false);
    const [_editingGroup, setEditingGroup] = useState<CustomerGroup | null>(null);

    // Calculate member counts
    const groupsWithCounts = useMemo(() => {
        return groups.map(group => ({
            ...group,
            memberCount: customers.filter(c => (c as any).groupId === group.id).length
        }));
    }, [groups, customers]);

    const filteredGroups = groupsWithCounts.filter(g =>
        g.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        g.description.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const getGroupIcon = (iconName: string) => {
        switch (iconName) {
            case 'crown': return <Crown className="w-5 h-5" />;
            case 'building': return <Building className="w-5 h-5" />;
            case 'shopping': return <ShoppingBag className="w-5 h-5" />;
            default: return <Users className="w-5 h-5" />;
        }
    };

    const totalCustomers = customers.length;
    const assignedCustomers = groupsWithCounts.reduce((acc, g) => acc + g.memberCount, 0);

    return (
        <div className="space-y-6 animate-fade-in">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h2 className="text-2xl font-bold text-neutral-900 dark:text-white flex items-center gap-2">
                        <Tag className="w-6 h-6 text-primary" />
                        Customer Groups
                    </h2>
                    <p className="text-neutral-500 text-sm mt-1">Organize customers into groups with custom pricing and terms</p>
                </div>
                <button
                    onClick={() => setShowAddModal(true)}
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
                    <p className="text-xs font-medium text-neutral-500 uppercase">Total Customers</p>
                    <p className="text-2xl font-bold text-primary mt-1">{totalCustomers}</p>
                </div>
                <div className="bg-white dark:bg-neutral-800 p-4 rounded-xl border border-neutral-200 dark:border-neutral-700">
                    <p className="text-xs font-medium text-neutral-500 uppercase">Assigned</p>
                    <p className="text-2xl font-bold text-success mt-1">{assignedCustomers}</p>
                </div>
                <div className="bg-white dark:bg-neutral-800 p-4 rounded-xl border border-neutral-200 dark:border-neutral-700">
                    <p className="text-xs font-medium text-neutral-500 uppercase">Unassigned</p>
                    <p className="text-2xl font-bold text-warning mt-1">{totalCustomers - assignedCustomers}</p>
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
                        <p className="text-neutral-500">No customer groups found</p>
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
                                        <p className="text-xs text-neutral-500">Discount</p>
                                        <p className="font-bold text-success">{group.discountPercent}%</p>
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
                                                <Users className="w-3 h-3" /> Members
                                            </p>
                                            <p className="text-lg font-bold text-primary">{group.memberCount}</p>
                                        </div>
                                        <div className="bg-white dark:bg-neutral-800 p-3 rounded-lg">
                                            <p className="text-xs text-neutral-500 flex items-center gap-1">
                                                <Percent className="w-3 h-3" /> Default Discount
                                            </p>
                                            <p className="text-lg font-bold text-success">{group.discountPercent}%</p>
                                        </div>
                                        <div className="bg-white dark:bg-neutral-800 p-3 rounded-lg">
                                            <p className="text-xs text-neutral-500">Credit Limit</p>
                                            <p className="text-lg font-bold text-neutral-700 dark:text-neutral-300">₹{group.creditLimit.toLocaleString()}</p>
                                        </div>
                                        <div className="bg-white dark:bg-neutral-800 p-3 rounded-lg">
                                            <p className="text-xs text-neutral-500">Payment Terms</p>
                                            <p className="text-lg font-bold text-neutral-700 dark:text-neutral-300">{group.paymentTerms} days</p>
                                        </div>
                                    </div>

                                    <div className="flex gap-2">
                                        <button
                                            onClick={() => setEditingGroup(group)}
                                            className="px-4 py-2 bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-lg text-sm font-medium hover:bg-neutral-100 dark:hover:bg-neutral-700 flex items-center gap-2"
                                        >
                                            <Edit className="w-4 h-4" /> Edit Group
                                        </button>
                                        <button className="px-4 py-2 bg-primary/10 text-primary rounded-lg text-sm font-bold hover:bg-primary/20 flex items-center gap-2">
                                            <UserPlus className="w-4 h-4" /> Add Members
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
                    <Star className="w-4 h-4 text-primary" /> Tips for Customer Groups
                </h4>
                <ul className="text-sm text-neutral-600 dark:text-neutral-400 mt-2 space-y-1">
                    <li>• Set different discount rates for wholesale vs retail customers</li>
                    <li>• Define credit limits based on customer reliability</li>
                    <li>• Use payment terms to manage cash flow expectations</li>
                    <li>• Create VIP groups for your best customers with special privileges</li>
                </ul>
            </div>
        </div>
    );
};

export default CustomerGroups;
