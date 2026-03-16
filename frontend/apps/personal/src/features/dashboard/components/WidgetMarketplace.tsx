import React from 'react';
import { X, Plus, Check, ShoppingBag } from 'lucide-react';
import { WIDGET_REGISTRY, Widget } from '@/shared/api/WidgetRegistry';
import { Card } from '@/shared/ui/Card';

interface WidgetMarketplaceProps {
    isOpen: boolean;
    onClose: () => void;
    activeWidgetIds: string[];
    onToggleWidget: (id: string) => void;
}

const WidgetMarketplace: React.FC<WidgetMarketplaceProps> = ({
    isOpen,
    onClose,
    activeWidgetIds,
    onToggleWidget
}) => {
    if (!isOpen) return null;

    const categories: Widget['category'][] = ['Essential', 'Analysis', 'Tools'];

    return (
        <div className="modal-overlay" style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'var(--bg-color)',
            opacity: 0.95,
            backdropFilter: 'blur(8px)',
            zIndex: 1000,
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'flex-end'
        }}>
            <div className="marketplace-container" style={{
                width: '100%',
                maxWidth: '800px',
                background: 'var(--bg-color)',
                borderRadius: '24px',
                padding: '32px',
                maxHeight: '90vh',
                display: 'flex',
                flexDirection: 'column',
                boxShadow: '0 20px 50px rgba(0,0,0,0.5)',
                margin: '20px'
            }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '32px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                        <div style={{
                            width: '48px',
                            height: '48px',
                            borderRadius: '14px',
                            background: 'var(--primary-color)',
                            display: 'flex',
                            justifyContent: 'center',
                            alignItems: 'center',
                            color: 'black'
                        }}>
                            <ShoppingBag size={24} />
                        </div>
                        <div>
                            <h2 style={{ fontSize: '24px', fontWeight: 800 }}>Widget Store</h2>
                            <p style={{ fontSize: '14px', color: 'var(--text-secondary)' }}>Personalize your financial dashboard</p>
                        </div>
                    </div>
                    <button
                        onClick={onClose}
                        style={{ background: 'none', border: 'none', color: 'var(--text-secondary)', padding: '4px', cursor: 'pointer' }}
                    >
                        <X size={24} />
                    </button>
                </div>

                <div style={{ flex: 1, overflowY: 'auto', paddingRight: '8px' }}>
                    {categories.map(category => (
                        <div key={category} style={{ marginBottom: '32px' }}>
                            <h3 style={{ fontSize: '14px', fontWeight: 700, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '1.5px', marginBottom: '16px', borderLeft: '3px solid var(--primary-color)', paddingLeft: '12px' }}>
                                {category}
                            </h3>
                            <div style={{
                                display: 'grid',
                                gap: '16px',
                                gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))'
                            }}>
                                {WIDGET_REGISTRY.filter(w => w.category === category).map(widget => {
                                    const isActive = activeWidgetIds.includes(widget.id);
                                    return (
                                        <Card
                                            key={widget.id}
                                            style={{
                                                padding: '20px',
                                                display: 'flex',
                                                flexDirection: 'column',
                                                gap: '16px',
                                                border: isActive ? '2px solid var(--primary-color)' : '1px solid var(--card-border)',
                                                background: isActive ? 'rgba(46, 204, 113, 0.05)' : 'var(--card-bg)',
                                                height: '100%'
                                            }}
                                        >
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                                                <div style={{
                                                    width: '50px',
                                                    height: '50px',
                                                    borderRadius: '14px',
                                                    background: 'var(--surface-overlay)',
                                                    display: 'flex',
                                                    justifyContent: 'center',
                                                    alignItems: 'center',
                                                    color: isActive ? 'var(--primary-color)' : 'var(--text-secondary)'
                                                }}>
                                                    {widget.icon}
                                                </div>
                                                <div style={{ flex: 1 }}>
                                                    <h4 style={{ fontSize: '17px', fontWeight: 700 }}>{widget.name}</h4>
                                                    <span style={{ fontSize: '11px', color: 'var(--text-secondary)', fontWeight: 600 }}>{widget.category}</span>
                                                </div>
                                            </div>
                                            <p style={{ fontSize: '13px', color: 'var(--text-secondary)', lineHeight: 1.5, flex: 1 }}>{widget.description}</p>
                                            <button
                                                onClick={() => onToggleWidget(widget.id)}
                                                style={{
                                                    width: '100%',
                                                    padding: '12px',
                                                    borderRadius: '12px',
                                                    border: 'none',
                                                    background: isActive ? 'var(--primary-color)' : 'var(--surface-overlay)',
                                                    color: isActive ? 'var(--bg-color)' : 'var(--text-primary)',
                                                    display: 'flex',
                                                    justifyContent: 'center',
                                                    alignItems: 'center',
                                                    gap: '8px',
                                                    cursor: 'pointer',
                                                    transition: 'all 0.2s ease',
                                                    fontWeight: 700
                                                }}
                                            >
                                                {isActive ? <><Check size={18} /> Enabled</> : <><Plus size={18} /> Add to Dashboard</>}
                                            </button>
                                        </Card>
                                    );
                                })}
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};

export default WidgetMarketplace;
