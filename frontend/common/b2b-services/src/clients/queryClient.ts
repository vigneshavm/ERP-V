import { QueryCache, QueryClient } from '@tanstack/react-query';

export const createB2BQueryClient = () =>
  new QueryClient({
    queryCache: new QueryCache({
      onError: (error) => {
        // eslint-disable-next-line no-console
        console.error('[B2B] Query error', error);
      },
    }),
    defaultOptions: {
      queries: {
        staleTime: 60 * 1000,
        retry: 1,
        refetchOnWindowFocus: false,
      },
      mutations: {
        retry: 0,
      },
    },
  });
