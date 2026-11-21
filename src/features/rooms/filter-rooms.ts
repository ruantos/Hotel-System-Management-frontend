import type { RoomResponse } from "../../types/api.ts";

export function filterRooms(rooms: RoomResponse[], preferences: { guestCount: number; typeId: number | null; amenityIds: number[] }) {
  return rooms.filter((room) => room.active && room.capacity >= preferences.guestCount
    && (!preferences.typeId || room.type.id === preferences.typeId)
    && preferences.amenityIds.every((id) => room.amenities.some((amenity) => amenity.id === id)));
}
