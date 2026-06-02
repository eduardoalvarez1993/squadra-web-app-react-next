'use client';

import { QueryCache, QueryClient, MutationCache } from '@tanstack/react-query';
import { toast } from 'sonner';

function makeQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: { staleTime: 30_000, retry: false },
    },
    queryCache: new QueryCache({
      onError: (error) => {
        if ((error as Error & { status?: number }).status === 401) {
          window.location.href = '/login';
        }
      },
    }),
    mutationCache: new MutationCache({
      onError: (error, _vars, _ctx, mutation) => {
        if ((error as Error & { status?: number }).status === 401) {
          window.location.href = '/login';
          return;
        }
        if ((mutation.meta as { silentError?: boolean } | undefined)?.silentError) return;
        toast.error('Algo deu errado. Tente novamente.');
      },
    }),
  });
}

let browserQueryClient: QueryClient | undefined;

export function getQueryClient() {
  if (typeof window === 'undefined') return makeQueryClient();
  if (!browserQueryClient) browserQueryClient = makeQueryClient();
  return browserQueryClient;
}
