import { logger } from '@/shared/lib/logger';
import React, { useMemo, useState } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import {
    X, ChevronRight, ChevronLeft, Lock, Key, RefreshCcw,
    LayoutDashboard, Zap, DollarSign, FileText, ShoppingCart, List, Users, CreditCard,
    ArrowRight, ArrowDownCircle, Archive, Package, Landmark, Receipt, BarChart, Settings,
    Wrench, Printer, Upload, Download, FileSpreadsheet, Rocket, Store, Megaphone, Globe,
    MessageCircle, RefreshCw, Database, PieChart, UserCheck, Truck, Box, AlertTriangle,
    Layers, Calendar, Briefcase, Building, Save, Palette, LayoutGrid, Shield
} from 'lucide-react';
import { useUiStore } from '@/shared/lib/store/uiStore';
import { setBranch, setTheme } from "@/entities/session/model/authSlice";
import { useConfig } from "@/app/providers/ConfigProvider";
import { useBranchResolver } from "@/hooks/useBranchResolver";
import { usePermissions } from "@/hooks/usePermissions";
import { AppView, ModuleType } from "@repo/shared";
import { RootState } from '@/app/store/store';
import NavItem from './NavItem';
import NavGroup from './NavGroup';
import { ThemeToggle } from '@repo/ui';
import { useNavigation } from '@/app/providers/NavigationContext';
import ChangePasswordModal from '../Auth/ChangePasswordModal';
import { MENU_ITEMS, MenuItem } from '@/app/config/menu.config';



interface SidebarProps {
    onLogout: () => void;
}

const Sidebar: React.FC<SidebarProps> = ({ onLogout }) => {
    const dispatch = useDispatch();
    const { user, role, theme } = useSelector((state: RootState) => state.auth);
    const { tenants, branches: branchesFromDB } = useSelector((state: RootState) => state.tenant);
    const { currentView } = useNavigation();
    const {
        sidebarOpen,
        desktopCollapsed,
        activeTab,
        isSyncing,
        setSidebarOpen,
        setDesktopCollapsed
    } = useUiStore();
    const selectedBranch = useSelector((state: RootState) => state.auth.currentBranch);
    const { tenantId } = useConfig();
    const currentTenant = useMemo(() => tenants.find((t: any) => t.id === tenantId), [tenants, tenantId]);
    const { getBranchName } = useBranchResolver();
    const { checkAccess, checkModuleAccess } = usePermissions();

    const [isChangePasswordOpen, setIsChangePasswordOpen] = useState(false);

    // Helper to check if any child is active to open the group by default
    const isGroupActive = (item: MenuItem): boolean => {
        if (item.id === currentView || item.id === activeTab) return true;
        if (!item.children) return false;
        return item.children.some((child: MenuItem) =>
            child.id === currentView || child.id === activeTab || (child.children && isGroupActive(child))
        );
    };

    const renderMenuItem = (item: MenuItem) => {
        // Manual Bypass in Render
        const isBypassUser = user?.email === 'avmvignesh0207@gmail.com';

        if (!isBypassUser && !checkAccess(item.id) && !checkModuleAccess(item.module)) return null;

        // Special handling for Grow Platform separator/header if needed
        // For now, we just render. We could add a header if item.isGrow is true.

        if (item.children) {
            return (
                <NavGroup
                    key={item.id}
                    icon={item.icon}
                    label={item.label}
                    defaultOpen={isGroupActive(item) || item.isGrow}
                >
                    {item.children.map((child: MenuItem) => renderMenuItem(child))}
                </NavGroup>
            );
        }

        return (
            <NavItem
                key={item.id}
                id={item.id}
                icon={item.icon}
                label={item.label}
                path={item.path}
                isSubItem={false}
            />
        );
    };

    // Recursive render with depth tracking
    const renderRecursive = (item: MenuItem, isSub: boolean = false) => {
        // Manual Bypass in Render
        const isBypassUser = user?.email === 'avmvignesh0207@gmail.com';

        // High-level rule: Access requires User Permission AND Tenant Module
        if (!isBypassUser) {
            const hasRoleAccess = checkAccess(item.id);
            const hasModuleAccess = checkModuleAccess(item.module);

            if (item.id === 'PURCHASE' || item.id === 'DASHBOARD' || item.id === 'FINANCE') {
                logger.info(`Sidebar Debug [${item.id}]:`, {
                    hasRoleAccess,
                    hasModuleAccess,
                    userRole: user?.role,
                    rolePermissionCheck: checkAccess(item.id),
                    moduleCheck: checkModuleAccess(item.module)
                });
            }

            if (!hasRoleAccess) return null;
            if (!hasModuleAccess) return null;
        }

        if (item.children) {
            // Filter children that the user has access to (both role and plan)
            const visibleChildren = isBypassUser ? item.children : item.children.filter((child: MenuItem) =>
                checkAccess(child.id) && checkModuleAccess(child.module)
            );

            // If No children are visible, don't show the group at all
            if (visibleChildren.length === 0) return null;

            return (
                <div key={item.id} className="w-full">
                    <NavGroup
                        icon={item.icon}
                        label={item.label}
                        defaultOpen={isGroupActive(item) || item.isGrow}
                        isActive={isGroupActive(item)}
                    >
                        {visibleChildren.map((child: MenuItem) => renderRecursive(child, true))}
                    </NavGroup>
                </div>
            );
        }

        return (
            <NavItem
                key={item.id}
                id={item.id}
                icon={item.icon}
                label={item.label}
                path={item.path}
                isSubItem={isSub}
            />
        );
    };

    // Branch Selection Logic
    const branchSelector = useMemo(() => {
        // Collect all potential branches for this tenant
        const rawBranches = [
            ...(currentTenant?.locations?.flatMap((l: any) => l.branches) || []),
            ...branchesFromDB.filter((b: any) => (b as any).tenantId === tenantId || (b as any).tenant_id === tenantId)
        ].filter(Boolean);

        // Deduplicate by branch ID
        const uniqueBranchesMap = new Map();
        rawBranches.forEach((b: any) => {
            if (!uniqueBranchesMap.has(b.id)) {
                uniqueBranchesMap.set(b.id, b);
            }
        });
        const availableBranches = Array.from(uniqueBranchesMap.values());

        if (availableBranches.length <= 1) return null;

        return (
            <div className="mt-2 text-center">
                {role === 'Owner' || role === 'Admin' ? (
                    <div className="relative">
                        <select
                            value={selectedBranch}
                            onChange={(e) => dispatch(setBranch(e.target.value))}
                            className="w-full bg-surface border border-default rounded-lg py-1.5 px-2 text-xs font-black text-main focus:outline-none focus:ring-1 focus:ring-primary cursor-pointer transition-all"
                        >
                            <option value="All">All Branches (HQ View)</option>
                            {availableBranches.map((b: any) => (
                                <option key={b.id} value={b.id}>{b.name}</option>
                            ))}
                        </select>
                    </div>
                ) : (
                    <div className="flex items-center gap-1.5 text-xs font-medium text-neutral-500 dark:text-neutral-400 mt-1">
                        <div className="w-1.5 h-1.5 rounded-full bg-success animate-pulse"></div>
                        {getBranchName(selectedBranch || 'All')}
                        {isSyncing && (
                            <RefreshCcw className="w-3 h-3 text-primary animate-spin ml-1" />
                        )}
                    </div>
                )}
            </div>
        );
    }, [currentTenant, branchesFromDB, role, selectedBranch, dispatch, getBranchName, isSyncing, tenantId]);

    // Separate ERP and Growth Platform items
    const erpItems = useMemo(() => MENU_ITEMS.filter((item: MenuItem) => !item.isGrow), []);
    const growItems = useMemo(() => MENU_ITEMS.filter((item: MenuItem) => item.isGrow), []);

    // Filtered items (only visible ones)
    const visibleErpItems = useMemo(() => erpItems.filter((item: MenuItem) => {
        // Manual Bypass in Component for reliability
        if (user?.email === 'avmvignesh0207@gmail.com') return true;

        const hasAccess = checkAccess(item.id) && checkModuleAccess(item.module);
        if (hasAccess) return true;
        // Also show if it has visible children
        return item.children?.some((child: MenuItem) => checkAccess(child.id) && checkModuleAccess(child.module));
    }), [erpItems, checkAccess, checkModuleAccess, user]);

    const visibleGrowItems = useMemo(() => growItems.filter((item: MenuItem) => {
        // Manual Bypass in Component for reliability
        if (user?.email === 'avmvignesh0207@gmail.com') return true;

        const hasAccess = checkAccess(item.id) && checkModuleAccess(item.module);
        if (hasAccess) return true;
        return item.children?.some((child: MenuItem) => checkAccess(child.id) && checkModuleAccess(child.module));
    }), [growItems, checkAccess, checkModuleAccess, user]);

    return (
        <aside className={`
            fixed lg:static inset-y-0 left-0 z-40 bg-sidebar/80 backdrop-blur-xl border-r border-default p-2 flex flex-col transition-all duration-300 transform 
            ${sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
            ${desktopCollapsed ? 'lg:w-20' : 'lg:w-64'}
            expanager-glass
        `}>
            {/* Header */}
            <div className={`flex items-center ${desktopCollapsed ? 'justify-center' : 'justify-between'} mb-4 mt-2 lg:mt-0 ${desktopCollapsed ? 'px-2' : 'px-4'}`}>
                <div className="flex items-center space-x-2 overflow-hidden">
                    <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 overflow-hidden bg-success">
                        {useConfig().logoUrl ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img src={useConfig().logoUrl} alt="Logo" className="w-full h-full object-contain p-1" />
                        ) : (
                            <span className="font-bold text-white">{user?.name?.charAt(0) || currentTenant?.name?.charAt(0) || 'T'}</span>
                        )}
                    </div>
                    {!desktopCollapsed && (
                        <div className="overflow-hidden">
                            <span className="text-sm font-display font-black tracking-tight block leading-none truncate text-main uppercase">{user?.name || 'User'}</span>
                            <span className="text-[9px] text-primary uppercase font-black tracking-[0.2em] leading-relaxed opacity-80 mt-1 block">{role} // Authorized</span>
                        </div>
                    )}
                </div>
                <button onClick={() => setSidebarOpen(false)} className="lg:hidden text-neutral-400">
                    <X className="w-6 h-6" />
                </button>
                <button
                    onClick={() => setDesktopCollapsed(!desktopCollapsed)}
                    className="hidden lg:flex p-1.5 rounded-md hover:bg-white/5 text-secondary transition-colors"
                >
                    {desktopCollapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
                </button>
            </div>

            {/* Tenant Info & Branch */}
            <div className={`mb-6 ${desktopCollapsed ? 'px-2' : 'px-4'}`}>
                {!desktopCollapsed && <span className="text-[10px] text-secondary uppercase font-bold tracking-[0.2em] opacity-80">{currentTenant?.name}</span>}
                {branchSelector}
            </div>

            {/* Navigation Items - Generated from Config */}
            <nav className="flex-1 space-y-1 overflow-y-auto custom-scrollbar pr-2">
                {/* Main ERP Section */}
                {!desktopCollapsed && visibleErpItems.length > 0 && (
                    <div className="px-3 pt-4 pb-2">
                        <h3 className="text-[10px] font-display font-bold text-secondary uppercase tracking-[0.15em] opacity-60">System Core</h3>
                    </div>
                )}
                {visibleErpItems.map((item: MenuItem) => renderRecursive(item, false))}

                {/* Growth Platform Section */}
                {!desktopCollapsed && visibleGrowItems.length > 0 && (
                    <div className="px-3 pt-6 pb-2 border-t border-white/5 mt-4">
                        <h3 className="text-[10px] font-display font-bold text-secondary uppercase tracking-[0.15em] opacity-60">Growth Matrix</h3>
                    </div>
                )}
                {visibleGrowItems.map((item: MenuItem) => renderRecursive(item, false))}
            </nav>

            {/* Footer / User Controls */}
            <div className="pt-4 border-t border-neutral-200 dark:border-neutral-800 mt-2 space-y-2">
                <button
                    onClick={onLogout}
                    className={`w-full flex items-center ${desktopCollapsed ? 'hidden' : 'space-x-3 px-4'} py-3 rounded-lg text-secondary hover:bg-white/5 hover:text-main transition-all group`}
                >
                    <Lock className="w-5 h-5 opacity-40 group-hover:opacity-100 transition-opacity" />
                    <span className="font-black text-[11px] uppercase tracking-widest">Terminate Protocol</span>
                </button>
                {desktopCollapsed && (
                    <div className="flex flex-col gap-2 w-full px-2">
                        <button onClick={onLogout} title="Logout" className="flex-1 flex justify-center py-3 rounded-lg text-secondary hover:bg-white/5 transition-colors">
                            <Lock className="w-5 h-5" />
                        </button>
                        <button onClick={() => setIsChangePasswordOpen(true)} title="Change Password" className="px-3 flex justify-center py-3 rounded-lg text-secondary hover:text-primary hover:bg-white/5 transition-colors">
                            <Key className="w-5 h-5" />
                        </button>
                    </div>
                )}
            </div>
            {/* Theme Toggle - Desktop Footer */}
            {!desktopCollapsed && (
                <div className="pt-2 px-4 pb-2 border-t border-neutral-200 dark:border-neutral-800 flex justify-between items-center">
                    <span className="text-xs font-semibold text-neutral-500 dark:text-neutral-400 uppercase tracking-wider">Appearance</span>
                    <ThemeToggle theme={theme || 'light'} toggleTheme={() => dispatch(setTheme(theme === 'light' ? 'dark' : 'light'))} />
                </div>
            )}
            {desktopCollapsed && (
                <div className="pt-2 px-2 pb-2 border-t border-neutral-200 dark:border-neutral-800 flex justify-center">
                    <ThemeToggle theme={theme || 'light'} toggleTheme={() => dispatch(setTheme(theme === 'light' ? 'dark' : 'light'))} />
                </div>
            )}

            <ChangePasswordModal
                isOpen={isChangePasswordOpen}
                onClose={() => setIsChangePasswordOpen(false)}
            />
        </aside>
    );
};

export default Sidebar;

