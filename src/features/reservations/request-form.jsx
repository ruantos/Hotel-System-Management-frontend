"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/features/auth/auth-provider";
import { useRoomSearch } from "@/providers/room-search-provider";
import { useAvailability } from "@/features/rooms/queries";
import { api } from "@/lib/api/client";
import { hotelToday } from "@/lib/format";
import { fieldErrors } from "@/lib/api/problem";
import { isCurrentSession, sessionVersion } from "@/lib/api/session-cache";
import { Button, ButtonLink } from "@/components/ui/button";
import { InputField, ApiFeedback, Notice } from "@/components/ui/feedback";

export function ReservationRequestForm({ room }) {
  const preferences = useRoomSearch((state) => state);
  const session = useAuth();
  const client = useQueryClient();
  const router = useRouter();
  const version = sessionVersion(client);
  const [checked, setChecked] = useState("");
  const [validation, setValidation] = useState("");
  const period = preferences.checkInDate + "/" + preferences.checkOutDate;
  const valid = preferences.checkInDate >= hotelToday() && preferences.checkOutDate > preferences.checkInDate;
  const availability = useAvailability(room.id, preferences.checkInDate, preferences.checkOutDate, checked === period && valid && room.active);
  const create = useMutation({ mutationFn: (body) => api.request("reservations", { method: "POST", body }), meta: { private: true },
    onSuccess: async (reservation) => {
      if (!isCurrentSession(client, session.data?.id, version)) return;
      await Promise.all([client.invalidateQueries({ queryKey: ["reservations", session.data?.id] }), client.invalidateQueries({ queryKey: ["availability", room.id] })]);
      router.push("/minhas-reservas/" + reservation.id);
    }, onError: () => { void client.invalidateQueries({ queryKey: ["availability", room.id] }); } });
  const fields = fieldErrors(create.error);
  function check(event) {
    event.preventDefault();
    if (!valid) { setValidation("Escolha uma entrada a partir de hoje e uma saída posterior."); return; }
    setValidation("");
    if (checked === period) void availability.refetch(); else setChecked(period);
  }
  return <div className="panel data-panel stack"><h2>Planeje sua estadia</h2>
    {!room.active ? <Notice>Esta acomodação não está recebendo novas reservas.</Notice> : <>
      <form className="form-grid" onSubmit={check}>
        <InputField label="Entrada" type="date" required min={hotelToday()} value={preferences.checkInDate} error={fields.checkInDate} onChange={(event) => preferences.setPreferences({ checkInDate: event.target.value })} />
        <InputField label="Saída" type="date" required min={preferences.checkInDate || hotelToday()} value={preferences.checkOutDate} error={fields.checkOutDate} onChange={(event) => preferences.setPreferences({ checkOutDate: event.target.value })} />
        <InputField label="Hóspedes" type="number" required min={1} max={room.capacity} step={1} value={preferences.guestCount} error={fields.guestCount} onChange={(event) => preferences.setPreferences({ guestCount: event.target.valueAsNumber || 1 })} />
        {validation && <p role="alert" className="field-error">{validation}</p>}
        <Button type="submit" variant="secondary" disabled={availability.isFetching}>{availability.isFetching ? "Consultando…" : "Consultar disponibilidade"}</Button>
      </form>
      <ApiFeedback error={availability.error} />
      {checked === period && availability.data && <Notice>{availability.data.available ? "Período disponível. A confirmação será feita ao solicitar." : "Este quarto já está ocupado no período. Escolha outras datas."}</Notice>}
      {session.data?.role === "CLIENT" ? <Button disabled={!room.active || !valid || checked !== period || !availability.data?.available || !availability.isSuccess || availability.isFetching || session.isFetching || !session.isSuccess || preferences.guestCount > room.capacity || create.isPending}
        onClick={() => create.mutate({ roomId: room.id, checkInDate: preferences.checkInDate, checkOutDate: preferences.checkOutDate, guestCount: preferences.guestCount })}>
        {create.isPending ? "Solicitando…" : "Solicitar reserva"}</Button>
        : session.data?.role === "RECEPTIONIST" ? <p>Solicitações são feitas pela conta de cliente.</p>
          : <ButtonLink href={"/entrar?retorno=" + encodeURIComponent("/quartos/" + room.id)}>Entrar para solicitar</ButtonLink>}
      <ApiFeedback error={create.error} />
      <p className="muted">A solicitação será enviada como Pendente e depende de aprovação da recepção.</p>
    </>}
  </div>;
}
