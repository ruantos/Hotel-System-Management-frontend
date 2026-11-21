"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api/client";
import { queryKeys } from "@/lib/api/query-keys";
import { expireSession } from "@/lib/api/session-cache";
import type { RegisterCustomerRequest, UserResponse } from "@/types/api";

export function useAuthActions() {
  const client = useQueryClient();
  const login = useMutation({
    mutationFn: async (credentials: { email: string; password: string }) => {
      await client.cancelQueries({ queryKey: queryKeys.currentUser });
      await api.request<void>("auth/login", { method: "POST", body: new URLSearchParams(credentials) });
      await expireSession(client);
      const user = await api.request<UserResponse>("auth/me");
      client.setQueryData(queryKeys.currentUser, user);
      return user;
    },
  });
  const register = useMutation({ mutationFn: (body: RegisterCustomerRequest) => api.request<UserResponse>("auth/register", { method: "POST", body }) });
  const logout = useMutation({
    mutationFn: async () => {
      await api.request<void>("auth/logout", { method: "POST" });
      await expireSession(client);
    },
    meta: { private: true },
  });
  return { login, register, logout };
}
