"use client";

import NotificationsView from '@/features/predictions-and-alerts/NotificationsView';
import { useExpenses } from '@repo/shared';
import { useNavigation } from '@/contexts/NavigationContext';

export default function NotificationsPage() {
    const { refreshTrigger } = useExpenses();
    const { setIsRemindersOpen } = useNavigation();
    
    return (
        <NotificationsView 
            setIsRemindersOpen={setIsRemindersOpen} 
            refreshTrigger={refreshTrigger} 
        />
    );
}
