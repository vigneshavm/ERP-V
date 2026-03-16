"use client";

import NotificationsView from '@/features/predictions-and-alerts/NotificationsView';
import { useExpenseStore } from '@repo/shared';

import { useNavigation } from '@/shared/contexts/NavigationContext';

export default function NotificationsPage() {
    const { refreshTrigger } = useExpenseStore();

    const { setIsRemindersOpen } = useNavigation();
    
    return (
        <NotificationsView 
            setIsRemindersOpen={setIsRemindersOpen} 
            refreshTrigger={refreshTrigger} 
        />
    );
}
