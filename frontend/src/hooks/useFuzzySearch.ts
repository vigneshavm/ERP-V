import { useMemo } from 'react';

export function useFuzzySearch<T>(
    items: T[],
    keys: (keyof T)[],
    query: string
): T[] {
    return useMemo(() => {
        if (!query) return items;

        const lowerQuery = query.toLowerCase().trim();

        return items.filter(item => {
            return keys.some(key => {
                const value = item[key];
                if (typeof value === 'string') {
                    // Simple substring match for "fuzzy" simulation
                    // A proper fuzzy search might use Levenshtein distance, but this is sufficient for basic pattern matching
                    return value.toLowerCase().includes(lowerQuery);
                }
                // Handle nested keys or numbers if necessary, but current keyof T assumes direct access
                if (typeof value === 'number') {
                    return value.toString().includes(lowerQuery);
                }
                return false;
            });
        });
    }, [items, keys, query]);
}
