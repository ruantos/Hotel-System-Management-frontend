"use client";

import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/features/auth/auth-provider";
import { api } from "@/lib/api/client";
import { queryKeys } from "@/lib/api/query-keys";

export function useReservations() {
  const user = useAuth().data;
  return useQuery({ queryKey: queryKeys.reservations(user?.id ?? 0), enabled: !!user,
    queryFn: ({ signal }) => api.request("reservations", { signal }), meta: { private: true, userId: user?.id } });
}
export function useReservation(id) {
  const user = useAuth().data;
  return useQuery({ queryKey: queryKeys.reservation(user?.id ?? 0, id), enabled: !!user,
    queryFn: ({ signal }) => api.request("reservations/" + id, { signal }), meta: { private: true, userId: user?.id } });
}
