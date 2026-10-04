import { useSyncExternalStore } from 'react';

/**
 * Tiny shared state between the POS "bill no." panel (POSBillReprint) and the rest of the POS (settlement panel,
 * Finalize button). While a saved bill is being edited, the POS cart holds the items to ADD to that bill and
 * Finalize saves the edit instead of making a new bill.
 */
export interface PosBillEditState {
    active: boolean;
    invoiceNo: string;
    /** Bill number opened from the "bill no." search (even before Edit is pressed); '' when none. */
    selectedBill: string;
    hasChanges: boolean;
    /** New total of the bill from the server preview, null until there is one. */
    newTotal: number | null;
    previousTotal: number | null;
    canSave: boolean;
    saving: boolean;
}

const initial: PosBillEditState = { active: false, invoiceNo: '', selectedBill: '', hasChanges: false, newTotal: null, previousTotal: null, canSave: false, saving: false };
let state: PosBillEditState = initial;
const listeners = new Set<() => void>();

export const posBillEdit = {
    get: (): PosBillEditState => state,
    set(patch: Partial<PosBillEditState>) {
        const next = { ...state, ...patch };
        if ((Object.keys(next) as (keyof PosBillEditState)[]).every(k => next[k] === state[k])) return;
        state = next;
        listeners.forEach(l => l());
    },
    reset() { posBillEdit.set(initial); },
};

export const POS_BILL_EDIT_SAVE_EVENT = 'pos-bill-edit-save';

const subscribe = (l: () => void) => { listeners.add(l); return () => { listeners.delete(l); }; };
export const usePosBillEdit = (): PosBillEditState => useSyncExternalStore(subscribe, posBillEdit.get, posBillEdit.get);
