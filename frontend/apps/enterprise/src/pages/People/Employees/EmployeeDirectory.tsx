import React, { useState, useEffect, useMemo } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { 
    Search, 
    Filter, 
    Plus, 
    Grid, 
    List, 
    MoreHorizontal, 
    Mail, 
    Phone, 
    MapPin, 
    Calendar,
    ChevronRight,
    Loader2,
    Users,
    BadgeCheck,
    Briefcase
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { RootState } from "../../../redux/store";
import { setEmployees } from "../../../redux/slices/laborSlice";
import api from "../../../services/api";
import Layout from "../../../components/shared/Layout";
import PageHeader from "../../../components/shared/Layout/PageHeader";
import { Employee } from "../../../types/hr";
import { formatCurrency } from "../../../utils/helpers";

const EmployeeDirectory: React.FC = () => {
    const dispatch = useDispatch();
    const navigate = useNavigate();
    const { employees } = useSelector((state: RootState) => state.labor);
    const { user } = useSelector((state: RootState) => state.auth);
    const { tenants } = useSelector((state: RootState) => state.tenant);

    const activeTenant = tenants.find(t => t.id === user?.tenantId);
    const branches = activeTenant?.locations?.flatMap((l: any) => l.branches) || [];

    const [isLoading, setIsLoading] = useState(false);
    const [viewMode, setViewMode] = useState<'GRID' | 'LIST'>('GRID');
    const [searchTerm, setSearchTerm] = useState('');
    const [filterRole, setFilterRole] = useState('ALL');
    const [filterBranch, setFilterBranch] = useState('ALL');

    useEffect(() => {
        fetchEmployees();
    }, []);

    const fetchEmployees = async () => {
        setIsLoading(true);
        try {
            const response = await api.get('/api/hr/employees');
            if (response.data?.success) {
                dispatch(setEmployees(response.data.data));
            }
        } catch (err) {
            console.error('Failed to fetch employees:', err);
        } finally {
            setIsLoading(false);
        }
    };

    const roles = useMemo(() => {
        const uniqueRoles = Array.from(new Set(employees.map(e => e.role)));
        return ['ALL', ...uniqueRoles];
    }, [employees]);

    const filteredEmployees = useMemo(() => {
        return employees.filter(emp => {
            const matchesSearch = emp.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                                 emp.role.toLowerCase().includes(searchTerm.toLowerCase());
            const matchesRole = filterRole === 'ALL' || emp.role === filterRole;
            const matchesBranch = filterBranch === 'ALL' || emp.branchId === filterBranch;
            return matchesSearch && matchesRole && matchesBranch;
        });
    }, [employees, searchTerm, filterRole, filterBranch]);

    const EmployeeCard = ({ emp }: { emp: Employee }) => (
        <motion.div
            layout
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            whileHover={{ y: -5 }}
            onClick={() => navigate(`/people/employees/${emp.id || emp._id}`)}
            className="bg-white dark:bg-slate-800 rounded-2xl p-5 shadow-sm border border-slate-200 dark:border-slate-700 hover:shadow-xl hover:border-blue-500/50 transition-all cursor-pointer group relative overflow-hidden"
        >
            <div className="absolute top-0 right-0 p-4 opacity-0 group-hover:opacity-100 transition-opacity">
                <ChevronRight className="w-5 h-5 text-blue-500" />
            </div>
            
            <div className="flex items-start gap-4">
                <div className="relative">
                    <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-2xl flex items-center justify-center text-white text-2xl font-black shadow-lg shadow-blue-500/20">
                        {emp.name.charAt(0)}
                    </div>
                    {emp.isActive && (
                        <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-emerald-500 border-2 border-white dark:border-slate-800 rounded-full" />
                    )}
                </div>
                
                <div className="flex-1 min-w-0">
                    <h3 className="font-bold text-slate-800 dark:text-white truncate group-hover:text-blue-600 transition-colors uppercase tracking-tight">
                        {emp.name}
                    </h3>
                    <div className="flex items-center gap-1.5 text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest mt-0.5">
                        <Briefcase className="w-3 h-3" />
                        {emp.role}
                    </div>
                </div>
            </div>

            <div className="mt-6 space-y-3">
                <div className="flex items-center gap-3 text-sm text-slate-500 dark:text-slate-400">
                    <div className="w-8 h-8 rounded-lg bg-slate-50 dark:bg-slate-900 flex items-center justify-center border border-slate-100 dark:border-slate-800">
                        <Phone className="w-4 h-4 text-slate-400" />
                    </div>
                    <span className="font-mono">{emp.mobile}</span>
                </div>
                <div className="flex items-center gap-3 text-sm text-slate-500 dark:text-slate-400">
                    <div className="w-8 h-8 rounded-lg bg-slate-50 dark:bg-slate-900 flex items-center justify-center border border-slate-100 dark:border-slate-800">
                        <MapPin className="w-4 h-4 text-slate-400" />
                    </div>
                    <span className="truncate">{branches.find(b => b.id === emp.branchId)?.name || 'Central Office'}</span>
                </div>
            </div>

            <div className="mt-6 pt-4 border-t border-slate-50 dark:border-slate-700/50 flex items-center justify-between">
                <div>
                   <p className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">Base Payout</p>
                   <p className="text-lg font-black text-slate-800 dark:text-white">
                        {formatCurrency(emp.baseSalary || emp.dailyRate || 0)}
                        <span className="text-[10px] text-slate-400 dark:text-slate-500 ml-1">/{emp.wageType?.toLowerCase()}</span>
                   </p>
                </div>
                <div className="px-3 py-1 bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded-lg text-xs font-black uppercase tracking-widest border border-blue-100/50 dark:border-blue-800/50">
                    {emp.systemRole || 'Staff'}
                </div>
            </div>
        </motion.div>
    );

    return (
        <Layout>
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                <PageHeader 
                    title="Neural Human Capital"
                    description="Unified directory for managing employees, performance, and cross-functional teams."
                    actions={
                        <div className="flex items-center gap-3">
                            <div className="flex bg-white dark:bg-slate-800 p-1 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700">
                                <button 
                                    onClick={() => setViewMode('GRID')}
                                    className={`p-2 rounded-lg transition-all ${viewMode === 'GRID' ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/20' : 'text-slate-400 hover:text-slate-600'}`}
                                >
                                    <Grid size={18} />
                                </button>
                                <button 
                                    onClick={() => setViewMode('LIST')}
                                    className={`p-2 rounded-lg transition-all ${viewMode === 'LIST' ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/20' : 'text-slate-400 hover:text-slate-600'}`}
                                >
                                    <List size={18} />
                                </button>
                            </div>
                            <button className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-2.5 rounded-xl font-bold flex items-center gap-2 shadow-lg shadow-blue-500/20 transition-all active:scale-95">
                                <Plus size={20} />
                                Add Agent
                            </button>
                        </div>
                    }
                    breadcrumbs={[
                        { label: 'People', link: '/people' },
                        { label: 'Directory' }
                    ]}
                />

                {/* Search and Filters */}
                <div className="mt-8 grid grid-cols-1 lg:grid-cols-4 gap-4 bg-white/50 dark:bg-slate-800/50 p-4 rounded-2xl border border-slate-200 dark:border-slate-700 backdrop-blur-xl">
                    <div className="lg:col-span-2 relative">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                        <input 
                            type="text"
                            placeholder="Universal search (Name, Role, Dept...)"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full pl-12 pr-4 py-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl outline-none focus:ring-2 focus:ring-blue-500/50 text-sm font-medium dark:text-white"
                        />
                    </div>
                    <div className="relative">
                        <Filter className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                        <select 
                            value={filterRole}
                            onChange={(e) => setFilterRole(e.target.value)}
                            className="w-full pl-11 pr-4 py-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl outline-none focus:ring-2 focus:ring-blue-500/50 text-sm font-bold uppercase tracking-wider text-slate-600 dark:text-slate-300 appearance-none"
                        >
                            {roles.map(role => (
                                <option key={role} value={role}>{role}</option>
                            ))}
                        </select>
                    </div>
                    <div className="relative">
                        <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                        <select 
                            value={filterBranch}
                            onChange={(e) => setFilterBranch(e.target.value)}
                            className="w-full pl-11 pr-4 py-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl outline-none focus:ring-2 focus:ring-blue-500/50 text-sm font-bold uppercase tracking-wider text-slate-600 dark:text-slate-300 appearance-none"
                        >
                            <option value="ALL">ALL BRANCHES</option>
                            {branches.map((b: any) => (
                                <option key={b.id} value={b.id}>{b.name.toUpperCase()}</option>
                            ))}
                        </select>
                    </div>
                </div>

                {/* Content Grid */}
                <div className="mt-8">
                    {isLoading ? (
                        <div className="py-40 flex flex-col items-center justify-center">
                            <div className="relative">
                                <Loader2 className="w-12 h-12 animate-spin text-blue-500" />
                                <div className="absolute inset-0 bg-blue-500/20 blur-xl animate-pulse" />
                            </div>
                            <p className="mt-4 text-slate-500 dark:text-slate-400 font-bold tracking-[0.2em] uppercase text-xs">Synchronizing Neural Links...</p>
                        </div>
                    ) : (
                        <AnimatePresence mode="popLayout">
                            {filteredEmployees.length === 0 ? (
                                <motion.div 
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    className="py-40 flex flex-col items-center justify-center text-center bg-white/30 dark:bg-slate-800/30 rounded-3xl border border-dashed border-slate-300 dark:border-slate-700"
                                >
                                    <Users className="w-20 h-20 text-slate-300 dark:text-slate-600 mb-6 opacity-30" />
                                    <h3 className="text-xl font-bold text-slate-800 dark:text-white tracking-tight">Vortex Empty</h3>
                                    <p className="text-slate-500 dark:text-slate-400 max-w-xs mt-2 text-sm leading-relaxed">No agents matched your current neural search criteria. Try broadening your parameters.</p>
                                </motion.div>
                            ) : (
                                <motion.div 
                                    className={viewMode === 'GRID' 
                                        ? "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6" 
                                        : "flex flex-col gap-3"}
                                >
                                    {filteredEmployees.map(emp => (
                                        <EmployeeCard key={emp.id || emp._id} emp={emp} />
                                    ))}
                                </motion.div>
                            )}
                        </AnimatePresence>
                    )}
                </div>

                {/* Stats Footer */}
                <div className="mt-12 flex flex-wrap items-center gap-8 py-6 border-t border-slate-200 dark:border-slate-700/50">
                    <div className="flex items-center gap-3">
                        <div className="w-12 h-12 rounded-2xl bg-blue-500/10 flex items-center justify-center text-blue-600">
                            <Users size={24} />
                        </div>
                        <div>
                            <p className="text-2xl font-black text-slate-800 dark:text-white leading-none">{employees.length}</p>
                            <p className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest mt-1">Total Human Capital</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-3">
                        <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 flex items-center justify-center text-emerald-600">
                            <BadgeCheck size={24} />
                        </div>
                        <div>
                            <p className="text-2xl font-black text-slate-800 dark:text-white leading-none">{employees.filter(e => e.isActive).length}</p>
                            <p className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest mt-1">Active Personnel</p>
                        </div>
                    </div>
                </div>
            </div>
        </Layout>
    );
};

export default EmployeeDirectory;
