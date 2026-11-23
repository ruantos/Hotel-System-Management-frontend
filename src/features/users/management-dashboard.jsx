"use client";

import { ButtonLink } from "@/components/ui/button";
import { QueryState } from "@/components/ui/feedback";
import { useRooms } from "@/features/rooms/queries";
import { useReservations } from "@/features/reservations/queries";
import { useUsers } from "@/features/users/queries";
import styles from "./management-dashboard.module.css";

export function ManagementDashboard() {
  const rooms = useRooms();
  const reservations = useReservations();
  const users = useUsers();
  return <><div className="workspace-heading"><span className="eyebrow">ÁREA DA RECEPÇÃO</span><h1>Uma boa estadia começa aqui.</h1><p>Acompanhe acomodações e solicitações do hotel.</p></div>
    <QueryState pending={rooms.isPending || reservations.isPending || users.isPending} error={rooms.error || reservations.error || users.error}
      onRetry={() => { void Promise.all([rooms.refetch(), reservations.refetch(), users.refetch()]); }}>
      <div className={styles.grid}><div className="panel data-panel"><p>Quartos ativos</p><strong>{rooms.data?.filter((room) => room.active).length}</strong></div>
        <div className="panel data-panel"><p>Reservas pendentes</p><strong>{reservations.data?.filter((item) => item.status === "PENDING").length}</strong></div>
        <div className="panel data-panel"><p>Clientes cadastrados</p><strong>{users.data?.filter((user) => user.customerProfile).length}</strong></div></div>
      <div className="actions"><ButtonLink href="/gestao/reservas">Acompanhar reservas</ButtonLink><ButtonLink href="/gestao/quartos" variant="secondary">Gerenciar quartos</ButtonLink></div>
    </QueryState>
  </>;
}
