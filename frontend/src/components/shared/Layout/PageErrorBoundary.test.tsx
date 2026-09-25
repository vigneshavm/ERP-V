import React from 'react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import PageErrorBoundary from './PageErrorBoundary';

afterEach(cleanup);

let shouldThrow = true;
const Page = () => {
    if (shouldThrow) throw new Error('bad data');
    return <p>Page content</p>;
};

describe('PageErrorBoundary', () => {
    it('contains a page crash, and recovers on retry or when the route changes', () => {
        vi.spyOn(console, 'error').mockImplementation(() => {});
        shouldThrow = true;
        const { rerender } = render(<div><nav>Sidebar</nav><PageErrorBoundary resetKey="/a"><Page /></PageErrorBoundary></div>);

        expect(screen.getByRole('alert').textContent).toMatch(/couldn't be displayed/);
        expect(screen.getByText('Sidebar')).toBeTruthy(); // the rest of the app stays up

        shouldThrow = false;
        fireEvent.click(screen.getByRole('button', { name: 'Try again' }));
        expect(screen.getByText('Page content')).toBeTruthy();

        shouldThrow = true;
        rerender(<div><nav>Sidebar</nav><PageErrorBoundary resetKey="/a"><Page /></PageErrorBoundary></div>);
        expect(screen.getByRole('alert')).toBeTruthy();
        shouldThrow = false;
        rerender(<div><nav>Sidebar</nav><PageErrorBoundary resetKey="/b"><Page /></PageErrorBoundary></div>);
        expect(screen.getByText('Page content')).toBeTruthy();
        vi.restoreAllMocks();
    });
});
