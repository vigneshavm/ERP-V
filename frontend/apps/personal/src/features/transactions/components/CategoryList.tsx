"use client";

import React, { useEffect, useState } from 'react';
import { Car, Smartphone, Zap, MoreHorizontal, UserCircle, Coffee, ChevronRight, Heart, Utensils, X } from 'lucide-react';
import { useLanguage, useCategories, useTransactions, formatCurrency, Category, Transaction } from '@repo/shared';
import { Card } from '@/shared/ui/Card';

const iconMap: Record<string, React.ElementType> = {
    Car: Car,
    Smartphone: Smartphone,
    Zap: Zap,
    MoreHorizontal: MoreHorizontal,
    UserCircle: UserCircle,
    Coffee: Coffee,
    Heart: Heart,
    Utensils: Utensils
};

import { useNavigation } from '@/shared/contexts/NavigationContext';

interface CategoryListProps {
    refreshTrigger?: number;
    onCategoryClick?: (category: any) => void;
}

const CategoryList: React.FC<CategoryListProps> = ({ refreshTrigger = 0, onCategoryClick }) => {
    const { t } = useLanguage();
    const { navigateToCategoryDetails } = useNavigation();
    const { categories: rawCategories, loading: catsLoading } = useCategories();
    const { transactions, loading: txnsLoading } = useTransactions();

    const categories = React.useMemo(() => {
        if (catsLoading || txnsLoading) return [];
        
        return rawCategories.map(cat => {
            const catTransactions = transactions.filter(t => t.categoryId === cat.id);
            const totalValue = catTransactions.reduce((sum, t) => sum + Math.abs(t.amount), 0);
            return {
                ...cat,
                value: totalValue
            };
        });
    }, [rawCategories, transactions, catsLoading, txnsLoading]);

    const loading = catsLoading || txnsLoading;

    if (loading) return <div style={{ textAlign: 'center', padding: '20px', color: 'var(--text-secondary)' }}>{t('categories.loading')}</div>;

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', paddingBottom: '100px' }}>
            {categories.map((cat, idx) => {
                const IconComponent = iconMap[cat.icon] || MoreHorizontal;
                return (
                    <Card
                        key={idx}
                        interactive
                        noMargin
                        onClick={() => {
                            if (onCategoryClick) {
                                onCategoryClick(cat);
                            } else {
                                navigateToCategoryDetails(cat.id, cat.name, cat.value, cat.color);
                            }
                        }}
                        style={{
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            padding: '16px',
                            borderRadius: '16px',
                        }}
                    >
                        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                            <div style={{
                                width: '38px',
                                height: '38px',
                                borderRadius: '10px',
                                background: `${cat.color}20`,
                                display: 'flex',
                                justifyContent: 'center',
                                alignItems: 'center',
                                color: cat.color
                            }}>
                                <IconComponent size={20} />
                            </div>
                            <div>
                                <p style={{ fontWeight: 600, fontSize: '16px', color: 'var(--text-primary)' }}>{cat.name}</p>
                                <p style={{ fontSize: '14px', color: 'var(--label-text)' }}>Today, 2:30 PM</p>
                            </div>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <span style={{ fontWeight: 700, fontSize: '18px', color: 'var(--text-primary)' }}>{formatCurrency(cat.value)}</span>
                            <ChevronRight size={16} color="var(--text-secondary)" />
                        </div>
                    </Card>
                );
            })}
        </div>
    );
};

export default CategoryList;
