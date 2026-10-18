import { QueryClient } from '@tanstack/react-query';
import { toApiError } from '@/lib/api/errors';

export function createQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: 30_000,
        refetchOnWindowFocus: false,
        // Don't hammer the API on client errors (404 "no rank yet", 403, ...); retry flaky ones once.
        retry: (failureCount, error) => {
          const { status } = toApiError(error);
          return (status === null || status >= 500) && failureCount < 1;
        },
      },
    },
  });
}

export const queryClient = createQueryClient();
