import { createStore } from "zustand/vanilla";

export type RoomSearchPreferences = {
  checkInDate: string;
  checkOutDate: string;
  guestCount: number;
  typeId: number | null;
  amenityIds: number[];
};

export type RoomSearchStore = RoomSearchPreferences & {
  setPreferences: (preferences: Partial<RoomSearchPreferences>) => void;
  reset: () => void;
};

const initialPreferences: RoomSearchPreferences = {
  checkInDate: "",
  checkOutDate: "",
  guestCount: 2,
  typeId: null,
  amenityIds: [],
};

// Uma instância por provider: nenhum estado é compartilhado no servidor.
export function createRoomSearchStore() {
  return createStore<RoomSearchStore>()((set) => ({
    ...initialPreferences,
    setPreferences: (preferences) => set(preferences),
    reset: () => set(initialPreferences),
  }));
}
