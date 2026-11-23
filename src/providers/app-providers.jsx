"use client";

import { MutationCache, QueryCache, QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useState } from "react";
import { RoomSearchProvider } from "@/providers/room-search-provider";
import { AuthProvider } from "@/features/auth/auth-provider";
import { ApiError } from "@/lib/api/problem";
import { expireSession, isCurrentSession, sessionVersion } from "@/lib/api/session-cache";

export function AppProviders({ children }) {
  const [queryClient] = useState(
    () => {
      const mutationOwners = new WeakMap();
      const onPrivateError = (error, meta) => {
        if (meta?.userId !== undefined && client.getQueryData(["auth", "me"])?.id !== meta.userId) return;
        if (meta?.private && error instanceof ApiError && error.status === 401) void expireSession(client);
      };
      const client = new QueryClient({
      queryCache: new QueryCache({ onError: (error, query) => onPrivateError(error, query.meta) }),
      mutationCache: new MutationCache({
        onMutate: (_variables, mutation) => {
          mutationOwners.set(mutation, { id: client.getQueryData(["auth", "me"])?.id, version: sessionVersion(client) });
        },
        onError: (error, _variables, _context, mutation) => {
          const owner = mutationOwners.get(mutation);
          if (owner && isCurrentSession(client, owner.id, owner.version)) onPrivateError(error, mutation.meta);
        },
      }),
      defaultOptions: {
        queries: { staleTime: 60_000, retry: false },
        mutations: { retry: false, gcTime: 0 },
      },
      });
      return client;
    },
  );

  return (
    <QueryClientProvider client={queryClient}>
      <RoomSearchProvider><AuthProvider>{children}</AuthProvider></RoomSearchProvider>
    </QueryClientProvider>
  );
}
