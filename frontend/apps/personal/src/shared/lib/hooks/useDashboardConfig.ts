import { useState, useEffect } from 'react';
import { getDefaultWidgetIds } from '@/shared/api/WidgetRegistry';

const STORAGE_KEY = 'dashboard_widget_config';

export const useDashboardConfig = () => {
    const [activeWidgetIds, setActiveWidgetIds] = useState<string[]>([]);
    const [isEditMode, setIsEditMode] = useState(false);

    useEffect(() => {
        const saved = localStorage.getItem(STORAGE_KEY);
        if (saved) {
            try {
                setActiveWidgetIds(JSON.parse(saved));
            } catch (e) {
                setActiveWidgetIds(getDefaultWidgetIds());
            }
        } else {
            setActiveWidgetIds(getDefaultWidgetIds());
        }
    }, []);

    const saveConfig = (newIds: string[]) => {
        setActiveWidgetIds(newIds);
        localStorage.setItem(STORAGE_KEY, JSON.stringify(newIds));
    };

    const addWidget = (id: string) => {
        if (!activeWidgetIds.includes(id)) {
            saveConfig([...activeWidgetIds, id]);
        }
    };

    const removeWidget = (id: string) => {
        saveConfig(activeWidgetIds.filter(widgetId => widgetId !== id));
    };

    const reorderWidgets = (newIds: string[]) => {
        saveConfig(newIds);
    };

    return {
        activeWidgetIds,
        isEditMode,
        setIsEditMode,
        reorderWidgets,
        addWidget,
        removeWidget
    };
};
