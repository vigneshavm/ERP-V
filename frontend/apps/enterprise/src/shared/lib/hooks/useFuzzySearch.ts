import { useMemo } from 'react';

/**
 * A simple fuzzy search hook for filtering lists.
 * @param items The items to filter
 * @param keys The keys to search in (e.g. ['name', 'sku'])
 * @param query The search query
 */
export function useFuzzySearch<T>(items: T[], keys: (keyof T)[], query: string): T[] {
    return useMemo(() => {
        if (!query) return items;
        const lowerQuery = query.toLowerCase().trim();

        return items.filter(item => {
            return keys.some(key => {
                const value = item[key];
                if (typeof value === 'string') {
                    return value.toLowerCase().includes(lowerQuery);
                }
                if (typeof value === 'number') {
                    return value.toString().includes(lowerQuery);
                }
                return false;
            });
        });
    }, [items, keys, query]);
}
