import Link from 'next/link';
import StatsAnalytics from './StatsAnalytics';
import { useNavigation } from '@/shared/contexts/NavigationContext';
import { useLanguage } from '@repo/shared';
import { Button } from '@/shared/ui/Button';

interface AnalyticsViewProps {
    refreshTrigger?: number;
}

const AnalyticsView: React.FC<AnalyticsViewProps> = ({ refreshTrigger = 0 }) => {
    const { t } = useLanguage();
    const { setCurrentView } = useNavigation();

    return (
        <div className="view-content-wrapper">
            <div style={{ marginBottom: '24px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <h2 style={{ fontSize: '24px', fontWeight: 700 }}>{t('analytics.title')}</h2>
                    <div style={{ display: 'flex', gap: '8px', overflowX: 'auto', paddingBottom: '8px' }}>
                        <Link href="/insights" style={{ textDecoration: 'none' }}>
                            <Button
                                variant="primary"
                                style={{ flexShrink: 0, padding: '6px 14px', fontSize: '13px', borderRadius: '10px', height: 'auto', minHeight: '32px' }}>
                                {t('analytics.reports')}
                            </Button>
                        </Link>
                        <Link href="/calendar" style={{ textDecoration: 'none' }}>
                            <Button
                                variant="secondary"
                                style={{ flexShrink: 0, padding: '6px 14px', fontSize: '13px', borderRadius: '10px', height: 'auto', minHeight: '32px' }}>
                                {t('analytics.yearly')}
                            </Button>
                        </Link>
                        <Link href="/budget" style={{ textDecoration: 'none' }}>
                            <Button
                                variant="secondary"
                                style={{ flexShrink: 0, padding: '6px 14px', fontSize: '13px', borderRadius: '10px', height: 'auto', minHeight: '32px' }}>
                                {t('analytics.budget')}
                            </Button>
                        </Link>
                        <Link href="/goals" style={{ textDecoration: 'none' }}>
                            <Button
                                variant="secondary"
                                style={{ flexShrink: 0, padding: '6px 14px', fontSize: '13px', borderRadius: '10px', height: 'auto', minHeight: '32px' }}>
                                {t('analytics.goals')}
                            </Button>
                        </Link>
                        <Link href="/loans" style={{ textDecoration: 'none' }}>
                            <Button
                                variant="secondary"
                                style={{ flexShrink: 0, padding: '6px 14px', fontSize: '13px', borderRadius: '10px', height: 'auto', minHeight: '32px' }}>
                                {t('analytics.loans')}
                            </Button>
                        </Link>
                    </div>
                </div>
                <p style={{ color: 'var(--text-secondary)', fontSize: '14px' }}>{t('analytics.analyzeSpending')}</p>
            </div>
            <StatsAnalytics />
        </div>
    );
};

export default AnalyticsView;
