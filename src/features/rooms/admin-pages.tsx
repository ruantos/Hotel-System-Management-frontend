"use client";

import Link from "next/link";
import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api/client";
import { fieldErrors } from "@/lib/api/problem";
import { formatCurrency } from "@/lib/format";
import { useRooms, useRoom, useAmenities, useRoomTypes } from "@/features/rooms/queries";
import { Button, ButtonLink } from "@/components/ui/button";
import { ApiFeedback, InputField, QueryState } from "@/components/ui/feedback";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import type { RoomRequest, RoomResponse } from "@/types/api";

export function RoomsAdminPage() {
  const rooms = useRooms();
  const client = useQueryClient();
  const [selected, setSelected] = useState<RoomResponse | null>(null);
  const remove = useMutation({ mutationFn: (id: number) => api.request<void>("rooms/" + id, { method: "DELETE" }), meta: { private: true },
    onSuccess: async () => { setSelected(null); await Promise.all([client.invalidateQueries({ queryKey: ["rooms"] }), client.invalidateQueries({ queryKey: ["availability"] })]); } });
  return <><div className="workspace-heading"><span className="eyebrow">ACOMODAÇÕES</span><h1>Quartos</h1><p>Gerencie acomodações ativas e inativas.</p></div>
    <ButtonLink href="/gestao/quartos/novo">Novo quarto</ButtonLink>
    <QueryState pending={rooms.isPending} error={rooms.error} onRetry={() => { void rooms.refetch(); }}>
      <div className="table-scroll"><table><caption>Quartos cadastrados</caption><thead><tr><th scope="col">Quarto</th><th scope="col">Tipo</th><th scope="col">Diária</th><th scope="col">Situação</th><th scope="col">Ações</th></tr></thead>
        <tbody>{rooms.data?.map((room) => <tr key={room.id}><td>{room.number} · {room.name || "Quarto"}</td><td>{room.type.name}</td><td>{formatCurrency(room.pricePerNight)}</td><td>{room.active ? "Ativo" : "Inativo"}</td>
          <td><div className="actions"><Link href={"/gestao/quartos/" + room.id}>Detalhes</Link><Link href={"/gestao/quartos/" + room.id + "/editar"}>Editar</Link><button className="text-button" onClick={() => { remove.reset(); setSelected(room); }}>Excluir quarto {room.number}</button></div></td></tr>)}</tbody>
      </table>{!rooms.data?.length && <p className="empty-note">Nenhum quarto cadastrado.</p>}</div>
    </QueryState>
    <ConfirmDialog open={!!selected} title="Excluir quarto?" description={"Confirme a exclusão do quarto " + selected?.number + ". Qualquer reserva vinculada impede a exclusão, inclusive cancelada."}
      pending={remove.isPending} error={remove.error} onCancel={() => setSelected(null)} onConfirm={() => selected && remove.mutate(selected.id)} />
  </>;
}

export function RoomForm({ id }: { id?: number }) {
  const room = useRoom(id);
  const amenities = useAmenities();
  const types = useRoomTypes();
  const router = useRouter();
  const client = useQueryClient();
  const save = useMutation({ mutationFn: (body: RoomRequest) => api.request<RoomResponse>("rooms" + (id ? "/" + id : ""), { method: id ? "PUT" : "POST", body }), meta: { private: true },
    onSuccess: async (result) => {
      await Promise.all([client.invalidateQueries({ queryKey: ["rooms"] }), client.invalidateQueries({ queryKey: ["availability"] })]);
      router.push("/gestao/quartos/" + result.id);
    } });
  const fields = fieldErrors(save.error);
  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); const form = new FormData(event.currentTarget);
    save.mutate({ name: String(form.get("name") || "") || null, number: Number(form.get("number")), typeId: Number(form.get("typeId")),
      description: String(form.get("description") || "") || null, capacity: Number(form.get("capacity")), pricePerNight: Number(form.get("pricePerNight")),
      active: form.get("active") === "on", amenityIds: form.getAll("amenityIds").map(Number) });
  }
  const loading = (!!id && room.isPending) || amenities.isPending || types.isPending;
  const error = (id && !room.data ? room.error : null) || (amenities.data ? null : amenities.error) || (types.data ? null : types.error);
  return <><div className="workspace-heading"><h1>{id ? "Editar quarto" : "Novo quarto"}</h1><p>Defina os detalhes da acomodação e as características que a acompanham.</p></div>
    <QueryState pending={loading} error={error} onRetry={() => { void Promise.all([...(id ? [room.refetch()] : []), amenities.refetch(), types.refetch()]); }}>
      <form className="panel data-panel form-grid" onSubmit={submit}>
        <InputField label="Nome (opcional)" name="name" maxLength={255} defaultValue={room.data?.name ?? ""} error={fields.name} />
        <InputField label="Número" name="number" type="number" min={1} step={1} required defaultValue={room.data?.number} error={fields.number} />
        <div className="form-field"><label htmlFor="room-type">Tipo de quarto</label><select id="room-type" name="typeId" required defaultValue={room.data?.type.id ?? ""} aria-invalid={!!fields.typeId} aria-describedby={fields.typeId ? "room-type-error" : undefined}>
          <option value="" disabled>Selecione um tipo</option>{types.data?.map((type) => <option key={type.id} value={type.id}>{type.name}</option>)}</select>{fields.typeId && <span className="field-error" id="room-type-error">{fields.typeId}</span>}</div>
        <InputField label="Descrição (opcional)" name="description" maxLength={255} defaultValue={room.data?.description ?? ""} error={fields.description} />
        <InputField label="Capacidade de hóspedes" name="capacity" type="number" min={1} step={1} required defaultValue={room.data?.capacity} error={fields.capacity} />
        <InputField label="Diária (R$)" name="pricePerNight" type="number" min={0} max={99999999.99} step="0.01" required defaultValue={room.data?.pricePerNight} error={fields.pricePerNight} />
        <label className="checkbox-label"><input type="checkbox" name="active" defaultChecked={room.data?.active ?? true} /> Quarto ativo para reservas</label>
        <fieldset className="checkbox-group"><legend>Características</legend>{amenities.data?.map((item) => <label key={item.id}><input name="amenityIds" type="checkbox" value={item.id} defaultChecked={room.data?.amenities.some((selected) => selected.id === item.id)} />{item.name}</label>)}
          {!amenities.data?.length && <p>Nenhuma característica cadastrada. Você pode criar uma na área de características.</p>}
          {fields.amenityIds && <p className="field-error">{fields.amenityIds}</p>}
        </fieldset>
        <ApiFeedback error={save.error} /><div className="actions"><Button type="submit" disabled={save.isPending || !types.data?.length}>{save.isPending ? "Salvando…" : "Salvar quarto"}</Button><ButtonLink href="/gestao/quartos" variant="secondary">Voltar</ButtonLink></div>
      </form>
    </QueryState>
  </>;
}
