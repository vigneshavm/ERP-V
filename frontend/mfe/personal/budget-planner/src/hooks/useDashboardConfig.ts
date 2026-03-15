import { useState } from 'react';
import { getDefaultWidgetIds } from '../services/WidgetRegistry';

const STORAGE_KEY = 'dashboard_widget_config';

export const useDashboardConfig = () => {
    const [activeWidgetIds, setActiveWidgetIds] = useState<string[]>(() => {
        if (typeof window !== 'undefined') {
            const saved = localStorage.getItem(STORAGE_KEY);
            if (saved) {
                try {
                    return JSON.parse(saved);
                } catch {
                    return getDefaultWidgetIds();
                }
            }
        }
        return getDefaultWidgetIds();
    });
    const [isEditMode, setIsEditMode] = useState(false);

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
