import React, { useState, useMemo, useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { RootState, AppDispatch } from "../../redux/store";
import { getAgents, deleteAgent, Agent } from "../../redux/slices/agentSlice";
import { getAllSuppliers } from "../../redux/slices/supplierSlice";
import {
    Search,
    UserPlus,
    Edit,
    Trash2,
    Phone,
    Mail,
    Percent,
    MoreVertical,
    Contact
} from 'lucide-react';

import Layout from "../../components/shared/Layout/index";
import PageHeader from "../../components/shared/Layout/PageHeader";
import SupplierSubNav from './SupplierSubNav';
import AgentModal from "../../components/suppliers/AgentModal";

const Agents: React.FC = () => {
    const dispatch = useDispatch<AppDispatch>();
    const { agents, isLoading } = useSelector((state: RootState) => state.agents);
    const { suppliers } = useSelector((state: RootState) => state.suppliers);

    const [searchTerm, setSearchTerm] = useState('');
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [openMenuId, setOpenMenuId] = useState<string | null>(null);
    const [editingAgent, setEditingAgent] = useState<Agent | null>(null);

    useEffect(() => {
        dispatch(getAgents());
        dispatch(getAllSuppliers());
    }, [dispatch]);

    const supplierName = (id?: string) =>
        (suppliers || []).find((s: any) => (s._id || s.id) === id)?.businessName ||
        (suppliers || []).find((s: any) => (s._id || s.id) === id)?.name || '—';

    const filteredAgents = useMemo(
        () => agents.filter(a =>
            a.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            (a.phone || '').includes(searchTerm)
        ),
        [agents, searchTerm]
    );

    const handleDelete = async (id: string) => {
        if (window.confirm('Are you sure you want to delete this agent?')) {
            try {
                await dispatch(deleteAgent(id)).unwrap();
            } catch (error) {
                console.error('Failed to delete agent:', error);
            }
        }
    };

    return (
        <Layout>
            <PageHeader
                title="Agents"
                actions={
                    <button
                        onClick={() => { setEditingAgent(null); setIsModalOpen(true); }}
                        className="px-6 py-2 bg-indigo-600 text-white rounded-xl text-sm font-bold shadow-lg shadow-indigo-200 dark:shadow-none hover:bg-indigo-700 active:scale-95 transition-all flex items-center gap-2"
                    >
                        <UserPlus className="w-4 h-4" /> Register Agent
                    </button>
                }
            />

            <SupplierSubNav />

            <div className="space-y-6 animate-fade-in">
                {/* Summary Cards */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="bg-white dark:bg-neutral-800 border-2 border-indigo-200 dark:border-primary/30 rounded-xl p-5 relative overflow-hidden shadow-sm">
                        <div className="flex items-center gap-2 mb-1">
                            <div className="p-1.5 rounded-lg bg-indigo-50 dark:bg-primary/10 text-primary dark:text-primary">
                                <Contact className="w-4 h-4" />
                            </div>
                            <span className="text-xs font-bold text-primary dark:text-primary uppercase tracking-wide">Total Agents</span>
                        </div>
                        <span className="text-3xl font-black text-slate-900 dark:text-white">{agents.length}</span>
                    </div>

                    <div className="bg-white dark:bg-neutral-800 border border-slate-100 dark:border-neutral-700 rounded-xl p-5 relative overflow-hidden shadow-sm">
                        <div className="flex items-center gap-2 mb-1">
                            <div className="p-1.5 rounded-lg bg-emerald-50 dark:bg-success/10 text-emerald-600 dark:text-success">
                                <UserPlus className="w-4 h-4" />
                            </div>
                            <span className="text-xs font-bold text-emerald-600 dark:text-success uppercase tracking-wide">Active</span>
                        </div>
                        <span className="text-3xl font-black text-slate-900 dark:text-white">{agents.filter(a => a.status === 'active').length}</span>
                    </div>

                    <div className="bg-white dark:bg-neutral-800 border border-slate-100 dark:border-neutral-700 rounded-xl p-5 relative overflow-hidden shadow-sm">
                        <div className="flex items-center gap-2 mb-1">
                            <div className="p-1.5 rounded-lg bg-amber-50 dark:bg-warning/10 text-amber-600 dark:text-warning">
                                <Percent className="w-4 h-4" />
                            </div>
                            <span className="text-xs font-bold text-amber-600 dark:text-warning uppercase tracking-wide">Avg. Commission</span>
                        </div>
                        <span className="text-3xl font-black text-slate-900 dark:text-white">
                            {agents.length > 0 ? (agents.reduce((s, a) => s + (a.commissionPercent || 0), 0) / agents.length).toFixed(1) : 0}%
                        </span>
                    </div>
                </div>

                {/* Filter Bar */}
                <div className="flex items-center justify-between">
                    <div className="relative group">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 group-focus-within:text-primary transition-colors" />
                        <input
                            type="text"
                            placeholder="Search agents by name or phone..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-80 pl-9 pr-4 py-2.5 bg-white dark:bg-neutral-800 border border-slate-200 dark:border-neutral-700 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-400 transition-all text-sm text-slate-700 dark:text-neutral-200 placeholder:text-slate-400 shadow-sm"
                        />
                    </div>
                </div>

                {/* Agents Table */}
                <div className="bg-white dark:bg-neutral-800 rounded-sm border border-slate-100 dark:border-neutral-700 shadow-sm overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left">
                            <thead>
                                <tr className="border-b border-slate-100 dark:border-neutral-700">
                                    <th className="px-6 py-4 text-[11px] font-bold text-slate-500 dark:text-neutral-400 uppercase tracking-wider whitespace-nowrap">Agent</th>
                                    <th className="px-6 py-4 text-[11px] font-bold text-slate-500 dark:text-neutral-400 uppercase tracking-wider whitespace-nowrap">Contact</th>
                                    <th className="px-6 py-4 text-[11px] font-bold text-slate-500 dark:text-neutral-400 uppercase tracking-wider whitespace-nowrap">Linked Supplier</th>
                                    <th className="px-6 py-4 text-[11px] font-bold text-slate-500 dark:text-neutral-400 uppercase tracking-wider whitespace-nowrap">Commission</th>
                                    <th className="px-6 py-4 text-[11px] font-bold text-slate-500 dark:text-neutral-400 uppercase tracking-wider whitespace-nowrap">Status</th>
                                    <th className="px-6 py-4 text-[11px] font-bold text-slate-500 dark:text-neutral-400 uppercase tracking-wider text-right whitespace-nowrap">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-50 dark:divide-neutral-700/50">
                                {isLoading && filteredAgents.length === 0 ? (
                                    <tr><td colSpan={6} className="px-6 py-16 text-center text-sm font-bold text-slate-400">Loading agents...</td></tr>
                                ) : filteredAgents.length === 0 ? (
                                    <tr>
                                        <td colSpan={6} className="px-6 py-16 text-center">
                                            <div className="flex flex-col items-center gap-3">
                                                <Contact className="w-10 h-10 text-slate-200 dark:text-neutral-700" />
                                                <p className="text-sm font-bold text-slate-400 dark:text-neutral-500">No agents registered yet</p>
                                            </div>
                                        </td>
                                    </tr>
                                ) : (
                                    filteredAgents.map((agent) => (
                                        <tr
                                            key={agent._id}
                                            className="group hover:bg-slate-50/50 dark:hover:bg-neutral-700/30 transition-colors"
                                            onClick={() => { setEditingAgent(agent); setIsModalOpen(true); }}
                                        >
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-8 h-8 rounded-lg flex items-center justify-center text-white shadow-sm bg-indigo-500">
                                                        {agent.name[0]}
                                                    </div>
                                                    <p className="text-sm font-bold text-slate-800 dark:text-neutral-100">{agent.name}</p>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <div className="text-xs text-slate-500 dark:text-neutral-400 space-y-0.5">
                                                    {agent.phone && <p className="flex items-center gap-1.5"><Phone className="w-3 h-3" /> {agent.phone}</p>}
                                                    {agent.email && <p className="flex items-center gap-1.5"><Mail className="w-3 h-3" /> {agent.email}</p>}
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-600 dark:text-neutral-300">
                                                {supplierName(agent.linkedSupplierId)}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <span className="text-sm font-bold text-emerald-600">{agent.commissionPercent || 0}%</span>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <span className={`text-[10px] px-2 py-0.5 rounded border font-bold uppercase ${agent.status === 'active' ? 'bg-emerald-50 border-emerald-100 text-emerald-600' : 'bg-slate-50 border-slate-100 text-slate-500'}`}>
                                                    {agent.status}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-right" onClick={(e) => e.stopPropagation()}>
                                                <div className="relative">
                                                    <button
                                                        onClick={() => setOpenMenuId(openMenuId === agent._id ? null : agent._id)}
                                                        className="p-1.5 text-slate-300 dark:text-neutral-600 hover:text-slate-500 dark:hover:text-neutral-400 hover:bg-slate-100 dark:hover:bg-neutral-700 rounded-lg transition-all"
                                                    >
                                                        <MoreVertical className="w-4 h-4" />
                                                    </button>
                                                    {openMenuId === agent._id && (
                                                        <div className="absolute right-0 top-8 w-40 bg-white dark:bg-neutral-800 border border-slate-200 dark:border-neutral-700 rounded-xl shadow-lg z-20 py-1 animate-in fade-in zoom-in-95 duration-150">
                                                            <button
                                                                onClick={() => { setEditingAgent(agent); setIsModalOpen(true); setOpenMenuId(null); }}
                                                                className="w-full px-4 py-2.5 text-left text-sm text-slate-700 dark:text-neutral-300 hover:bg-slate-50 dark:hover:bg-neutral-700 flex items-center gap-2 font-medium"
                                                            >
                                                                <Edit className="w-3.5 h-3.5 text-slate-400" /> Edit Agent
                                                            </button>
                                                            <div className="h-px bg-slate-100 dark:bg-neutral-700 my-1" />
                                                            <button
                                                                onClick={() => { handleDelete(agent._id); setOpenMenuId(null); }}
                                                                className="w-full px-4 py-2.5 text-left text-sm text-rose-600 dark:text-danger hover:bg-rose-50 dark:hover:bg-danger/10 flex items-center gap-2 font-medium"
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
            </div>

            <AgentModal
                key={isModalOpen ? (editingAgent?._id || 'new') : 'closed'}
                isOpen={isModalOpen}
                onClose={() => { setIsModalOpen(false); setEditingAgent(null); }}
                initialData={editingAgent}
            />
        </Layout>
    );
};

export default Agents;
