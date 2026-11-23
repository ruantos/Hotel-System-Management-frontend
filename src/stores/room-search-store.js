import { createStore } from "zustand/vanilla";

const initialPreferences = {
  checkInDate: "",
  checkOutDate: "",
  guestCount: 2,
  typeId: null,
  amenityIds: [],
};

// Uma instância por provider: nenhum estado é compartilhado no servidor.
export function createRoomSearchStore() {
  return createStore()((set) => ({
    ...initialPreferences,
    setPreferences: (preferences) => set(preferences),
    reset: () => set(initialPreferences),
  }));
}
