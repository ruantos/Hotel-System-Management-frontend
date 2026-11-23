"use client";

import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api/client";
import { fieldErrors } from "@/lib/api/problem";
import { useAmenities } from "@/features/rooms/queries";
import { Button, ButtonLink } from "@/components/ui/button";
import { ApiFeedback, InputField, QueryState } from "@/components/ui/feedback";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";

export function AmenitiesPage() {
  const items = useAmenities();
  const client = useQueryClient();
  const [selected, setSelected] = useState(null);
  const remove = useMutation({ mutationFn: (id) => api.request("amenities/" + id, { method: "DELETE" }),
    meta: { private: true }, onSuccess: async () => {
      setSelected(null);
      await Promise.all([client.invalidateQueries({ queryKey: ["amenities"] }), client.invalidateQueries({ queryKey: ["rooms"] })]);
    } });
  return <><div className="workspace-heading"><span className="eyebrow">ACOMODAÇÕES</span><h1>Características</h1><p>Organize os detalhes que fazem parte de cada quarto.</p></div>
    <ButtonLink href="/gestao/caracteristicas/novo">Nova característica</ButtonLink>
    <QueryState pending={items.isPending} error={items.error} onRetry={() => { void items.refetch(); }}>
      <div className="table-scroll"><table><caption>Características cadastradas</caption><thead><tr><th scope="col">Nome</th><th scope="col">Descrição</th><th scope="col">Ações</th></tr></thead>
        <tbody>{items.data?.map((item) => <tr key={item.id}><td>{item.name}</td><td>{item.description || "—"}</td><td><div className="actions"><Link href={"/gestao/caracteristicas/" + item.id}>Ver/editar</Link><button className="text-button" onClick={() => { remove.reset(); setSelected(item); }}>Excluir {item.name}</button></div></td></tr>)}</tbody>
      </table>{!items.data?.length && <p className="empty-note">Nenhuma característica cadastrada.</p>}</div>
    </QueryState>
    <ConfirmDialog open={!!selected} title="Excluir característica?" description={"Confirme a exclusão de " + selected?.name + ". Características vinculadas a quartos não podem ser excluídas."}
      pending={remove.isPending} error={remove.error} onCancel={() => setSelected(null)} onConfirm={() => selected && remove.mutate(selected.id)} />
  </>;
}

export function AmenityForm({ id }) {
  const router = useRouter();
  const client = useQueryClient();
  const item = useQuery({ queryKey: ["amenities", id], enabled: !!id,
    queryFn: ({ signal }) => api.request("amenities/" + id, { signal }) });
  const save = useMutation({ mutationFn: (body) => api.request("amenities" + (id ? "/" + id : ""), { method: id ? "PUT" : "POST", body }), meta: { private: true },
    onSuccess: async () => { await Promise.all([client.invalidateQueries({ queryKey: ["amenities"] }), client.invalidateQueries({ queryKey: ["rooms"] })]); router.push("/gestao/caracteristicas"); } });
  const fields = fieldErrors(save.error);
  function submit(event) {
    event.preventDefault(); const values = new FormData(event.currentTarget);
    save.mutate({ name: String(values.get("name")).trim(), description: String(values.get("description") || "") || null });
  }
  return <><div className="workspace-heading"><h1>{id ? "Detalhe e edição da característica" : "Nova característica"}</h1></div>
    <QueryState pending={!!id && item.isPending} error={item.data ? null : item.error} onRetry={() => { void item.refetch(); }}>
      <form className="panel data-panel form-grid" onSubmit={submit}>
        <InputField label="Nome" name="name" defaultValue={item.data?.name} maxLength={255} required error={fields.name} />
        <InputField label="Descrição (opcional)" name="description" defaultValue={item.data?.description ?? ""} maxLength={255} error={fields.description} />
        <ApiFeedback error={save.error} /><div className="actions"><Button type="submit" disabled={save.isPending}>{save.isPending ? "Salvando…" : "Salvar característica"}</Button><ButtonLink variant="secondary" href="/gestao/caracteristicas">Voltar</ButtonLink></div>
      </form>
    </QueryState>
  </>;
}
