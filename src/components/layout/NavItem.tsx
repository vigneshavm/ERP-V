import React from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { LucideIcon } from 'lucide-react';
import { RootState } from '../../store';
import { AppView } from '../../types/common';
import { setActiveTab, setSidebarOpen } from '../../store/uiSlice';
import { usePermissions } from '../../hooks/usePermissions';

interface NavItemProps {
    id: AppView;
    icon: LucideIcon;
    label: string;
}

const NavItem: React.FC<NavItemProps> = ({ id, icon: Icon, label }) => {
    const dispatch = useDispatch();
    const { activeTab, desktopCollapsed } = useSelector((state: RootState) => state.ui);
    const { checkAccess } = usePermissions();

    // Hide if no access
    if (!checkAccess(id)) return null;

    return (
        <button
            onClick={() => {
                dispatch(setActiveTab(id));
                dispatch(setSidebarOpen(false));
            }}
            title={desktopCollapsed ? label : ''}
            className={`w-full flex items-center ${desktopCollapsed ? 'justify-center px-2' : 'space-x-3 px-4'} py-3 rounded-lg transition-colors duration-200 ${activeTab === id
                ? 'bg-primary text-white shadow-md'
                : 'text-neutral-600 dark:text-neutral-400 hover:bg-neutral-100 dark:hover:bg-neutral-800'
                }`}
        >
            <Icon className="w-5 h-5 flex-shrink-0" />
            {!desktopCollapsed && <span className="font-medium truncate">{label}</span>}
        </button>
    );
};

export default NavItem;
