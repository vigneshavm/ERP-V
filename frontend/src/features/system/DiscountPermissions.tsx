import React, { useEffect, useState } from 'react';
import { toast } from 'react-toastify';
import { Percent, Save, Search } from 'lucide-react';
import Layout from "../../components/shared/Layout/Layout";
import PageHeader from "../../components/shared/Layout/PageHeader";
import api from "../../services/api";

interface TenantUser {
    _id: string;
    name: string;
    email: string;
    role: string;
    maxDiscountPercent?: number | null;
}

// Per-user discount permission: lets an owner/co-owner/manager grant a specific staff member
// a discount ceiling that overrides the shop-wide default (Settings -> MIS Controls ->
// maxDiscountPercent) at POS checkout. See backend/src/modules/sales/controllers/
// PosController.ts's createInvoice for how the override is applied.
const DiscountPermissions: React.FC = () => {
    const [users, setUsers] = useState<TenantUser[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [search, setSearch] = useState('');
    const [drafts, setDrafts] = useState<Record<string, string>>({});
    const [savingId, setSavingId] = useState<string | null>(null);

    const fetchUsers = async () => {
        setIsLoading(true);
        try {
            const { data } = await api.get('/api/users');
            const list: TenantUser[] = Array.isArray(data) ? data : (data?.data || []);
            setUsers(list);
            const initial: Record<string, string> = {};
            list.forEach((u) => { initial[u._id] = u.maxDiscountPercent != null ? String(u.maxDiscountPercent) : ''; });
            setDrafts(initial);
        } catch {
            toast.error('Failed to load users');
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchUsers();
    }, []);

    const handleSave = async (user: TenantUser) => {
        const raw = drafts[user._id];
        const value = raw.trim() === '' ? null : parseFloat(raw);
        if (value !== null && (Number.isNaN(value) || value < 0 || value > 100)) {
            toast.warning('Enter a number between 0 and 100, or leave blank to use the shop default');
            return;
        }
        setSavingId(user._id);
        try {
            await api.patch(`/api/users/${user._id}/discount-limit`, { maxDiscountPercent: value });
            toast.success(`Updated ${user.name}'s discount limit`);
            setUsers(prev => prev.map(u => u._id === user._id ? { ...u, maxDiscountPercent: value } : u));
        } catch (err: any) {
            toast.error(err?.response?.data?.message || 'Failed to update discount limit');
        } finally {
            setSavingId(null);
        }
    };

    const filteredUsers = users.filter(u =>
        u.name?.toLowerCase().includes(search.toLowerCase()) ||
        u.email?.toLowerCase().includes(search.toLowerCase())
    );

    return (
        <Layout>
            <PageHeader
                title="Discount Limits"
                description="Grant individual staff a discount ceiling that overrides the shop's default MIS Controls cap."
            />

            <div className="mb-4 relative max-w-sm">
                <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400" />
                <input
                    type="text"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    placeholder="Search by name or email..."
                    className="w-full pl-9 pr-4 py-2 bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-lg text-sm outline-none focus:ring-2 focus:ring-primary/20"
                />
            </div>

            <div className="bg-white dark:bg-neutral-800 rounded-xl border border-neutral-200 dark:border-neutral-700 shadow-sm overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead className="bg-neutral-50 dark:bg-neutral-900 text-xs font-bold text-neutral-500 uppercase tracking-wider border-b border-neutral-200 dark:border-neutral-700">
                            <tr>
                                <th className="px-6 py-3">User</th>
                                <th className="px-6 py-3">Role</th>
                                <th className="px-6 py-3">Discount Limit</th>
                                <th className="px-6 py-3 text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-neutral-100 dark:divide-neutral-800">
                            {filteredUsers.map((u) => (
                                <tr key={u._id} className="hover:bg-neutral-50 dark:hover:bg-neutral-900/40">
                                    <td className="px-6 py-4">
                                        <div className="text-sm font-bold text-neutral-900 dark:text-white">{u.name}</div>
                                        <div className="text-xs text-neutral-400">{u.email}</div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <span className="text-[10px] px-2 py-0.5 rounded border font-bold uppercase bg-indigo-50 border-indigo-100 text-primary">{u.role}</span>
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="relative w-32">
                                            <input
                                                type="number"
                                                min="0"
                                                max="100"
                                                value={drafts[u._id] ?? ''}
                                                onChange={(e) => setDrafts(prev => ({ ...prev, [u._id]: e.target.value }))}
                                                placeholder="Shop default"
                                                className="w-full pl-3 pr-7 py-1.5 text-sm bg-neutral-100 dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 rounded-lg outline-none"
                                            />
                                            <Percent className="w-3.5 h-3.5 absolute right-2 top-1/2 -translate-y-1/2 text-neutral-400" />
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 text-right">
                                        <button
                                            onClick={() => handleSave(u)}
                                            disabled={savingId === u._id}
                                            className="px-3 py-1.5 bg-primary/10 text-primary rounded-lg text-xs font-bold hover:bg-primary/20 disabled:opacity-60 flex items-center gap-1.5 ml-auto"
                                        >
                                            <Save className="w-3.5 h-3.5" /> {savingId === u._id ? 'Saving...' : 'Save'}
                                        </button>
                                    </td>
                                </tr>
                            ))}
                            {!isLoading && filteredUsers.length === 0 && (
                                <tr>
                                    <td colSpan={4} className="px-6 py-16 text-center text-neutral-400">
                                        <Percent className="w-10 h-10 mx-auto mb-3 opacity-40" />
                                        No users found.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </Layout>
    );
};

export default DiscountPermissions;
