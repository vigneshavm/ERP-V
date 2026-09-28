import React from 'react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { cleanup, render, screen } from '@testing-library/react';

vi.stubGlobal('ResizeObserver', class { observe() {} unobserve() {} disconnect() {} });

import ExperienceInsights from './ExperienceInsights';

afterEach(cleanup);

const trend = (label: string, expense: number, income: number | null) => ({ month: label, year: 2026, label, expense, income, budget_utilization: null, budget: null });

describe('ExperienceInsights', () => {
    it('averages expense, income and balance over the monthly trends', () => {
        render(<ExperienceInsights data={{ total_expense: 999999, by_category: [], monthly_trends: [trend('September 2026', 3000, 12000), trend('August 2026', 1000, 6000)] }} />);

        expect(screen.getByText('₹2,000/month')).toBeTruthy();   // expense: (3000 + 1000) / 2
        expect(screen.getByText('₹9,000/month')).toBeTruthy();   // income: (12000 + 6000) / 2
        expect(screen.getByText('₹7,000/month')).toBeTruthy();   // balance: (9000 + 5000) / 2
        expect(screen.queryByText(/2024/)).toBeNull();
    });

    it('shows "—" for income and balance when income is unavailable, instead of inventing it', () => {
        render(<ExperienceInsights data={{ total_expense: 3000, by_category: [], monthly_trends: [trend('September 2026', 3000, null)] }} />);

        expect(screen.getByText('₹3,000/month')).toBeTruthy();
        expect(screen.getAllByText('—')).toHaveLength(2);
        expect(screen.queryByText('₹4,500/month')).toBeNull(); // the old expenses × 1.5
    });
});
