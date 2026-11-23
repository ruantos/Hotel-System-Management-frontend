"use client";

import { createContext, useContext, useEffect, useRef } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api/client";
import { ApiError } from "@/lib/api/problem";
import { queryKeys } from "@/lib/api/query-keys";
import { clearPrivateCache } from "@/lib/api/session-cache";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const client = useQueryClient();
  const previousId = useRef(undefined);
  const session = useQuery({
    queryKey: queryKeys.currentUser,
    queryFn: async ({ signal }) => {
      try { return await api.request("auth/me", { signal }); }
      catch (error) {
        if (error instanceof ApiError && error.status === 401) { await clearPrivateCache(client); return null; }
        throw error;
      }
    },
    staleTime: 0,
    retry: false,
    refetchOnWindowFocus: true,
  });
  useEffect(() => {
    if (!session.isSuccess) return;
    const nextId = session.data?.id ?? null;
    if (previousId.current != null && previousId.current !== nextId) void clearPrivateCache(client, previousId.current);
    previousId.current = nextId;
  }, [session.data, session.isSuccess, client]);
  return <AuthContext.Provider value={session}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error("AuthProvider não encontrado.");
  return context;
}
