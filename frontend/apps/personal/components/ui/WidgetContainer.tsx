import React from 'react';
import { Reorder, useDragControls } from 'framer-motion';
import { GripVertical, X } from 'lucide-react';

interface WidgetContainerProps {
    id: string;
    children: React.ReactNode;
    isEditMode: boolean;
    onRemove?: () => void;
    title?: string;
    className?: string;
    style?: React.CSSProperties;
}

export const WidgetContainer: React.FC<WidgetContainerProps> = ({
    id,
    children,
    isEditMode,
    onRemove,
    title,
    className,
    style
}) => {
    const controls = useDragControls();

    return (
        <Reorder.Item
            value={id}
            id={id}
            dragListener={false}
            dragControls={controls}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className={className}
            style={{ listStyle: 'none', marginBottom: '16px', ...style }}
        >
            <div className={`widget-wrapper ${isEditMode ? 'is-editing' : ''}`} style={{
                position: 'relative',
                background: isEditMode ? 'var(--card-bg)' : 'transparent',
                borderRadius: '16px',
                border: isEditMode ? '2px dashed var(--primary-color)' : 'none',
                transition: 'all 0.2s ease',
            }}>
                {isEditMode && (
                    <div className="widget-controls" style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        padding: '8px 12px',
                        background: 'var(--surface-overlay-subtle)',
                        borderBottom: '1px solid var(--card-border)'
                    }}>
                        <div
                            onPointerDown={(e) => controls.start(e)}
                            style={{ cursor: 'grab', display: 'flex', alignItems: 'center', gap: '8px' }}
                        >
                            <GripVertical size={16} color="var(--text-secondary)" />
                            <span style={{ fontSize: '14px', fontWeight: 600, color: 'var(--text-secondary)' }}>
                                {title || 'Widget'}
                            </span>
                        </div>
                        <button
                            onClick={(e) => {
                                e.stopPropagation();
                                onRemove?.();
                            }}
                            style={{
                                background: 'rgba(var(--danger-color-rgb), 0.1)',
                                border: 'none',
                                borderRadius: '50%',
                                width: '24px',
                                height: '24px',
                                display: 'flex',
                                justifyContent: 'center',
                                alignItems: 'center',
                                color: 'var(--danger-color)',
                                cursor: 'pointer'
                            }}
                        >
                            <X size={14} />
                        </button>
                    </div>
                )}
                <div style={{ padding: isEditMode ? '12px' : '0' }}>
                    {children}
                </div>
            </div>
        </Reorder.Item>
    );
};
