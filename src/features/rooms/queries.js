"use client";

import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api/client";
import { queryKeys } from "@/lib/api/query-keys";

export function useRooms() {
  return useQuery({ queryKey: queryKeys.rooms, queryFn: ({ signal }) => api.request("rooms", { signal }) });
}
export function useRoom(id) {
  return useQuery({ queryKey: queryKeys.room(id ?? 0), enabled: !!id,
    queryFn: ({ signal }) => api.request("rooms/" + id, { signal }) });
}
export function useAmenities() {
  return useQuery({ queryKey: queryKeys.amenities, queryFn: ({ signal }) => api.request("amenities", { signal }) });
}
export function useRoomTypes() {
  return useQuery({ queryKey: queryKeys.roomTypes, queryFn: ({ signal }) => api.request("room-types", { signal }) });
}
export function useAvailability(roomId, checkInDate, checkOutDate, enabled) {
  const query = new URLSearchParams({ checkInDate, checkOutDate });
  return useQuery({ queryKey: queryKeys.availability(roomId, checkInDate, checkOutDate), enabled,
    queryFn: ({ signal }) => api.request("rooms/" + roomId + "/availability?" + query, { signal }), staleTime: 0 });
}
