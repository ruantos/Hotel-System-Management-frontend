"use client";

import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/features/auth/auth-provider";
import { api } from "@/lib/api/client";
import { queryKeys } from "@/lib/api/query-keys";
import type { UserResponse } from "@/types/api";

export function useUsers() {
  const user = useAuth().data;
  return useQuery({ queryKey: queryKeys.users(user?.id ?? 0), enabled: user?.role === "RECEPTIONIST",
    queryFn: ({ signal }) => api.request<UserResponse[]>("users", { signal }), meta: { private: true, userId: user?.id } });
}
