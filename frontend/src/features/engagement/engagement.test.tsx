import React from 'react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { cleanup, render, screen, waitFor } from '@testing-library/react';

const get = vi.fn();
vi.mock('@/services/api', () => ({ default: { get: (...a: unknown[]) => get(...a) } }));

import LoyaltyReportPage from './LoyaltyReportPage';
import WhatsAppCampaignsPage from './WhatsAppCampaignsPage';
import MarketingMetricsPage from './MarketingMetricsPage';
import type { LoyaltyData, MarketingMetricsData, WhatsAppCampaignsData } from './engagementTypes';

afterEach(() => { cleanup(); get.mockReset(); });

const loyalty: LoyaltyData = {
    range: { from: '2026-09-01', to: '2026-09-30' },
    summary: {
        members: 3, activeMembers: 1, whatsappOptIn: 1, outstandingPoints: 7000, outstandingValue: 700,
        period: { issued: 600, redeemed: 100, expired: 50, adjustedDown: 0, redeemedValue: 10, redemptionRatePct: 16.7, earners: 2, redeemers: 1 },
        sales: { memberSales: 45000, totalSales: 300000, memberSharePct: 15 },
        tiers: [{ tier: 'Platinum', minPoints: 5000, members: 1, points: 6200 }, { tier: 'Gold', minPoints: 2000, members: 0, points: 0 }, { tier: 'Silver', minPoints: 500, members: 1, points: 800 }, { tier: 'Bronze', minPoints: 0, members: 1, points: 0 }],
        topMembers: [{ id: 'a', name: 'Lakshmi Stores', phone: '94430', points: 6200, tier: 'Platinum', value: 620, lastPurchase: '2026-09-20', totalSpend: 182000 }],
        rules: { spendPerPoint: 100, rupeesPer100Points: 10, rupeesPerPoint: 0.1 },
    },
    activity: [{ id: 'l1', date: '2026-09-12', customer: 'Lakshmi Stores', type: 'REDEEM', points: -100, balanceAfter: 6200, description: 'Redeemed 100 points for ₹10 discount' }],
    activityTotal: 1,
    asOf: '2026-09-25',
};

describe('LoyaltyReportPage', () => {
    it('shows members, tiers and the value of unredeemed points from the API', async () => {
        get.mockResolvedValue({ data: loyalty });
        render(<LoyaltyReportPage />);
        await waitFor(() => expect(screen.getAllByText('Lakshmi Stores').length).toBeGreaterThan(0));
        expect(get.mock.calls[0][0]).toBe('/api/reports/engagement/loyalty');
        expect(screen.getByText('Worth ₹700 in discounts')).toBeTruthy();
        expect(screen.getByText(/16.7% of issued/)).toBeTruthy();
        expect(screen.queryByText(/Aditi Sharma|11,334/)).toBeNull();
    });

    it('says nobody has earned points instead of showing zeros as a dashboard', async () => {
        get.mockResolvedValue({ data: { ...loyalty, summary: { ...loyalty.summary, members: 0 }, activity: [] } });
        render(<LoyaltyReportPage />);
        await waitFor(() => expect(screen.getByText(/No customer has earned loyalty points yet/)).toBeTruthy());
    });
});

describe('WhatsAppCampaignsPage', () => {
    const wa: WhatsAppCampaignsData = {
        range: { from: '2026-07-01', to: '2026-09-25' },
        campaigns: [{ id: 'w1', name: 'Diwali preview', status: 'scheduled', created: '2026-09-20', scheduled: '2026-10-15', groups: ['LOYAL'], message: 'New silk sarees are in!', sent: 0, delivered: 0, read: 0, failed: 0 }],
        counts: { total: 1, scheduled: 1, completed: 0, failed: 0 },
        audience: { whatsappOptIn: 212 },
        connection: { connected: false, accounts: [] },
        deliveryTracked: false,
        asOf: '2026-09-25',
    };
    it('lists saved campaigns and says delivery is not tracked, with no delivery columns', async () => {
        get.mockResolvedValue({ data: wa });
        render(<WhatsAppCampaignsPage />);
        await waitFor(() => expect(screen.getByText('Diwali preview')).toBeTruthy());
        expect(screen.getByText(/Messages aren't sent from the ERP yet and no WhatsApp Business account is connected/)).toBeTruthy();
        expect(screen.queryByText('Delivered')).toBeNull();
        expect(screen.getByText('212')).toBeTruthy();
    });
});

describe('MarketingMetricsPage', () => {
    const mk: MarketingMetricsData = {
        range: { from: '2026-09-01', to: '2026-09-30' },
        spend: { total: 8500, count: 2, entries: [{ id: 'e1', expenseNo: 'EXP-40', date: '2026-09-03', amount: 6000, description: 'Pamphlets', paymentMethod: 'cash' }] },
        campaigns: 1, newCustomers: 34,
        optIn: { any: 260, whatsapp: 212, sms: 40, email: 8 },
        segments: [{ segment: 'REGULAR', customers: 120 }],
        erpSales: { value: 94400, bills: 72 },
        connections: { whatsapp: false },
        attribution: false,
        asOf: '2026-09-25',
    };
    it('shows real spend and never an ROI figure', async () => {
        get.mockResolvedValue({ data: mk });
        render(<MarketingMetricsPage />);
        await waitFor(() => expect(screen.getByText('Pamphlets')).toBeTruthy());
        expect(screen.getAllByText('₹8,500').length).toBeGreaterThan(0);
        expect(screen.getByText('₹250')).toBeTruthy(); // spend per new customer
        expect(screen.queryByText(/ROI|Mumbai|4\.8x/)).toBeNull();
    });
});
