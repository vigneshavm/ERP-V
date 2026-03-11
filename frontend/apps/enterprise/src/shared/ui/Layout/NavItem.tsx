import React from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { LucideIcon } from 'lucide-react';
import { RootState } from "@/app/store/store";
import { AppView } from "@repo/shared";
import { useUiStore } from "@/shared/lib/store/uiStore";
import { usePermissions } from "@/hooks/usePermissions";
import { preloadByViewId } from "@/app/registry/ModuleRegistry";

interface NavItemProps {
    id: AppView;
    icon?: React.ElementType;
    label: string;
    isSubItem?: boolean;
    path?: string;
}

const NavItem: React.FC<NavItemProps> = ({ id, icon: Icon, label, isSubItem = false, path }) => {
    const navigate = useNavigate();
    const {
        activeTab,
        desktopCollapsed,
        setActiveTab,
        setSidebarOpen
    } = useUiStore();
    const { checkAccess } = usePermissions();

    // Hide if no access
    if (!checkAccess(id)) return null;

    const isActive = activeTab === id;

    // Base classes
    const baseClasses = "group w-full flex items-center transition-all duration-200 outline-none";

    // Spacing & Height (36px ~ py-2)
    const spacingClasses = desktopCollapsed
        ? "justify-center py-2 px-2"
        : `py-2 pr-3 ${isSubItem ? "pl-10" : "pl-3 space-x-3"}`; // 12px padding = pl-3. Indent for sub = 16px relative? 
    // Requirement: Left padding 12px for main. Submenu indent 16px. 
    // If Main: pl-3.
    // If Sub: pl-3 + 16px? Let's assume standard indentation. Tailwind pl-3 is 0.75rem=12px.
    // Submenu usually implies visual nesting. I will use pl-9 (36px) or pl-10 for sub items if no icon.

    // Active State Logic
    // Active: Blue left border (2px), Light blue background, Bold text
    // We simulate border-l-2 with a span or intrinsic border. 
    // Intrinsic border requires element to be flush left, but we have padding. 
    // Better to use a relative container or shadow. 
    // Requirement: "Blue left border (2px)". If the button has rounded corners, an inset border might look weird. 
    // Usually standardized sidebar items cover full width minus margins.
    // Let's try: No border radius on left if active? Or just a left accent bar.

    const activeClasses = isActive
        ? "border-l-2 border-primary bg-primary/10 text-primary font-bold"
        : "border-l-2 border-transparent text-neutral-600 dark:text-neutral-400 hover:bg-neutral-100 dark:hover:bg-neutral-800 font-medium";

    // Text Size
    const textClasses = isSubItem ? "text-[12px]" : "text-[13px] font-semibold";

    return (
        <button
            onMouseEnter={() => preloadByViewId(id)}
            onClick={() => {
                setActiveTab(id);
                setSidebarOpen(false);
                if (path) {
                    navigate(path);
                }
            }}
            title={desktopCollapsed ? label : ''}
            className={`${baseClasses} ${spacingClasses} ${activeClasses}`}
        >
            {/* Icon - Only for Main items or if explicit */}
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

