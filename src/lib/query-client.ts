'use client';

import { QueryCache, QueryClient, MutationCache } from '@tanstack/react-query';
import { toast } from 'sonner';
import { is401, redirectToLogin } from './auth-redirect';

function makeQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: { staleTime: 30_000, retry: false },
    },
    queryCache: new QueryCache({
      onError: (error) => {
        // Sessão expirada em qualquer query → volta pro login preservando a rota.
        if (is401(error)) redirectToLogin();
      },
    }),
    mutationCache: new MutationCache({
      onError: (error, _vars, _ctx, mutation) => {
        if (is401(error)) {
          redirectToLogin();
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
