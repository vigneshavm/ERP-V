import React, { useState, useMemo, useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { RootState, AppDispatch } from "../../redux/store";
import {
    fetchMasterEntries,
    createMasterEntry,
    updateMasterEntry,
    deleteMasterEntry,
    MasterEntry,
} from "../../redux/slices/masterDataSlice";
import {
    Search,
    Users,
    FolderPlus,
    Edit,
    Trash2,
    Tag,
    Percent,
    ChevronDown,
    ChevronUp,
    Crown,
    ShoppingBag,
    Building,
    Star,
    X,
    Loader2,
} from 'lucide-react';

interface GroupFormState {
    name: string;
    description: string;
    color: string;
    discountPercent: string;
    creditLimit: string;
    paymentTermsDays: string;
}

const EMPTY_FORM: GroupFormState = { name: '', description: '', color: '#6366f1', discountPercent: '0', creditLimit: '0', paymentTermsDays: '0' };

const getGroupIcon = (name: string) => {
    const n = name.toLowerCase();
    if (n.includes('vip')) return <Crown className="w-5 h-5" />;
    if (n.includes('wholesale') || n.includes('corporate')) return <Building className="w-5 h-5" />;
    if (n.includes('retail')) return <ShoppingBag className="w-5 h-5" />;
    return <Users className="w-5 h-5" />;
};

// Real, backend-integrated customer group management -- previously this screen rendered a
// hardcoded DEFAULT_GROUPS array with no persistence and stubbed-out Add/Edit handlers. Now
// backed by the generic Master Data API (type=CUSTOMER_GROUP), which seeds the same four
// groups on first load so existing users see no visible change, but Create/Edit/Delete now
// actually persist.
const CustomerGroups: React.FC = () => {
    const dispatch = useDispatch<AppDispatch>();
    const { customers } = useSelector((state: RootState) => state.customers);
    const { entriesByType, isLoading } = useSelector((state: RootState) => state.masterData);
    const groups = useMemo(() => entriesByType.CUSTOMER_GROUP || [], [entriesByType.CUSTOMER_GROUP]);

    const [searchTerm, setSearchTerm] = useState('');
    const [expandedGroup, setExpandedGroup] = useState<string | null>(null);
    const [showModal, setShowModal] = useState(false);
    const [editingGroup, setEditingGroup] = useState<MasterEntry | null>(null);
    const [form, setForm] = useState<GroupFormState>(EMPTY_FORM);
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        dispatch(fetchMasterEntries({ type: 'CUSTOMER_GROUP' }));
    }, [dispatch]);

    const groupsWithCounts = useMemo(() => {
        return groups.map((group) => ({
            ...group,
            memberCount: customers.filter((c) => (c as any).groupId === group._id).length,
        }));
    }, [groups, customers]);

    const filteredGroups = groupsWithCounts.filter((g) =>
        g.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (g.description || '').toLowerCase().includes(searchTerm.toLowerCase())
    );

    const totalCustomers = customers.length;
    const assignedCustomers = groupsWithCounts.reduce((acc, g) => acc + g.memberCount, 0);

    const openCreateModal = () => {
        setEditingGroup(null);
        setForm(EMPTY_FORM);
        setShowModal(true);
    };

    const openEditModal = (group: MasterEntry) => {
        setEditingGroup(group);
        setForm({
            name: group.name,
            description: group.description || '',
            color: group.meta?.color || '#6366f1',
            discountPercent: String(group.meta?.discountPercent ?? 0),
            creditLimit: String(group.meta?.creditLimit ?? 0),
            paymentTermsDays: String(group.meta?.paymentTermsDays ?? 0),
        });
        setShowModal(true);
    };

    const handleSave = async () => {
        if (!form.name.trim()) return;
        setSaving(true);
        const meta = {
            color: form.color,
            discountPercent: parseFloat(form.discountPercent) || 0,
            creditLimit: parseFloat(form.creditLimit) || 0,
            paymentTermsDays: parseInt(form.paymentTermsDays, 10) || 0,
        };
        try {
            if (editingGroup) {
                await dispatch(updateMasterEntry({ id: editingGroup._id, data: { name: form.name, description: form.description, meta } })).unwrap();
            } else {
                await dispatch(createMasterEntry({ type: 'CUSTOMER_GROUP', data: { name: form.name, description: form.description, meta } })).unwrap();
            }
            setShowModal(false);
        } catch {
            // Errors surface via masterData.isError/message in the store; the form stays open so
            // the user can retry rather than silently losing their input.
        } finally {
            setSaving(false);
        }
    };

    const handleDelete = async (group: MasterEntry) => {
        if (!window.confirm(`Delete the "${group.name}" group? Customers in it will stay, just unassigned.`)) return;
        await dispatch(deleteMasterEntry({ id: group._id, type: 'CUSTOMER_GROUP' }));
        if (expandedGroup === group._id) setExpandedGroup(null);
    };

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
                    onClick={openCreateModal}
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
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                    <Search className="w-4 h-4 absolute left-3 top-2.5 text-neutral-400" />
                </div>
            </div>

            {/* Groups List */}
            <div className="space-y-4">
                {isLoading && groups.length === 0 ? (
                    <div className="bg-white dark:bg-neutral-800 p-12 rounded-xl border border-neutral-200 dark:border-neutral-700 text-center">
                        <Loader2 className="w-8 h-8 mx-auto animate-spin text-primary" />
                    </div>
                ) : filteredGroups.length === 0 ? (
                    <div className="bg-white dark:bg-neutral-800 p-12 rounded-xl border border-neutral-200 dark:border-neutral-700 text-center">
                        <Tag className="w-12 h-12 mx-auto mb-4 text-neutral-300" />
                        <p className="text-neutral-500">No customer groups found</p>
                    </div>
                ) : (
                    filteredGroups.map((group) => (
                        <div key={group._id} className="bg-white dark:bg-neutral-800 rounded-xl border border-neutral-200 dark:border-neutral-700 overflow-hidden">
                            {/* Group Header */}
                            <div
                                className="p-4 flex justify-between items-center cursor-pointer hover:bg-neutral-50 dark:hover:bg-neutral-700/50"
                                onClick={() => setExpandedGroup(expandedGroup === group._id ? null : group._id)}
                            >
                                <div className="flex items-center gap-4">
                                    <div
                                        className="w-12 h-12 rounded-xl flex items-center justify-center text-white"
                                        style={{ backgroundColor: group.meta?.color || '#6366f1' }}
                                    >
                                        {getGroupIcon(group.name)}
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
                                        <p className="font-bold text-success">{group.meta?.discountPercent ?? 0}%</p>
                                    </div>
                                    <div className="text-center hidden md:block">
                                        <p className="text-xs text-neutral-500">Credit Limit</p>
                                        <p className="font-bold text-neutral-700 dark:text-neutral-300">₹{(group.meta?.creditLimit ?? 0).toLocaleString()}</p>
                                    </div>
                                    {expandedGroup === group._id ? (
                                        <ChevronUp className="w-5 h-5 text-neutral-400" />
                                    ) : (
                                        <ChevronDown className="w-5 h-5 text-neutral-400" />
                                    )}
                                </div>
                            </div>

                            {/* Expanded Details */}
                            {expandedGroup === group._id && (
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
                                            <p className="text-lg font-bold text-success">{group.meta?.discountPercent ?? 0}%</p>
                                        </div>
                                        <div className="bg-white dark:bg-neutral-800 p-3 rounded-lg">
                                            <p className="text-xs text-neutral-500">Credit Limit</p>
                                            <p className="text-lg font-bold text-neutral-700 dark:text-neutral-300">₹{(group.meta?.creditLimit ?? 0).toLocaleString()}</p>
                                        </div>
                                        <div className="bg-white dark:bg-neutral-800 p-3 rounded-lg">
                                            <p className="text-xs text-neutral-500">Payment Terms</p>
                                            <p className="text-lg font-bold text-neutral-700 dark:text-neutral-300">{group.meta?.paymentTermsDays ?? 0} days</p>
                                        </div>
                                    </div>

                                    <div className="flex gap-2">
                                        <button
                                            onClick={(e) => { e.stopPropagation(); openEditModal(group); }}
                                            className="px-4 py-2 bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-lg text-sm font-medium hover:bg-neutral-100 dark:hover:bg-neutral-700 flex items-center gap-2"
                                        >
                                            <Edit className="w-4 h-4" /> Edit Group
                                        </button>
                                        <button
                                            onClick={(e) => { e.stopPropagation(); handleDelete(group); }}
                                            className="px-4 py-2 bg-error/10 text-error rounded-lg text-sm font-bold hover:bg-error/20 flex items-center gap-2 ml-auto"
                                        >
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

            {/* Create / Edit Modal */}
            {showModal && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                    <div className="bg-white dark:bg-neutral-900 rounded-2xl shadow-2xl max-w-md w-full border border-neutral-200 dark:border-neutral-800">
                        <div className="p-6 border-b border-neutral-200 dark:border-neutral-800 flex items-center justify-between">
                            <h3 className="text-lg font-bold text-neutral-900 dark:text-white">{editingGroup ? 'Edit Group' : 'Create Group'}</h3>
                            <button onClick={() => setShowModal(false)} className="text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-200">
                                <X className="w-5 h-5" />
                            </button>
                        </div>
                        <div className="p-6 space-y-4">
                            <div>
                                <label className="text-xs font-bold text-neutral-500 uppercase">Name</label>
                                <input
                                    type="text"
                                    value={form.name}
                                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                                    className="w-full mt-1 px-3 py-2 bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-lg text-sm"
                                    placeholder="e.g. Wholesale"
                                />
                            </div>
                            <div>
                                <label className="text-xs font-bold text-neutral-500 uppercase">Description</label>
                                <input
                                    type="text"
                                    value={form.description}
                                    onChange={(e) => setForm({ ...form, description: e.target.value })}
                                    className="w-full mt-1 px-3 py-2 bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-lg text-sm"
                                />
                            </div>
                            <div className="grid grid-cols-3 gap-3">
                                <div>
                                    <label className="text-xs font-bold text-neutral-500 uppercase">Discount %</label>
                                    <input
                                        type="number"
                                        value={form.discountPercent}
                                        onChange={(e) => setForm({ ...form, discountPercent: e.target.value })}
                                        className="w-full mt-1 px-3 py-2 bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-lg text-sm"
                                    />
                                </div>
                                <div>
                                    <label className="text-xs font-bold text-neutral-500 uppercase">Credit Limit</label>
                                    <input
                                        type="number"
                                        value={form.creditLimit}
                                        onChange={(e) => setForm({ ...form, creditLimit: e.target.value })}
                                        className="w-full mt-1 px-3 py-2 bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-lg text-sm"
                                    />
                                </div>
                                <div>
                                    <label className="text-xs font-bold text-neutral-500 uppercase">Terms (days)</label>
                                    <input
                                        type="number"
                                        value={form.paymentTermsDays}
                                        onChange={(e) => setForm({ ...form, paymentTermsDays: e.target.value })}
                                        className="w-full mt-1 px-3 py-2 bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-lg text-sm"
                                    />
                                </div>
                            </div>
                            <div>
                                <label className="text-xs font-bold text-neutral-500 uppercase">Color</label>
                                <input
                                    type="color"
                                    value={form.color}
                                    onChange={(e) => setForm({ ...form, color: e.target.value })}
                                    className="w-full mt-1 h-10 rounded-lg border border-neutral-200 dark:border-neutral-700"
                                />
                            </div>
                        </div>
                        <div className="p-6 border-t border-neutral-200 dark:border-neutral-800 flex justify-end gap-3">
                            <button onClick={() => setShowModal(false)} className="px-4 py-2 text-neutral-600 dark:text-neutral-400 font-bold text-sm">Cancel</button>
                            <button
                                onClick={handleSave}
                                disabled={saving || !form.name.trim()}
                                className="px-6 py-2 bg-primary text-white rounded-lg text-sm font-bold disabled:opacity-50"
                            >
                                {saving ? 'Saving…' : editingGroup ? 'Save Changes' : 'Create Group'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default CustomerGroups;
