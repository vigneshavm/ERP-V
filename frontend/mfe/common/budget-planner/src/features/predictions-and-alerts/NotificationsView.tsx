import { Bell, CreditCard, PieChart, Shield, Calendar, ArrowRight } from 'lucide-react';
import { formatCurrency } from '@repo/shared';
import { useLanguage } from '@repo/shared';
import { useNotificationsFeature } from './hooks/useNotificationsFeature';

const iconMap: Record<string, React.ElementType> = {
    CreditCard: CreditCard,
    PieChart: PieChart,
    Shield: Shield,
    Calendar: Calendar,
    Zap: Bell, // Defaulting some if not found
    Smartphone: Bell
};

interface NotificationsViewProps {
    setIsRemindersOpen: (open: boolean) => void;
    refreshTrigger?: number;
}

const NotificationsView: React.FC<NotificationsViewProps> = ({ setIsRemindersOpen }) => {
    const { t } = useLanguage();
    const { notifications, loading } = useNotificationsFeature();

    if (loading) return <div style={{ textAlign: 'center', padding: '100px', color: 'var(--text-secondary)' }}>{t('notificationsView.loading')}</div>;

    return (
        <div className="view-container">
            <div className="view-page-header" style={{ marginBottom: '8px' }}>
                <h2 style={{ fontSize: '24px', fontWeight: 700 }}>{t('notificationsView.title')}</h2>
                <div style={{ color: 'var(--primary-color)', fontSize: '13px', fontWeight: 700 }} className="clickable">{t('notificationsView.markRead')}</div>
            </div>

            {/* Bill Reminders Entry */}
            <div
                onClick={() => setIsRemindersOpen(true)}
                className="glass-card clickable"
                style={{ 
                    padding: '20px', 
                    background: 'linear-gradient(135deg, rgba(var(--warning-color-rgb), 0.15) 0%, rgba(var(--warning-color-rgb), 0.05) 100%)', 
                    border: '1px solid rgba(var(--warning-color-rgb), 0.3)' 
                }}
            >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                        <div style={{ width: '48px', height: '48px', background: 'var(--primary-color)', borderRadius: '14px', display: 'flex', justifyContent: 'center', alignItems: 'center', color: 'var(--text-on-primary)' }}>
                            <Calendar size={24} />
                        </div>
                        <div>
                            <h3 style={{ fontSize: '16px', fontWeight: 700 }}>{t('notificationsView.billReminders')}</h3>
                            <p style={{ fontSize: '13px', color: 'var(--text-secondary)', marginTop: '2px' }}>3 {t('notificationsView.upcomingBills')}</p>
                        </div>
                    </div>
                    <ArrowRight size={20} color="var(--primary-color)" />
                </div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                {notifications.map((notif) => {
                    const IconComponent = iconMap[notif.icon] || Bell;
                    return (
                        <div key={notif.id} className="glass-card" style={{
                            padding: '16px',
                            marginBottom: '10px',
                            display: 'flex',
                            gap: '16px',
                            background: notif.read ? 'var(--surface-overlay-subtle)' : 'var(--surface-overlay)',
                            border: notif.read ? '1px solid transparent' : '1px solid rgba(var(--warning-color-rgb), 0.1)'
                        }}>
                            <div style={{
                                width: '44px',
                                height: '44px',
                                borderRadius: '12px',
                                background: `${notif.color}15`,
                                display: 'flex',
                                justifyContent: 'center',
                                alignItems: 'center',
                                color: notif.color,
                                flexShrink: 0
                            }}>
                                <IconComponent size={20} />
                            </div>
                            <div style={{ flex: 1 }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '4px' }}>
                                    <h4 style={{ fontSize: '15px', fontWeight: 700 }}>{notif.title}</h4>
                                    <span style={{ fontSize: '13px', color: 'var(--text-secondary)', fontWeight: 500 }}>{notif.time}</span>
                                </div>
                                <p style={{ fontSize: '14px', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
                                    {notif.message.replace(/₹\s?[\d,]+/g, (match: string) => {
                                        // Simple regex to find ₹ and amount, then format it. 
                                        // Note: Since we have the amount field now, we could use that if type is 'Spent' or 'Reminder'
                                        return match; // Keeping it for now as data.json already has ₹ in message
                                    })}
                                </p>
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
};

export default NotificationsView;
