"use client";

import Image from "next/image";
import { useRoom } from "@/features/rooms/queries";
import { ReservationRequestForm } from "@/features/reservations/request-form";
import { QueryState } from "@/components/ui/feedback";
import { ButtonLink } from "@/components/ui/button";
import { formatCurrency } from "@/lib/format";
import styles from "./room-detail.module.css";

export function RoomDetail({ id, management = false }: { id: number; management?: boolean }) {
  const room = useRoom(id);
  return <QueryState pending={room.isPending} error={room.error} onRetry={() => { void room.refetch(); }}>
    {room.data && <><div className="page-intro"><span className="eyebrow">{room.data.type.name}</span><h1>{room.data.name || "Quarto " + room.data.number}</h1><p>Até {room.data.capacity} hóspedes · Quarto {room.data.number}</p></div>
      <div className={styles.layout}><div className="stack"><div className={styles.photo}><Image src="/images/hotel-room.jpg" alt="Imagem ilustrativa de acomodação" fill sizes="(max-width: 700px) 100vw, 60vw" preload /><span>Imagem ilustrativa</span></div>
        <div className="panel data-panel"><h2>Seu espaço para descansar</h2><p>{room.data.description || "Confira os detalhes desta acomodação e escolha o período da estadia."}</p>
          <dl className="data-list"><dt>Tipo</dt><dd>{room.data.type.name}</dd><dt>Capacidade</dt><dd>{room.data.capacity} hóspedes</dd><dt>Diária</dt><dd>{formatCurrency(room.data.pricePerNight)}</dd><dt>Situação</dt><dd>{room.data.active ? "Ativo" : "Inativo"}</dd></dl>
          <h3>Características</h3><ul className={styles.amenities}>{room.data.amenities.map((item) => <li key={item.id}>{item.name}</li>)}</ul>{!room.data.amenities.length && <p>Nenhuma característica informada.</p>}
        </div>
      </div><div>{management ? <div className="panel data-panel stack"><h2>Gerenciar quarto</h2><ButtonLink href={"/gestao/quartos/" + id + "/editar"}>Editar quarto</ButtonLink><ButtonLink href="/gestao/quartos" variant="secondary">Voltar à listagem</ButtonLink></div> : <ReservationRequestForm room={room.data} />}</div></div>
    </>}
  </QueryState>;
}
