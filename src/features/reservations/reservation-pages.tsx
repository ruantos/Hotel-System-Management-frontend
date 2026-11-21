"use client";

import Link from "next/link";
import { useState, type FormEvent } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/features/auth/auth-provider";
import { useReservations, useReservation } from "@/features/reservations/queries";
import { mayApprove, mayReschedule, statusLabels } from "@/features/reservations/rules";
import { useRooms, useRoom } from "@/features/rooms/queries";
import { useUsers } from "@/features/users/queries";
import { formatStayDate, hotelToday } from "@/lib/format";
import { api } from "@/lib/api/client";
import { fieldErrors } from "@/lib/api/problem";
import { isCurrentSession, sessionVersion } from "@/lib/api/session-cache";
import { Button, ButtonLink } from "@/components/ui/button";
import { ApiFeedback, InputField, Notice, QueryState } from "@/components/ui/feedback";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import type { ReservationResponse, RescheduleReservationRequest } from "@/types/api";

export function ReservationList({ management = false }: { management?: boolean }) {
  const reservations = useReservations();
  const rooms = useRooms();
  const users = useUsers();
  const root = management ? "/gestao/reservas/" : "/minhas-reservas/";
  return <><div className="workspace-heading"><span className="eyebrow">ESTADIAS</span><h1>{management ? "Reservas" : "Minhas reservas"}</h1><p>{management ? "Acompanhe solicitações, aprovações e alterações de datas." : "Acompanhe suas próximas pausas e o histórico de estadias."}</p></div>
    {!management && <ButtonLink href="/quartos">Explorar acomodações</ButtonLink>}
    <QueryState pending={reservations.isPending} error={reservations.error} onRetry={() => { void reservations.refetch(); }}>
      <div className="table-scroll"><table><caption>{management ? "Todas as reservas" : "Reservas da sua conta"}</caption><thead><tr><th scope="col">Reserva</th><th scope="col">Quarto</th>{management && <th scope="col">Cliente</th>}<th scope="col">Período</th><th scope="col">Situação</th></tr></thead>
        <tbody>{reservations.data?.map((item) => <tr key={item.id}><td><Link href={root + item.id}>Reserva {item.id}</Link></td>
          <td>{rooms.data?.find((room) => room.id === item.roomId)?.name || "Quarto ID " + item.roomId}</td>
          {management && <td>{users.data?.find((user) => user.customerProfile?.id === item.customerProfileId)?.name || "Perfil " + item.customerProfileId}</td>}
          <td>{formatStayDate(item.checkInDate)} até {formatStayDate(item.checkOutDate)}</td><td><span className="status-label">{statusLabels[item.status]}</span></td></tr>)}</tbody>
      </table>{!reservations.data?.length && <p className="empty-note">Nenhuma reserva encontrada.</p>}</div>
    </QueryState>
  </>;
}

export function ReservationDetail({ id, management = false }: { id: number; management?: boolean }) {
  const user = useAuth().data;
  const reservation = useReservation(id);
  const room = useRoom(reservation.data?.roomId);
  const users = useUsers();
  const client = useQueryClient();
  const version = sessionVersion(client);
  const [confirmCancel, setConfirmCancel] = useState(false);
  const [saved, setSaved] = useState("");
  const [dateError, setDateError] = useState("");
  const action = useMutation({
    mutationFn: ({ name, dates }: { name: "dates" | "approve" | "cancel"; dates?: RescheduleReservationRequest }) =>
      api.request<ReservationResponse>("reservations/" + id + "/" + name, { method: "PUT", body: dates }),
    meta: { private: true },
    onSuccess: async (result, variables) => {
      if (!isCurrentSession(client, user?.id, version)) return;
      setConfirmCancel(false);
      setSaved(variables.name === "dates" ? "Datas salvas. Confira a situação atual da reserva." : variables.name === "approve" ? "Reserva aprovada." : "Reserva cancelada.");
      client.setQueryData(["reservation", user?.id, id], result);
      await Promise.all([client.invalidateQueries({ queryKey: ["reservations", user?.id] }),
        client.invalidateQueries({ queryKey: ["reservation", user?.id, id] }), client.invalidateQueries({ queryKey: ["availability", result.roomId] })]);
    },
  });
  const item = reservation.data;
  const fields = fieldErrors(action.error);
  const reschedulable = item && mayReschedule(item, hotelToday());
  const owned = user?.role === "CLIENT" && user.customerProfile?.id === item?.customerProfileId;
  function reschedule(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); const form = new FormData(event.currentTarget); setSaved("");
    const checkInDate = String(form.get("checkInDate"));
    const checkOutDate = String(form.get("checkOutDate"));
    if (checkInDate < hotelToday() || checkOutDate <= checkInDate) { setDateError("A entrada deve ser a partir de hoje e a saída deve ser posterior."); return; }
    setDateError("");
    action.mutate({ name: "dates", dates: { checkInDate, checkOutDate } });
  }
  return <><div className="workspace-heading"><span className="eyebrow">SUA ESTADIA</span><h1>Reserva {id}</h1></div>
    <QueryState pending={reservation.isPending} error={item ? null : reservation.error} onRetry={() => { void reservation.refetch(); }}>
      {item && <div className="stack"><div className="panel data-panel"><dl className="data-list">
        <dt>Situação</dt><dd><span className="status-label">{statusLabels[item.status]}</span></dd>
        <dt>Quarto</dt><dd><Link href={"/quartos/" + item.roomId}>{room.data?.name || "Quarto ID " + item.roomId}</Link></dd>
        {management && <><dt>Cliente</dt><dd>{users.data?.find((account) => account.customerProfile?.id === item.customerProfileId)?.name || "Perfil " + item.customerProfileId}</dd></>}
        <dt>Entrada</dt><dd>{formatStayDate(item.checkInDate)}</dd><dt>Saída</dt><dd>{formatStayDate(item.checkOutDate)}</dd><dt>Hóspedes</dt><dd>{item.guestCount}</dd>
      </dl></div>
      {saved && <Notice>{saved}</Notice>}
      <ApiFeedback error={action.error} />
      {management && mayApprove(item, hotelToday()) && <div className="panel data-panel stack">
        <h2>Aprovar solicitação</h2><p>A recepção confirma disponibilidade, capacidade e situação do quarto no momento da aprovação.</p>
        {room.data?.active === false && <Notice>O quarto está inativo. Ative-o antes de aprovar.</Notice>}
        <Button disabled={action.isPending || !room.data?.active} onClick={() => { setSaved(""); action.mutate({ name: "approve" }); }}>{action.isPending ? "Aguarde…" : "Aprovar reserva"}</Button>
      </div>}
      {reschedulable && (management || owned) && <form className="panel data-panel form-grid" onSubmit={reschedule}>
        <h2>Alterar datas</h2><p>A disponibilidade será confirmada ao salvar. Uma mudança efetiva volta a reserva para Pendente e exige nova aprovação.</p>
        <InputField label="Nova entrada" name="checkInDate" type="date" min={hotelToday()} required defaultValue={item.checkInDate} error={fields.checkInDate} />
        <InputField label="Nova saída" name="checkOutDate" type="date" min={hotelToday()} required defaultValue={item.checkOutDate} error={fields.checkOutDate} />
        {dateError && <p role="alert" className="field-error">{dateError}</p>}
        <Button type="submit" disabled={action.isPending}>{action.isPending ? "Salvando…" : "Salvar novas datas"}</Button>
      </form>}
      {owned && reschedulable && <Button variant="secondary" disabled={action.isPending} onClick={() => { action.reset(); setConfirmCancel(true); }}>Cancelar reserva</Button>}
      {!reschedulable && <p className="muted">Esta reserva não permite alterações de datas ou cancelamento neste momento.</p>}
      <ButtonLink href={management ? "/gestao/reservas" : "/minhas-reservas"} variant="secondary">Voltar às reservas</ButtonLink>
      </div>}
    </QueryState>
    <ConfirmDialog open={confirmCancel} title="Cancelar esta reserva?" description={"Confirme o cancelamento da reserva " + id + ". Ela ficará no seu histórico como Cancelada."}
      pending={action.isPending} error={action.error} onCancel={() => setConfirmCancel(false)} onConfirm={() => action.mutate({ name: "cancel" })} />
  </>;
}
