import { describe, it, expect } from 'vitest';
import reducer, { setDailyRecords, addDailyRecord } from './financeSlice';

describe('financeSlice setDailyRecords', () => {
    it('keeps locally saved, unsynced entries when the server list refreshes', () => {
        let state = reducer(undefined, addDailyRecord({ id: 'local-1', date: '2026-09-25', synced: false }));
        state = reducer(state, addDailyRecord({ id: 'old-synced', date: '2026-09-20', synced: true }));

        state = reducer(state, setDailyRecords([{ id: 'srv-1', date: '2026-09-24', synced: true }]));

        expect(state.dailyFinanceRecords.map(r => r.id)).toEqual(['local-1', 'srv-1']);
    });

    it('uses the server copy once an entry has synced', () => {
        let state = reducer(undefined, addDailyRecord({ id: 'rec-1', cashSales: 100, synced: false }));
        state = reducer(state, setDailyRecords([{ id: 'rec-1', cashSales: 100, synced: true }]));

        expect(state.dailyFinanceRecords).toEqual([{ id: 'rec-1', cashSales: 100, synced: true }]);
    });
});
