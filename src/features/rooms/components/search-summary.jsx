"use client";

import { CalendarDays, UsersRound } from "lucide-react";
import { useRoomSearch } from "@/providers/room-search-provider";
import { formatStayDate } from "@/lib/format";
import styles from "./search-summary.module.css";

export function SearchSummary() {
  const checkInDate = useRoomSearch((state) => state.checkInDate);
  const checkOutDate = useRoomSearch((state) => state.checkOutDate);
  const guestCount = useRoomSearch((state) => state.guestCount);
  const reset = useRoomSearch((state) => state.reset);

  return (
    <div className={styles.summary} aria-label="Preferências da estadia" aria-live="polite">
      <span><CalendarDays size={16} aria-hidden="true" /> {formatStayDate(checkInDate)} — {formatStayDate(checkOutDate)}</span>
      <span><UsersRound size={16} aria-hidden="true" /> {guestCount} {guestCount === 1 ? "hóspede" : "hóspedes"}</span>
      <button type="button" onClick={reset}>Limpar preferências</button>
    </div>
  );
}
