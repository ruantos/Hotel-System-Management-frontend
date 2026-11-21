export const queryKeys = {
  currentUser: ["auth", "me"] as const,
  rooms: ["rooms"] as const,
  room: (id: number) => ["rooms", id] as const,
  amenities: ["amenities"] as const,
  roomTypes: ["room-types"] as const,
  availability: (roomId: number, checkInDate: string, checkOutDate: string) =>
    ["availability", roomId, checkInDate, checkOutDate] as const,
  reservations: (userId: number) => ["reservations", userId] as const,
  reservation: (userId: number, id: number) => ["reservation", userId, id] as const,
  users: (userId: number) => ["users", userId] as const,
};
