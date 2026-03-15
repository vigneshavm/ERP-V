import { useEffect } from 'react';
import { usePathname, useSearchParams } from 'next/navigation';
import { useUiStore } from '@/shared/lib/store/uiStore';
import { useNavigation } from '@/app/providers/NavigationContext';

export const useTabSync = () => {
    const { activeTab, setActiveTab } = useUiStore();
    const { currentView } = useNavigation();
    const pathname = usePathname();
    const searchParams = useSearchParams();

    useEffect(() => {
        if (currentView && activeTab !== currentView) {
            setActiveTab(currentView);
        }
    }, [currentView, activeTab, setActiveTab]);
};
