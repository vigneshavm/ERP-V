import React from 'react';
import { afterEach, describe, expect, it } from 'vitest';
import { cleanup, render, screen } from '@testing-library/react';
import { notConnected } from './notConnected';

afterEach(cleanup);

describe('notConnected', () => {
    it('renders the title and pointer, and no figures', () => {
        const Page = notConnected({ title: 'Cash drawer', detail: 'Use the Day Book.' });
        const { container } = render(<Page />);
        expect(screen.getByRole('heading', { name: 'Cash drawer' })).toBeTruthy();
        expect(screen.getByText(/isn't connected to your shop's data yet/)).toBeTruthy();
        expect(screen.getByText('Use the Day Book.')).toBeTruthy();
        expect(container.textContent).not.toMatch(/₹|\d/);
        expect(Page.displayName).toBe('NotConnected(Cash drawer)');
    });

    it('omits the pointer when there is none', () => {
        const Page = notConnected({ title: 'Warehouses' });
        const { container } = render(<Page />);
        expect(container.querySelectorAll('p')).toHaveLength(1);
    });
});
