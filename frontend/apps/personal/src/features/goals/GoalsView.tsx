"use client";

import React, { useState } from 'react';
import { Target, TrendingUp, ChevronLeft, Plus, Rocket, Award, Zap, ChevronRight, Sparkles } from 'lucide-react';
import { 
    formatCurrency, 
    useLanguage, 
    useGoals,
    PersonalTransactionType
} from '@repo/shared';
import { Card } from '@/shared/ui/Card';
import { Button } from '@/shared/ui/Button';
import AddGoalModal from './AddGoalModal';

const iconMap: Record<string, React.ElementType> = {
    Target: Target,
    Rocket: Rocket,
    Award: Award
};

const GoalsView: React.FC<{ onAddGoal?: () => void; refreshTrigger?: number; onBack?: () => void; }> = ({ onAddGoal, onBack }) => {
    const { t } = useLanguage();
    const { 
        goals, 
        loading, 
        addGoal, 
        updateGoalProgress,
        refresh
    } = useGoals();
    
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);
    const [isSimulatorOpen, setIsSimulatorOpen] = useState(false);
    const [selectedGoal, setSelectedGoal] = useState<any | null>(null);

    const openSimulator = (goal: any) => {
        setSelectedGoal(goal);
        setIsSimulatorOpen(true);
    };

    if (loading) return <div style={{ textAlign: 'center', padding: '100px', color: 'var(--text-secondary)' }}>{t('goals.loading')}</div>;

    const totalSaved = goals.reduce((acc, goal) => acc + (goal.currentAmount || 0), 0);
    const totalTargetValue = goals.reduce((acc, goal) => acc + (goal.targetAmount || 0), 0);
    const globalProgress = totalTargetValue > 0 ? Math.round((totalSaved / totalTargetValue) * 100) : 0;

    return (
        <div className="view-content-wrapper">
            <div className="view-container">
                {/* Header */}
                <div className="view-page-header">
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        {onBack && (
                            <Button
                                variant="ghost"
                                onClick={onBack}
                                style={{ padding: '8px', minWidth: 'auto', color: 'var(--text-secondary)' }}
                            >
                                <ChevronLeft size={24} />
                            </Button>
                        )}
                        <div>
                            <h2 style={{ fontSize: '24px', fontWeight: 700 }}>{t('goals.title')}</h2>
                            <p style={{ color: 'var(--text-secondary)', fontSize: '14px' }}>{t('goals.subtitle')}</p>
                        </div>
                    </div>
                    <Button
                        variant="primary"
                        onClick={() => setIsAddModalOpen(true)}
                        style={{ width: '44px', height: '44px', padding: 0, display: 'flex', justifyContent: 'center', alignItems: 'center', borderRadius: '12px' }}
                    >
                        <Plus size={24} color="var(--bg-color)" />
                    </Button>
                </div>
            </div>

            {/* Global Progress Summary */}
            <Card style={{ padding: '24px', position: 'relative', overflow: 'hidden' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', position: 'relative', zIndex: 1 }}>
                    <p style={{ fontSize: '14px', color: 'var(--text-secondary)', fontWeight: 600 }}>{t('goals.totalSaved')}</p>
                    <div style={{ padding: '4px 8px', borderRadius: '8px', background: 'rgba(var(--success-color-rgb), 0.1)', color: 'var(--success-color)', fontSize: '13px', fontWeight: 700 }}>+{globalProgress}% {t('goals.progress')}</div>
                </div>
                <h2 style={{ fontSize: '32px', fontWeight: 800, marginBottom: '8px' }}>{formatCurrency(totalSaved)}</h2>
                <div style={{ width: '100%', height: '8px', background: 'var(--surface-overlay)', borderRadius: '4px', overflow: 'hidden', marginTop: '16px' }}>
                    <div style={{ width: `${globalProgress}%`, height: '100%', background: 'var(--primary-color)', boxShadow: '0 0 15px var(--primary-color)' }}></div>
                </div>
                {/* Decorative Elements */}
                <div style={{ position: 'absolute', top: '-20px', right: '-20px', width: '100px', height: '100px', background: 'var(--primary-color)', filter: 'blur(60px)', opacity: 0.15 }}></div>
            </Card>

            {/* Goals Grid */}
            <div className="responsive-grid goals-grid">
                {goals.map((goal) => {
                    const current = goal.currentAmount || 0;
                    const target = goal.targetAmount || 1;
                    const progress = Math.round((current / target) * 100);
                    const IconComponent = Target; // Default icon
                    return (
                        <Card key={goal.id} style={{ padding: '20px', marginBottom: 0, position: 'relative' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '16px' }}>
                                <div style={{ width: '44px', height: '44px', borderRadius: '12px', background: `${goal.color}15`, display: 'flex', justifyContent: 'center', alignItems: 'center', border: `1px solid ${goal.color}30` }}>
                                    <IconComponent size={22} color={goal.color} />
                                </div>
                                <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                                    <Button
                                        variant="ghost"
                                        onClick={() => openSimulator(goal)}
                                        style={{ padding: '8px', minWidth: 'auto', background: 'var(--surface-overlay)', borderRadius: '10px' }}
                                    >
                                        <Sparkles size={18} color="var(--primary-color)" />
                                    </Button>
                                    <div style={{ textAlign: 'right' }}>
                                        <p style={{ fontSize: '18px', fontWeight: 700, color: goal.color }}>{progress}%</p>
                                        <span style={{ fontSize: '14px', color: goal.color, fontWeight: 600 }}>{formatCurrency(target)}</span>
                                    </div>
                                </div>
                            </div>

                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                                <h3 style={{ fontSize: '16px', fontWeight: 600 }}>{goal.name}</h3>
                                {goal.isCollaborative && (
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                                        <div style={{ display: 'flex', marginLeft: '8px' }}>
                                            {goal.participants?.slice(0, 3).map((p: any, i: number) => (
                                                <div
                                                    key={p.id}
                                                    title={p.name}
                                                    style={{
                                                        width: '24px',
                                                        height: '24px',
                                                        borderRadius: '50%',
                                                        background: p.color,
                                                        border: '2px solid var(--bg-color)',
                                                        marginLeft: i === 0 ? 0 : '-8px',
                                                        display: 'flex',
                                                        justifyContent: 'center',
                                                        alignItems: 'center',
                                                        fontSize: '12px',
                                                        fontWeight: 700,
                                                        color: 'var(--bg-color)',
                                                        zIndex: 3 - i
                                                    }}
                                                >
                                                    {p.initials}
                                                </div>
                                            ))}
                                            {(goal.participants?.length || 0) > 3 && (
                                                <div style={{
                                                    width: '24px',
                                                    height: '24px',
                                                    borderRadius: '50%',
                                                    background: 'var(--surface-overlay-strong)',
                                                    border: '2px solid #141414',
                                                    marginLeft: '-8px',
                                                    display: 'flex',
                                                    justifyContent: 'center',
                                                    alignItems: 'center',
                                                    fontSize: '11px',
                                                    color: 'var(--text-primary)',
                                                    zIndex: 0
                                                }}>
                                                    +{(goal.participants?.length || 0) - 3}
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                )}
                            </div>

                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                                <div style={{ display: 'flex', flexDirection: 'column' }}>
                                    <span style={{ fontSize: '18px', fontWeight: 700 }}>{formatCurrency(current)}</span>
                                    <span style={{ color: 'var(--text-secondary)', fontSize: '14px' }}>{formatCurrency(target - current)} {t('goals.remaining')}</span>
                                </div>
                                <div style={{ width: '48px', height: '48px', position: 'relative' }}>
                                    <svg viewBox="0 0 36 36" style={{ width: '100%', height: '100%' }}>
                                        <circle cx="18" cy="18" r="16" fill="none" stroke="var(--surface-border)" strokeWidth="3" />
                                        <circle cx="18" cy="18" r="16" fill="none" stroke={goal.color} strokeWidth="3" strokeDasharray={`${progress}, 100`} transform="rotate(-90 18 18)" />
                                    </svg>
                                </div>
                            </div>

                            <div style={{ width: '100%', height: '4px', background: 'var(--surface-overlay)', borderRadius: '2px', overflow: 'hidden', marginBottom: '16px' }}>
                                <div style={{ width: `${progress}%`, height: '100%', background: goal.color }}></div>
                            </div>

                            <div style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: '12px',
                                background: 'var(--surface-overlay)',
                                padding: '12px 16px',
                                borderRadius: '12px',
                                border: '1px solid var(--surface-border)'
                            }}>
                                <div style={{ width: '32px', height: '32px', borderRadius: '50%', background: 'rgba(var(--warning-color-rgb), 0.1)', display: 'flex', justifyContent: 'center', alignItems: 'center', color: 'var(--warning-color)' }}>
                                    <Zap size={16} />
                                </div>
                                <p style={{ fontSize: '14px', color: 'var(--text-secondary)', flex: 1 }}>
                                    Target Date: <span style={{ color: 'var(--text-primary)', fontWeight: 700 }}>{goal.deadline}</span>.
                                </p>
                                <ChevronRight size={18} color="var(--text-secondary)" className="clickable" />
                            </div>
                        </Card>
                    );
                })}
            </div>

            {/* Savings Tip */}
            <Card style={{ padding: '20px', background: 'linear-gradient(135deg, rgba(var(--warning-color-rgb), 0.1), rgba(var(--success-color-rgb), 0.1))', display: 'flex', gap: '16px', alignItems: 'center', flexDirection: 'row' }}>
                <div style={{ width: '50px', height: '50px', background: 'var(--primary-color)', borderRadius: '16px', display: 'flex', justifyContent: 'center', alignItems: 'center', flexShrink: 0 }}>
                    <TrendingUp size={24} color="var(--bg-color)" />
                </div>
                <div>
                    <h4 style={{ fontSize: '16px', fontWeight: 700, marginBottom: '4px' }}>{t('goals.smartSavingsTip')}</h4>
                    <p style={{ fontSize: '14px', color: 'var(--text-secondary)', lineHeight: 1.4 }}>{t('goals.savingsTipDesc')}</p>
                </div>
            </Card>

            {/* Modals */}
            <AddGoalModal
                isOpen={isAddModalOpen}
                onClose={() => setIsAddModalOpen(false)}
                onAdded={() => refresh()}
            />

            {/* {selectedGoal && (
                <ScenarioSimulator
                    isOpen={isSimulatorOpen}
                    onClose={() => setIsSimulatorOpen(false)}
                    currentSavings={selectedGoal.current}
                    goal={{
                        name: selectedGoal.name,
                        target: selectedGoal.target,
                        deadline: selectedGoal.deadline
                    }}
                />
            )} */}
        </div>
    );
};

export default GoalsView;
