"use client";

import { createContext, useContext, useState, type ReactNode } from "react";
import { useStore } from "zustand";
import { createRoomSearchStore, type RoomSearchStore } from "@/stores/room-search-store";

const RoomSearchContext = createContext<ReturnType<typeof createRoomSearchStore> | null>(null);

export function RoomSearchProvider({ children }: { children: ReactNode }) {
  const [store] = useState(createRoomSearchStore);
  return <RoomSearchContext.Provider value={store}>{children}</RoomSearchContext.Provider>;
}

export function useRoomSearch<T>(selector: (state: RoomSearchStore) => T): T {
  const store = useContext(RoomSearchContext);
  if (!store) throw new Error("RoomSearchProvider não encontrado.");
  return useStore(store, selector);
}
