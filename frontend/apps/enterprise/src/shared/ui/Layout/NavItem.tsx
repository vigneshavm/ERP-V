import React from 'react';
import { AppView } from '@repo/shared';
import { useUiStore } from '@/shared/lib/store/uiStore';
import { usePermissions } from '@/hooks/usePermissions';
import { useNavigation } from '@/app/providers/NavigationContext';
import { useLocation } from 'react-router-dom';

interface NavItemProps {
    id: AppView;
    icon?: React.ElementType;
    label: string;
    isSubItem?: boolean;
    path?: string;
}

const NavItem: React.FC<NavItemProps> = ({ id, icon: Icon, label, isSubItem = false, path }) => {
    const { navigate } = useNavigation();
    const { pathname } = useLocation();
    const { desktopCollapsed, setSidebarOpen } = useUiStore();
    const { checkAccess } = usePermissions();

    if (!checkAccess(id)) return null;

    // Active if current path starts with the item's path (longest match wins)
    const isActive = path ? (pathname === path || pathname.startsWith(path + '/')) : false;

    const baseClasses = 'group w-full flex items-center transition-all duration-200 outline-none';
    const spacingClasses = desktopCollapsed
        ? 'justify-center py-2.5 px-2'
        : `py-2.5 pr-3 ${isSubItem ? 'pl-11' : 'pl-3 space-x-3'}`;
    const activeClasses = isActive
        ? 'border-l-2 border-primary bg-primary/10 text-primary font-black shadow-[inset_4px_0_12px_-4px_rgba(var(--color-primary),0.2)]'
        : 'border-l-2 border-transparent text-secondary hover:bg-white/5 font-bold opacity-70 hover:opacity-100';
    const textClasses = isSubItem
        ? 'text-[10px] tracking-widest uppercase'
        : 'text-[11px] font-black uppercase tracking-widest';

    return (
        <button
            onClick={() => { navigate(id); setSidebarOpen(false); }}
            title={desktopCollapsed ? label : ''}
            className={`${baseClasses} ${spacingClasses} ${activeClasses} w-full`}
        >
            {Icon && !isSubItem && (
                <Icon className={`w-4 h-4 flex-shrink-0 ${isActive ? 'text-primary' : 'text-neutral-500 group-hover:text-neutral-700'}`} />
            )}
            {!desktopCollapsed && (
                <span className={`${textClasses} truncate`}>{label}</span>
            )}
        </button>
    );
};

export default NavItem;

