"use client";

import { createContext, useContext, useState } from "react";
import { useStore } from "zustand";
import { createRoomSearchStore } from "@/stores/room-search-store";

const RoomSearchContext = createContext(null);

export function RoomSearchProvider({ children }) {
  const [store] = useState(createRoomSearchStore);
  return <RoomSearchContext.Provider value={store}>{children}</RoomSearchContext.Provider>;
}

export function useRoomSearch(selector) {
  const store = useContext(RoomSearchContext);
  if (!store) throw new Error("RoomSearchProvider não encontrado.");
  return useStore(store, selector);
}
