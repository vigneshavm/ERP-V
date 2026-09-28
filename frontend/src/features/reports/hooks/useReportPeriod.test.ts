import { describe, it, expect } from 'vitest';
import { parseIsoDate, periodLabel, periodRange } from './useReportPeriod';

// Wednesday 23 Sep 2026, local time.
const WED = new Date(2026, 8, 23, 21, 40);

describe('periodRange', () => {
    it('today / yesterday', () => {
        expect(periodRange('today', WED)).toEqual({ from: '2026-09-23', to: '2026-09-23' });
        expect(periodRange('yesterday', WED)).toEqual({ from: '2026-09-22', to: '2026-09-22' });
        expect(periodRange('yesterday', new Date(2026, 0, 1))).toEqual({ from: '2025-12-31', to: '2025-12-31' });
    });

    it('this week starts Monday (and Sunday belongs to the week before it)', () => {
        expect(periodRange('this-week', WED)).toEqual({ from: '2026-09-21', to: '2026-09-23' });
        expect(periodRange('this-week', new Date(2026, 8, 27))).toEqual({ from: '2026-09-21', to: '2026-09-27' });
        expect(periodRange('this-week', new Date(2026, 8, 21))).toEqual({ from: '2026-09-21', to: '2026-09-21' });
    });

    it('months', () => {
        expect(periodRange('this-month', WED)).toEqual({ from: '2026-09-01', to: '2026-09-23' });
        expect(periodRange('last-month', WED)).toEqual({ from: '2026-08-01', to: '2026-08-31' });
        expect(periodRange('last-month', new Date(2026, 0, 15))).toEqual({ from: '2025-12-01', to: '2025-12-31' });
        expect(periodRange('last-month', new Date(2024, 2, 31))).toEqual({ from: '2024-02-01', to: '2024-02-29' });
        expect(periodRange('last-3-months', WED)).toEqual({ from: '2026-07-01', to: '2026-09-23' });
        expect(periodRange('last-3-months', new Date(2026, 1, 10))).toEqual({ from: '2025-12-01', to: '2026-02-10' });
    });

    it('Indian financial year runs 1 April to 31 March', () => {
        expect(periodRange('this-fy', WED)).toEqual({ from: '2026-04-01', to: '2026-09-23' });
        expect(periodRange('last-fy', WED)).toEqual({ from: '2025-04-01', to: '2026-03-31' });
        // January–March belong to the FY that started the previous April.
        expect(periodRange('this-fy', new Date(2026, 1, 10))).toEqual({ from: '2025-04-01', to: '2026-02-10' });
        expect(periodRange('last-fy', new Date(2026, 2, 31))).toEqual({ from: '2024-04-01', to: '2025-03-31' });
        expect(periodRange('this-fy', new Date(2026, 3, 1))).toEqual({ from: '2026-04-01', to: '2026-04-01' });
    });
});

describe('period helpers', () => {
    it('parseIsoDate reads local calendar dates and rejects bad ones', () => {
        expect(parseIsoDate('2026-09-23')?.getDate()).toBe(23);
        expect(parseIsoDate('2026-02-30')).toBeNull();
        expect(parseIsoDate('23/09/2026')).toBeNull();
    });

    it('periodLabel', () => {
        // ICU versions differ on "Sep" vs "Sept".
        expect(periodLabel({ from: '2025-12-01', to: '2026-09-23' })).toMatch(/^1 Dec 2025 – 23 Sept? 2026$/);
        expect(periodLabel({ from: '2026-09-23', to: '2026-09-23' })).toMatch(/^23 Sept? 2026$/);
    });
});
