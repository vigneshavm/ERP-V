import { useEffect, useState } from 'react';
import api from '../../services/api';

/** GRN grid attributes that get autocomplete (names match /api/product-attributes/:attribute). */
export const GRN_ATTRIBUTES = ['size', 'brand', 'pattern', 'color', 'design', 'rack'] as const;
export type GrnAttribute = (typeof GRN_ATTRIBUTES)[number];
export type AttributeSuggestions = Record<GrnAttribute, string[]>;

const EMPTY: AttributeSuggestions = { size: [], brand: [], pattern: [], color: [], design: [], rack: [] };
const LIMIT = 100;

interface Suggestion {
    value: string;
}

const fetchValues = async (attribute: GrnAttribute, supplier?: string): Promise<string[]> => {
    const res = await api.get(`/api/product-attributes/${attribute}`, {
        params: { limit: LIMIT, ...(supplier ? { supplier } : {}) },
    });
    return ((res.data?.data ?? []) as Suggestion[]).map((s) => String(s.value ?? '').trim()).filter(Boolean);
};

/** Supplier's own values first (what they usually send), then everything else; each value once. */
export const mergeSuggestions = (supplierValues: string[], allValues: string[]): string[] => {
    const seen = new Set<string>();
    const out: string[] = [];
    for (const v of [...supplierValues, ...allValues]) {
        const key = v.toUpperCase();
        if (seen.has(key)) continue;
        seen.add(key);
        out.push(v.toUpperCase());
    }
    return out;
};

/**
 * Suggestions for the GRN grid's size / brand / pattern / colour / design / rack cells, from Textilesoft's
 * masters + purchase history (most used first). Keeps spellings consistent ("NAVY BLUE", not "NAVYBLUE").
 * `supplier` should only be passed once it is a known supplier -- not on every keystroke.
 * Failures are silent: the cells stay plain text boxes.
 */
export function useAttributeSuggestions(supplier: string): AttributeSuggestions {
    const [all, setAll] = useState<AttributeSuggestions>(EMPTY);
    const [bySupplier, setBySupplier] = useState<AttributeSuggestions>(EMPTY);

    useEffect(() => {
        let live = true;
        Promise.all(GRN_ATTRIBUTES.map((a) => fetchValues(a).catch(() => [] as string[]))).then((lists) => {
            if (live) setAll(Object.fromEntries(GRN_ATTRIBUTES.map((a, i) => [a, lists[i]])) as AttributeSuggestions);
        });
        return () => {
            live = false;
        };
    }, []);

    useEffect(() => {
        let live = true;
        if (!supplier) {
            setBySupplier(EMPTY);
            return;
        }
        Promise.all(GRN_ATTRIBUTES.map((a) => fetchValues(a, supplier).catch(() => [] as string[]))).then((lists) => {
            if (live) setBySupplier(Object.fromEntries(GRN_ATTRIBUTES.map((a, i) => [a, lists[i]])) as AttributeSuggestions);
        });
        return () => {
            live = false;
        };
    }, [supplier]);

    return Object.fromEntries(
        GRN_ATTRIBUTES.map((a) => [a, mergeSuggestions(bySupplier[a], all[a])]),
    ) as AttributeSuggestions;
}
