"use client";

import Link from "next/link";
import Image from "next/image";
import { useRooms, useAmenities, useRoomTypes } from "@/features/rooms/queries";
import { filterRooms } from "@/features/rooms/filter-rooms";
import { RoomSearchForm } from "@/features/rooms/components/room-search-form";
import { SearchSummary } from "@/features/rooms/components/search-summary";
import { useRoomSearch } from "@/providers/room-search-provider";
import { formatCurrency } from "@/lib/format";
import { ApiFeedback, QueryState } from "@/components/ui/feedback";
import styles from "./catalog.module.css";

export function CatalogPage() {
  const rooms = useRooms();
  const types = useRoomTypes();
  const amenities = useAmenities();
  const preferences = useRoomSearch((state) => state);
  const visible = filterRooms(rooms.data ?? [], preferences);
  return <div className="container">
    <div className="page-intro"><span className="eyebrow">ENCONTRE SEU LUGAR</span><h1>Uma estadia no seu ritmo.</h1><p>Escolha o espaço para sua próxima pausa. A disponibilidade é consultada no detalhe de cada quarto.</p></div>
    <div className={["panel", styles.search].join(" ")}><RoomSearchForm /></div><SearchSummary />
    <div className={styles.layout}>
      <aside className={["panel", styles.filters].join(" ")} aria-label="Filtrar acomodações">
        <h2>Sua estadia, seu jeito</h2>
        <div className="form-field"><label htmlFor="filter-type">Tipo de acomodação</label><select id="filter-type" value={preferences.typeId ?? ""} onChange={(event) => preferences.setPreferences({ typeId: Number(event.target.value) || null })}>
          <option value="">Todos os tipos</option>{types.data?.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}</select></div>
        <fieldset className="checkbox-group"><legend>Características</legend>{amenities.data?.map((item) => <label key={item.id}><input type="checkbox" checked={preferences.amenityIds.includes(item.id)}
          onChange={(event) => preferences.setPreferences({ amenityIds: event.target.checked ? [...preferences.amenityIds, item.id] : preferences.amenityIds.filter((id) => id !== item.id) })} />{item.name}</label>)}</fieldset>
        <ApiFeedback error={types.error || amenities.error} />
        {(types.isError || amenities.isError) && <button className="text-button" onClick={() => { void types.refetch(); void amenities.refetch(); }}>Recarregar filtros</button>}
        <button className="text-button" onClick={() => preferences.setPreferences({ typeId: null, amenityIds: [] })}>Limpar filtros</button>
      </aside>
      <section aria-label="Catálogo de acomodações">
        <QueryState pending={rooms.isPending} error={rooms.error} onRetry={() => { void rooms.refetch(); }}>
          <p className={styles.count} aria-live="polite">{visible.length} {visible.length === 1 ? "acomodação encontrada" : "acomodações encontradas"}</p>
          <div className={styles.grid}>{visible.map((room) => <article className={["panel", styles.card].join(" ")} key={room.id}>
            <div className={styles.image}><Image src="/images/hotel-room.jpg" alt="Referência ilustrativa de acomodação" fill sizes="(max-width: 700px) 100vw, 35vw" /><span>Imagem ilustrativa</span></div>
            <div className={styles.cardBody}><p className="eyebrow">{room.type.name}</p><h2><Link href={"/quartos/" + room.id}>{room.name || "Quarto " + room.number}</Link></h2>
              <p>Até {room.capacity} {room.capacity === 1 ? "hóspede" : "hóspedes"}</p>
              <div className={styles.tags}>{room.amenities.map((item) => <span key={item.id}>{item.name}</span>)}</div>
              <div className={styles.cardFooter}><p><strong>{formatCurrency(room.pricePerNight)}</strong><span> / noite</span></p><Link href={"/quartos/" + room.id}>Ver acomodação</Link></div>
            </div>
          </article>)}</div>
          {!visible.length && <div className="panel data-panel"><h2>Nenhum quarto para estes filtros.</h2><p>Altere as preferências para encontrar outras opções.</p><button className="text-button" onClick={preferences.reset}>Limpar preferências</button></div>}
        </QueryState>
      </section>
    </div>
  </div>;
}
