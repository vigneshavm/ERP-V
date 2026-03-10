import React, { useState, useMemo, useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { RootState, AppDispatch } from "@/app/store/store";
import { getSupplierGroups, deleteSupplierGroup, SupplierGroup } from "@/entities/contact/model/supplierGroupSlice";
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
    CreditCard,
    MoreVertical
} from 'lucide-react';



import Layout from "../../../components/shared/Layout";
import PageHeader from "../../../components/shared/Layout/PageHeader";
import SupplierSubNav from './SupplierSubNav';
import SupplierGroupModal from "../../../components/suppliers/SupplierGroupModal";

const SupplierGroups: React.FC = () => {
    const dispatch = useDispatch<AppDispatch>();
    const { suppliers } = useSelector((state: RootState) => state.suppliers);
    const { groups, isLoading } = useSelector((state: RootState) => state.supplierGroups);

    // const [groups, setGroups] = useState<SupplierGroup[]>(DEFAULT_GROUPS); // Replaced by Redux
    const [searchTerm, setSearchTerm] = useState('');
    const [expandedGroup, setExpandedGroup] = useState<string | null>(null);
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
    const [openMenuId, setOpenMenuId] = useState<string | null>(null);
    const [editingGroup, setEditingGroup] = useState<SupplierGroup | null>(null);

    const handleDeleteGroup = async (id: string) => {
        if (window.confirm('Are you sure you want to delete this group?')) {
            try {
                await dispatch(deleteSupplierGroup(id)).unwrap();
            } catch (error) {
                console.error('Failed to delete group:', error);
            }
        }
    };

    useEffect(() => {
        dispatch(getSupplierGroups());
    }, [dispatch]);

    // Calculate member counts
    const groupsWithCounts = useMemo(() => {
        return groups.map(group => ({
            ...group,
            memberCount: (suppliers || []).filter(s => (s as any).groupId === group._id).length // Assuming supplier has groupId
        }));
    }, [groups, suppliers]);

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

    const totalSuppliers = (suppliers || []).length;
    const assignedSuppliers = groupsWithCounts.reduce((acc, g) => acc + (g.memberCount || 0), 0);

    return (
        <Layout>
            <PageHeader
                title="Supplier Groups"
                actions={
                    <button
                        onClick={() => { setEditingGroup(null); setIsCreateModalOpen(true); }}
                        className="px-6 py-2 bg-indigo-600 text-white rounded-xl text-sm font-bold shadow-lg shadow-indigo-200 dark:shadow-none hover:bg-indigo-700 active:scale-95 transition-all flex items-center gap-2"
                    >
                        <FolderPlus className="w-4 h-4" /> Create Group
                    </button>
                }
            />

            <SupplierSubNav />

            <div className="space-y-6 animate-fade-in">
                {/* Summary Cards */}
                {/* Summary Cards */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    {/* Total Groups */}
                    <div className="bg-white dark:bg-neutral-800 border-2 border-indigo-200 dark:border-indigo-500/30 rounded-xl p-5 relative overflow-hidden shadow-sm">
                        <div className="flex items-center gap-2 mb-1">
                            <div className="p-1.5 rounded-lg bg-indigo-50 dark:bg-indigo-500/10 text-indigo-600 dark:text-indigo-400">
                                <FolderPlus className="w-4 h-4" />
                            </div>
                            <span className="text-xs font-bold text-indigo-600 dark:text-indigo-400 uppercase tracking-wide">Total Groups</span>
                        </div>
                        <span className="text-3xl font-black text-slate-900 dark:text-white">{groups.length}</span>
                    </div>

                    {/* Total Suppliers */}
                    <div className="bg-white dark:bg-neutral-800 border border-slate-100 dark:border-neutral-700 rounded-xl p-5 relative overflow-hidden shadow-sm">
                        <div className="flex items-center gap-2 mb-1">
                            <div className="p-1.5 rounded-lg bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
                                <Truck className="w-4 h-4" />
                            </div>
                            <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-wide">Total Suppliers</span>
                        </div>
                        <span className="text-3xl font-black text-slate-900 dark:text-white">{totalSuppliers}</span>
                    </div>

                    {/* Assigned */}
                    <div className="bg-white dark:bg-neutral-800 border border-slate-100 dark:border-neutral-700 rounded-xl p-5 relative overflow-hidden shadow-sm">
                        <div className="flex items-center gap-2 mb-1">
                            <div className="p-1.5 rounded-lg bg-blue-50 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400">
                                <UserPlus className="w-4 h-4" />
                            </div>
                            <span className="text-xs font-bold text-blue-600 dark:text-blue-400 uppercase tracking-wide">Assigned</span>
                        </div>
                        <span className="text-3xl font-black text-slate-900 dark:text-white">{assignedSuppliers}</span>
                    </div>

                    {/* Unassigned */}
                    <div className="bg-white dark:bg-neutral-800 border border-slate-100 dark:border-neutral-700 rounded-xl p-5 relative overflow-hidden shadow-sm">
                        <div className="flex items-center gap-2 mb-1">
                            <div className="p-1.5 rounded-lg bg-amber-50 dark:bg-amber-500/10 text-amber-600 dark:text-amber-400">
                                <Tag className="w-4 h-4" />
                            </div>
                            <span className="text-xs font-bold text-amber-600 dark:text-amber-400 uppercase tracking-wide">Unassigned</span>
                        </div>
                        <span className="text-3xl font-black text-slate-900 dark:text-white">{totalSuppliers - assignedSuppliers}</span>
                    </div>
                </div>

                {/* Filter Bar */}
                <div className="flex items-center justify-between">
                    <div className="relative group">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 group-focus-within:text-indigo-500 transition-colors" />
                        <input
                            type="text"
                            placeholder="Search groups..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-80 pl-9 pr-4 py-2.5 bg-white dark:bg-neutral-800 border border-slate-200 dark:border-neutral-700 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-400 transition-all text-sm text-slate-700 dark:text-neutral-200 placeholder:text-slate-400 shadow-sm"
                        />
                    </div>
                </div>

                {/* Groups Table */}
                <div className="bg-white dark:bg-neutral-800 rounded-2xl border border-slate-100 dark:border-neutral-700 shadow-sm overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left">
                            <thead>
                                <tr className="border-b border-slate-100 dark:border-neutral-700">
                                    <th className="px-6 py-4 text-[11px] font-bold text-slate-500 dark:text-neutral-400 uppercase tracking-wider whitespace-nowrap">Group Name</th>
                                    <th className="px-6 py-4 text-[11px] font-bold text-slate-500 dark:text-neutral-400 uppercase tracking-wider whitespace-nowrap">Members</th>
                                    <th className="px-6 py-4 text-[11px] font-bold text-slate-500 dark:text-neutral-400 uppercase tracking-wider whitespace-nowrap">Payment Terms</th>
                                    <th className="px-6 py-4 text-[11px] font-bold text-slate-500 dark:text-neutral-400 uppercase tracking-wider whitespace-nowrap">Credit Limit</th>
                                    <th className="px-6 py-4 text-[11px] font-bold text-slate-500 dark:text-neutral-400 uppercase tracking-wider whitespace-nowrap">Tags</th>
                                    <th className="px-6 py-4 text-[11px] font-bold text-slate-500 dark:text-neutral-400 uppercase tracking-wider text-right whitespace-nowrap">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-50 dark:divide-neutral-700/50">
                                {filteredGroups.length === 0 ? (
                                    <tr>
                                        <td colSpan={6} className="px-6 py-16 text-center">
                                            <div className="flex flex-col items-center gap-3">
                                                <Tag className="w-10 h-10 text-slate-200 dark:text-neutral-700" />
                                                <p className="text-sm font-bold text-slate-400 dark:text-neutral-500">No supplier groups found</p>
                                            </div>
                                        </td>
                                    </tr>
                                ) : (
                                    filteredGroups.map((group) => (
                                        <tr
                                            key={group._id}
                                            className="group hover:bg-slate-50/50 dark:hover:bg-neutral-700/30 transition-colors"
                                            onClick={() => { setEditingGroup(group); setIsCreateModalOpen(true); }}
                                        >
                                            {/* Name */}
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <div className="flex items-center gap-3">
                                                    <div
                                                        className="w-8 h-8 rounded-lg flex items-center justify-center text-white shadow-sm"
                                                        style={{ backgroundColor: group.color }}
                                                    >
                                                        {getGroupIcon(group.icon)}
                                                    </div>
                                                    <div>
                                                        <p className="text-sm font-bold text-slate-800 dark:text-neutral-100">{group.name}</p>
                                                        <p className="text-xs text-slate-500 dark:text-neutral-400 truncate max-w-[200px]">{group.description}</p>
                                                    </div>
                                                </div>
                                            </td>

                                            {/* Members */}
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold bg-slate-100 text-slate-600 dark:bg-neutral-700 dark:text-neutral-300">
                                                    {group.memberCount} Suppliers
                                                </span>
                                            </td>

                                            {/* Terms */}
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <span className="text-sm font-medium text-slate-700 dark:text-neutral-200">
                                                    {group.paymentTerms} Days
                                                </span>
                                            </td>

                                            {/* Credit Limit */}
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <span className="text-sm font-bold text-slate-700 dark:text-neutral-200">
                                                    ₹ {group.creditLimit.toLocaleString('en-IN')}
                                                </span>
                                            </td>

                                            {/* Tags */}
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <div className="flex gap-1.5">
                                                    {group.priority && (
                                                        <span className={`text-[10px] px-2 py-0.5 rounded border font-bold uppercase ${group.priority === 'High' ? 'bg-rose-50 border-rose-100 text-rose-600' :
                                                            group.priority === 'Medium' ? 'bg-amber-50 border-amber-100 text-amber-600' :
                                                                'bg-emerald-50 border-emerald-100 text-emerald-600'
                                                            }`}>
                                                            {group.priority}
                                                        </span>
                                                    )}
                                                    {group.nature && (
                                                        <span className="text-[10px] px-2 py-0.5 rounded border bg-slate-50 border-slate-100 text-slate-600 font-bold uppercase">
                                                            {group.nature}
                                                        </span>
                                                    )}
                                                </div>
                                            </td>

                                            {/* Actions */}
                                            <td className="px-6 py-4 whitespace-nowrap text-right" onClick={(e) => e.stopPropagation()}>
                                                <div className="relative">
                                                    <button
                                                        onClick={() => setOpenMenuId(openMenuId === group._id ? null : group._id)}
                                                        className="p-1.5 text-slate-300 dark:text-neutral-600 hover:text-slate-500 dark:hover:text-neutral-400 hover:bg-slate-100 dark:hover:bg-neutral-700 rounded-lg transition-all"
                                                    >
                                                        <MoreVertical className="w-4 h-4" />
                                                    </button>
                                                    {openMenuId === group._id && (
                                                        <div className="absolute right-0 top-8 w-48 bg-white dark:bg-neutral-800 border border-slate-200 dark:border-neutral-700 rounded-xl shadow-lg z-20 py-1 animate-in fade-in zoom-in-95 duration-150">
                                                            <button
                                                                onClick={() => { setEditingGroup(group); setIsCreateModalOpen(true); setOpenMenuId(null); }}
                                                                className="w-full px-4 py-2.5 text-left text-sm text-slate-700 dark:text-neutral-300 hover:bg-slate-50 dark:hover:bg-neutral-700 flex items-center gap-2 font-medium"
                                                            >
                                                                <Edit className="w-3.5 h-3.5 text-slate-400" /> Edit Group
                                                            </button>
                                                            <button
                                                                onClick={() => { /* Add logic for adding suppliers */ setOpenMenuId(null); }}
                                                                className="w-full px-4 py-2.5 text-left text-sm text-slate-700 dark:text-neutral-300 hover:bg-slate-50 dark:hover:bg-neutral-700 flex items-center gap-2 font-medium"
                                                            >
                                                                <UserPlus className="w-3.5 h-3.5 text-slate-400" /> Add Suppliers
                                                            </button>
                                                            <div className="h-px bg-slate-100 dark:bg-neutral-700 my-1" />
                                                            <button
                                                                onClick={() => { handleDeleteGroup(group._id); setOpenMenuId(null); }}
                                                                className="w-full px-4 py-2.5 text-left text-sm text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-500/10 flex items-center gap-2 font-medium"
                                                            >
                                                                <Trash2 className="w-3.5 h-3.5" /> Delete
                                                            </button>
                                                        </div>
                                                    )}
                                                </div>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* Quick Tips */}
                <div className="bg-gradient-to-r from-indigo-50 to-purple-50 dark:from-indigo-900/10 dark:to-purple-900/10 p-5 rounded-2xl border border-indigo-100 dark:border-indigo-500/20">
                    <h4 className="font-bold text-indigo-900 dark:text-indigo-100 flex items-center gap-2 mb-2">
                        <div className="p-1 bg-indigo-100 dark:bg-indigo-500/20 rounded-lg">
                            <Star className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                        </div>
                        Tips for Supplier Groups
                    </h4>
                    <ul className="text-sm text-indigo-700 dark:text-indigo-300 space-y-2 pl-1">
                        <li className="flex items-start gap-2">
                            <span className="w-1.5 h-1.5 rounded-full bg-indigo-400 mt-1.5 flex-shrink-0" />
                            Group suppliers by reliability and importance for better management
                        </li>
                        <li className="flex items-start gap-2">
                            <span className="w-1.5 h-1.5 rounded-full bg-indigo-400 mt-1.5 flex-shrink-0" />
                            Set appropriate payment terms based on supplier relationships
                        </li>
                        <li className="flex items-start gap-2">
                            <span className="w-1.5 h-1.5 rounded-full bg-indigo-400 mt-1.5 flex-shrink-0" />
                            Define credit limits to control purchasing exposure
                        </li>
                        <li className="flex items-start gap-2">
                            <span className="w-1.5 h-1.5 rounded-full bg-indigo-400 mt-1.5 flex-shrink-0" />
                            Use discount rates to track negotiated pricing from strategic partners
                        </li>
                    </ul>
                </div>
            </div>

            <SupplierGroupModal
                isOpen={isCreateModalOpen}
                onClose={() => { setIsCreateModalOpen(false); setEditingGroup(null); }}
                initialData={editingGroup}
            />
        </Layout>
    );
};

export default SupplierGroups;

