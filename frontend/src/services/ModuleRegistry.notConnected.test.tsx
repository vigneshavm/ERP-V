import React from 'react';
import { afterEach, describe, expect, it } from 'vitest';
import { cleanup, render } from '@testing-library/react';
import { Modules } from './ModuleRegistry';

afterEach(cleanup);

// These screens used to render hardcoded analytics (reach, open rates, coupon revenue, CSAT, ...)
// with no data behind them. They must stay "not connected" pages until a real source exists.
const NOT_CONNECTED = {
    GrowDashboard: 'Growth dashboard',
    OnlinePerformance: 'Online performance',
    SocialMediaMarketing: 'Social media',
    EmailMarketing: 'Email marketing',
    MarketingCoupons: 'Coupons',
    MarketingOffers: 'Offer performance',
    MarketingCampaigns: 'Marketing campaigns',
    Marketing: 'Marketing campaigns',
    FeedbackEngagement: 'Customer feedback',
} as const;

describe('ModuleRegistry not-connected screens', () => {
    it.each(Object.entries(NOT_CONNECTED))('%s opens a "not connected" page with no figures', async (key, title) => {
        const { default: Page } = await (Modules as Record<string, () => Promise<{ default: React.ComponentType & { displayName?: string } }>>)[key]();
        expect(Page.displayName).toBe(`NotConnected(${title})`);

        const { container } = render(<Page />);
        expect(container.textContent).not.toMatch(/₹|\d/);
    });
});
