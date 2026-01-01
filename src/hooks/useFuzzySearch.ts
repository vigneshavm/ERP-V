import { useMemo } from 'react';

// Levenshtein distance function
const levenshteinDistance = (a: string, b: string): number => {
    const matrix = [];

    // Increment along the first column of each row
    for (let i = 0; i <= b.length; i++) {
        matrix[i] = [i];
    }

    // Increment each column in the first row
    for (let j = 0; j <= a.length; j++) {
        matrix[0][j] = j;
    }

    // Fill in the rest of the matrix
    for (let i = 1; i <= b.length; i++) {
        for (let j = 1; j <= a.length; j++) {
            if (b.charAt(i - 1) === a.charAt(j - 1)) {
                matrix[i][j] = matrix[i - 1][j - 1];
            } else {
                matrix[i][j] = Math.min(
                    matrix[i - 1][j - 1] + 1, // substitution
                    Math.min(
                        matrix[i][j - 1] + 1, // insertion
                        matrix[i - 1][j] + 1  // deletion
                    )
                );
            }
        }
    }

    return matrix[b.length][a.length];
};

export const useFuzzySearch = <T>(
    items: T[],
    keys: (keyof T)[],
    query: string,
    threshold: number = 2
): T[] => {
    return useMemo(() => {
        if (!query || query.length < 2) return items;

        const lowerQuery = query.toLowerCase();

        return items
            .map(item => {
                let minDistance = Infinity;
                let matched = false;

                // Exact substring match check (Priority)
                for (const key of keys) {
                    const val = String(item[key]).toLowerCase();
                    if (val.includes(lowerQuery)) {
                        return { item, score: 0 }; // 0 is best score
                    }

                    // Only check distance if length is somewhat close to avoid heavy calcs
                    if (Math.abs(val.length - lowerQuery.length) <= threshold + 2) {
                        const dist = levenshteinDistance(lowerQuery, val);
                        if (dist < minDistance) minDistance = dist;
                    }
                }

                // If Levenshtein distance is within threshold
                if (minDistance <= threshold) {
                    return { item, score: minDistance };
                }

                return null;
            })
            .filter(result => result !== null)
            .sort((a, b) => a!.score - b!.score)
            .map(result => result!.item);
    }, [items, keys, query, threshold]);
};
