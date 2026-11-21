"use client";

import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api/client";
import { queryKeys } from "@/lib/api/query-keys";
import type { AmenityResponse, RoomAvailabilityResponse, RoomResponse, RoomTypeResponse } from "@/types/api";

export function useRooms() {
  return useQuery({ queryKey: queryKeys.rooms, queryFn: ({ signal }) => api.request<RoomResponse[]>("rooms", { signal }) });
}
export function useRoom(id?: number) {
  return useQuery({ queryKey: queryKeys.room(id ?? 0), enabled: !!id,
    queryFn: ({ signal }) => api.request<RoomResponse>("rooms/" + id, { signal }) });
}
export function useAmenities() {
  return useQuery({ queryKey: queryKeys.amenities, queryFn: ({ signal }) => api.request<AmenityResponse[]>("amenities", { signal }) });
}
export function useRoomTypes() {
  return useQuery({ queryKey: queryKeys.roomTypes, queryFn: ({ signal }) => api.request<RoomTypeResponse[]>("room-types", { signal }) });
}
export function useAvailability(roomId: number, checkInDate: string, checkOutDate: string, enabled: boolean) {
  const query = new URLSearchParams({ checkInDate, checkOutDate });
  return useQuery({ queryKey: queryKeys.availability(roomId, checkInDate, checkOutDate), enabled,
    queryFn: ({ signal }) => api.request<RoomAvailabilityResponse>("rooms/" + roomId + "/availability?" + query, { signal }), staleTime: 0 });
}
