"use client";

import { CalendarDays, Search, UsersRound } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";
import { Button } from "@/components/ui/button";
import { hotelToday } from "@/lib/format";
import { useRoomSearch } from "@/providers/room-search-provider";
import styles from "./room-search-form.module.css";

export function RoomSearchForm() {
  const router = useRouter();
  const checkInDate = useRoomSearch((state) => state.checkInDate);
  const checkOutDate = useRoomSearch((state) => state.checkOutDate);
  const guestCount = useRoomSearch((state) => state.guestCount);
  const setPreferences = useRoomSearch((state) => state.setPreferences);
  const [error, setError] = useState("");

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if ((checkInDate && checkInDate < hotelToday()) || (checkOutDate && !checkInDate)) {
      setError("Escolha uma entrada a partir de hoje para planejar a estadia.");
      return;
    }
    if (checkInDate && checkOutDate && checkOutDate <= checkInDate) {
      setError("A saída deve ser depois da entrada.");
      return;
    }
    setError("");
    router.push("/quartos");
  }

  return (
    <form className={styles.form} onSubmit={submit} aria-label="Planejar estadia">
      <div className={styles.fields}>
        <div className={styles.field}>
          <CalendarDays size={20} aria-hidden="true" />
          <div><label htmlFor="check-in">Entrada</label>
            <input id="check-in" type="date" min={hotelToday()} value={checkInDate}
              aria-describedby={error ? "search-error" : undefined}
              onChange={(event) => { setPreferences({ checkInDate: event.target.value }); setError(""); }} />
          </div>
        </div>
        <div className={styles.field}>
          <CalendarDays size={20} aria-hidden="true" />
          <div><label htmlFor="check-out">Saída</label>
            <input id="check-out" type="date" min={checkInDate || hotelToday()} value={checkOutDate}
              aria-describedby={error ? "search-error" : undefined}
              onChange={(event) => { setPreferences({ checkOutDate: event.target.value }); setError(""); }} />
          </div>
        </div>
        <div className={styles.field}>
          <UsersRound size={20} aria-hidden="true" />
          <div><label htmlFor="guests">Hóspedes</label>
            <input id="guests" type="number" min="1" step="1" required value={guestCount}
              onChange={(event) => setPreferences({ guestCount: event.target.valueAsNumber || 1 })} />
          </div>
        </div>
        <Button type="submit"><Search size={18} aria-hidden="true" /> Explorar quartos</Button>
      </div>
      {error && <p className={styles.error} id="search-error" role="alert">{error}</p>}
    </form>
  );
}
