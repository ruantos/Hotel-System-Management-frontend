export function filterRooms(rooms, preferences) {
  return rooms.filter((room) => room.active && room.capacity >= preferences.guestCount
    && (!preferences.typeId || room.type.id === preferences.typeId)
    && preferences.amenityIds.every((id) => room.amenities.some((amenity) => amenity.id === id)));
}
