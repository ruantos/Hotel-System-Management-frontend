export const queryKeys = {
  currentUser: ["auth", "me"],
  rooms: ["rooms"],
  room: (id) => ["rooms", id],
  amenities: ["amenities"],
  roomTypes: ["room-types"],
  availability: (roomId, checkInDate, checkOutDate) =>
    ["availability", roomId, checkInDate, checkOutDate],
  reservations: (userId) => ["reservations", userId],
  reservation: (userId, id) => ["reservation", userId, id],
  users: (userId) => ["users", userId],
};
