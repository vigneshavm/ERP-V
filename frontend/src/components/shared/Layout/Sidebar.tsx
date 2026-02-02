import React, { useMemo, useState } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { X, ChevronRight, ChevronLeft, Lock, Key } from 'lucide-react';
import { RootState } from "../../../redux/store";
import { setSidebarOpen, setDesktopCollapsed, setSyncing } from "../../../redux/slices/uiSlice";
import { setBranch } from "../../../redux/slices/authSlice";
import { RefreshCcw } from 'lucide-react';
import { useConfig } from "../../../contexts/ConfigProvider";
import { useBranchResolver } from "../../../hooks/useBranchResolver";
import { usePermissions } from "../../../hooks/usePermissions";
import { MENU_ITEMS, MenuItem } from '@/config/menu.config';
import NavItem from './NavItem';
import NavGroup from './NavGroup';
import { ThemeToggle } from '../../core/Display/ThemeToggle';
import ChangePasswordModal from '../Auth/ChangePasswordModal';

interface SidebarProps {
    onLogout: () => void;
}

const Sidebar: React.FC<SidebarProps> = ({ onLogout }) => {
    const dispatch = useDispatch();
    const { user, role } = useSelector((state: RootState) => state.auth);
    const { tenants, branches: branchesFromDB } = useSelector((state: RootState) => state.tenant);
    const { sidebarOpen, desktopCollapsed, activeTab, isSyncing } = useSelector((state: RootState) => state.ui);
    const selectedBranch = useSelector((state: RootState) => state.auth.currentBranch);
    const { tenantId } = useConfig();
    const currentTenant = useMemo(() => tenants.find(t => t.id === tenantId), [tenants, tenantId]);
    const { getBranchName } = useBranchResolver();
    const { checkAccess, checkModuleAccess } = usePermissions();

    const [isChangePasswordOpen, setIsChangePasswordOpen] = useState(false);

    // Helper to check if any child is active to open the group by default
    const isGroupActive = (item: MenuItem): boolean => {
        if (!item.children) return false;
        return item.children.some(child =>
            child.id === activeTab || (child.children && isGroupActive(child))
        );
    };

    const renderMenuItem = (item: MenuItem) => {
        if (!checkAccess(item.id) && !checkModuleAccess(item.module)) return null;

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
                    {item.children.map(child => renderMenuItem(child))}
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
                isSubItem={false} // NavGroup handles indentation for children usually, or we pass isSubItem logic?
            // Note: NavGroup's children are rendered directly. NavGroup usually wraps them in a div.
            // NavItem checks "isSubItem" for styling. We need to pass it if it's nested.
            // But simplified logic: If we are in renderMenuItem of a child loop, we are essentially at a sub level.
            // However, `renderMenuItem` is recursive.
            // Let's rely on NavGroup's structure or adding context? 
            // The existing NavItem takes `isSubItem`.
            // Let's assume for top level it's false.
            />
        );
    };

    // Recursive render with depth tracking
    const renderRecursive = (item: MenuItem, isSub: boolean = false) => {
        // High-level rule: Access requires User Permission AND Tenant Module
        if (!checkAccess(item.id)) return null;
        if (!checkModuleAccess(item.module)) return null;

        if (item.children) {
            // Filter children that the user has access to (both role and plan)
            const visibleChildren = item.children.filter((child: MenuItem) =>
                checkAccess(child.id) && checkModuleAccess(child.module)
            );

            // If No children are visible, don't show the group at all
            if (visibleChildren.length === 0) return null;

            return (
                <div key={item.id}>
                    <NavGroup
                        icon={item.icon}
                        label={item.label}
                        defaultOpen={isGroupActive(item) || item.isGrow}
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
            ...branchesFromDB.filter(b => (b as any).tenantId === tenantId || (b as any).tenant_id === tenantId)
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
                            className="w-full bg-neutral-100 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-lg py-1.5 px-2 text-xs font-bold text-neutral-700 dark:text-neutral-300 focus:outline-none focus:ring-2 focus:ring-primary cursor-pointer"
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
                        {getBranchName(selectedBranch)}
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
        const hasAccess = checkAccess(item.id) && checkModuleAccess(item.module);
        if (hasAccess) return true;
        // Also show if it has visible children
        return item.children?.some((child: MenuItem) => checkAccess(child.id) && checkModuleAccess(child.module));
    }), [erpItems, checkAccess, checkModuleAccess]);

    const visibleGrowItems = useMemo(() => growItems.filter((item: MenuItem) => {
        const hasAccess = checkAccess(item.id) && checkModuleAccess(item.module);
        if (hasAccess) return true;
        return item.children?.some((child: MenuItem) => checkAccess(child.id) && checkModuleAccess(child.module));
    }), [growItems, checkAccess, checkModuleAccess]);

    return (
        <aside className={`
            fixed lg:static inset-y-0 left-0 z-40 bg-white dark:bg-neutral-900 border-r border-neutral-200 dark:border-neutral-800 p-2 flex flex-col transition-all duration-300 transform 
            ${sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
            ${desktopCollapsed ? 'lg:w-20' : 'lg:w-64'}
        `}>
            {/* Header */}
            <div className={`flex items-center ${desktopCollapsed ? 'justify-center' : 'justify-between'} mb-4 mt-2 lg:mt-0 ${desktopCollapsed ? 'px-2' : 'px-4'}`}>
                <div className="flex items-center space-x-2 overflow-hidden">
                    <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 overflow-hidden bg-success">
                        {useConfig().logoUrl ? (
                            <img src={useConfig().logoUrl} alt="Logo" className="w-full h-full object-contain p-1" />
                        ) : (
                            <span className="font-bold text-white">{user?.name?.charAt(0) || currentTenant?.name?.charAt(0) || 'T'}</span>
                        )}
                    </div>
                    {!desktopCollapsed && (
                        <div className="overflow-hidden">
                            <span className="text-lg font-bold tracking-tight block leading-none truncate">{user?.name || 'User'}</span>
                            <span className="text-xs text-neutral-500 dark:text-neutral-400 uppercase font-bold tracking-wider">{role}</span>
                        </div>
                    )}
                </div>
                <button onClick={() => dispatch(setSidebarOpen(false))} className="lg:hidden text-neutral-400">
                    <X className="w-6 h-6" />
                </button>
                <button
                    onClick={() => dispatch(setDesktopCollapsed(!desktopCollapsed))}
                    className="hidden lg:flex p-1 rounded hover:bg-neutral-100 dark:hover:bg-neutral-800 text-neutral-400"
                >
                    {desktopCollapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
                </button>
            </div>

            {/* Tenant Info & Branch */}
            <div className={`mb-6 ${desktopCollapsed ? 'px-2' : 'px-4'}`}>
                {!desktopCollapsed && <span className="text-[10px] text-neutral-500 uppercase font-bold tracking-widest">{currentTenant?.name}</span>}
                {branchSelector}
            </div>

            {/* Navigation Items - Generated from Config */}
            <nav className="flex-1 space-y-1 overflow-y-auto custom-scrollbar pr-2">
                {/* Main ERP Section */}
                {!desktopCollapsed && visibleErpItems.length > 0 && (
                    <div className="px-3 pt-4 pb-2">
                        <h3 className="text-[11px] font-bold text-neutral-400 dark:text-neutral-500 uppercase tracking-wider">Main ERP</h3>
                    </div>
                )}
                {visibleErpItems.map((item: MenuItem) => renderRecursive(item, false))}

                {/* Growth Platform Section */}
                {!desktopCollapsed && visibleGrowItems.length > 0 && (
                    <div className="px-3 pt-6 pb-2 border-t border-neutral-100 dark:border-neutral-800/50 mt-4">
                        <h3 className="text-[11px] font-bold text-neutral-400 dark:text-neutral-500 uppercase tracking-wider">Growth Platform</h3>
                    </div>
                )}
                {visibleGrowItems.map((item) => renderRecursive(item, false))}
            </nav>

            {/* Footer / User Controls */}
            <div className="pt-4 border-t border-neutral-200 dark:border-neutral-800 mt-2 space-y-2">
                <button
                    onClick={onLogout}
                    className={`w-full flex items-center ${desktopCollapsed ? 'hidden' : 'space-x-3 px-4'} py-3 rounded-lg text-neutral-600 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors`}
                >
                    <Lock className="w-5 h-5" />
                    <span className="font-medium">Staff Logout</span>
                </button>
                {desktopCollapsed && (
                    <div className="flex flex-col gap-2 w-full px-2">
                        <button onClick={onLogout} title="Logout" className="flex-1 flex justify-center py-3 rounded-lg text-neutral-600 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors">
                            <Lock className="w-5 h-5" />
                        </button>
                        <button onClick={() => setIsChangePasswordOpen(true)} title="Change Password" className="px-3 flex justify-center py-3 rounded-lg text-neutral-400 dark:text-neutral-500 hover:text-primary hover:bg-primary/10 dark:hover:bg-neutral-800 transition-colors">
                            <Key className="w-5 h-5" />
                        </button>
                    </div>
                )}
            </div>
            {/* Theme Toggle - Desktop Footer */}
            {!desktopCollapsed && (
                <div className="pt-2 px-4 pb-2 border-t border-neutral-200 dark:border-neutral-800 flex justify-between items-center">
                    <span className="text-xs font-semibold text-neutral-500 dark:text-neutral-400 uppercase tracking-wider">Appearance</span>
                    <ThemeToggle />
                </div>
            )}
            {desktopCollapsed && (
                <div className="pt-2 px-2 pb-2 border-t border-neutral-200 dark:border-neutral-800 flex justify-center">
                    <ThemeToggle />
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
