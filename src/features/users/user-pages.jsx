"use client";

import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/features/auth/auth-provider";
import { useUsers } from "@/features/users/queries";
import { api } from "@/lib/api/client";
import { fieldErrors } from "@/lib/api/problem";
import { Button, ButtonLink } from "@/components/ui/button";
import { ApiFeedback, InputField, QueryState } from "@/components/ui/feedback";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";

export function UsersPage({ profilesOnly = false }) {
  const users = useUsers();
  const currentUser = useAuth().data;
  const client = useQueryClient();
  const [selected, setSelected] = useState(null);
  const remove = useMutation({ mutationFn: (id) => api.request("users/" + id, { method: "DELETE" }), meta: { private: true },
    onSuccess: async () => { setSelected(null); await client.invalidateQueries({ queryKey: ["users"] }); } });
  const visible = users.data?.filter((user) => !profilesOnly || user.customerProfile);
  return <><div className="workspace-heading"><span className="eyebrow">CONTAS</span><h1>{profilesOnly ? "Perfis de clientes" : "Usuários"}</h1>
    <p>{profilesOnly ? "Telefones e documentos dos perfis vinculados às contas." : "Consulte contas e cadastre colegas da recepção."}</p></div>
    {!profilesOnly && <ButtonLink href="/gestao/usuarios/novo">Cadastrar recepcionista</ButtonLink>}
    <QueryState pending={users.isPending} error={users.error} onRetry={() => { void users.refetch(); }}>
      <div className="table-scroll"><table><caption>{profilesOnly ? "Perfis de clientes" : "Contas cadastradas"}</caption><thead><tr><th scope="col">Nome</th><th scope="col">E-mail</th>
        {profilesOnly ? <><th scope="col">Telefone</th><th scope="col">Documento</th></> : <><th scope="col">Perfil</th><th scope="col">Situação</th><th scope="col">Ações</th></>}</tr></thead>
        <tbody>{visible?.map((user) => <tr key={user.id}><td><Link href={"/gestao/usuarios/" + user.id}>{user.name}</Link></td><td>{user.email}</td>
          {profilesOnly ? <><td>{user.customerProfile?.phone || "Não informado"}</td><td>{user.customerProfile?.document || "Não informado"}</td></>
            : <><td>{user.role === "CLIENT" ? "Cliente" : "Recepcionista"}</td><td>{user.active ? "Ativo" : "Inativo"}</td><td><button className="text-button" disabled={user.id === currentUser?.id} onClick={() => { remove.reset(); setSelected(user); }}>Excluir {user.name}</button></td></>}</tr>)}</tbody>
      </table>{!visible?.length && <p className="empty-note">Nenhum registro encontrado.</p>}</div>
    </QueryState>
    <ConfirmDialog open={!!selected} title="Excluir esta conta?" description={"Conta de " + selected?.name + ". A exclusão será recusada se houver reservas ou se a conta for protegida pelas regras da recepção."}
      pending={remove.isPending} error={remove.error} onCancel={() => setSelected(null)} onConfirm={() => selected && remove.mutate(selected.id)} />
  </>;
}

export function UserDetail({ id }) {
  const currentUser = useAuth().data;
  const user = useQuery({ queryKey: ["users", currentUser?.id, id], enabled: currentUser?.role === "RECEPTIONIST",
    queryFn: ({ signal }) => api.request("users/" + id, { signal }), meta: { private: true, userId: currentUser?.id } });
  return <><div className="workspace-heading"><h1>Detalhes da conta</h1></div>
    <QueryState pending={user.isPending} error={user.error} onRetry={() => { void user.refetch(); }}>
      {user.data && <div className="panel data-panel stack"><dl className="data-list"><dt>Nome</dt><dd>{user.data.name}</dd><dt>E-mail</dt><dd>{user.data.email}</dd><dt>Perfil</dt><dd>{user.data.role === "CLIENT" ? "Cliente" : "Recepcionista"}</dd><dt>Situação</dt><dd>{user.data.active ? "Ativo" : "Inativo"}</dd>
        {user.data.customerProfile && <><dt>Telefone</dt><dd>{user.data.customerProfile.phone || "Não informado"}</dd><dt>Documento</dt><dd>{user.data.customerProfile.document || "Não informado"}</dd></>}</dl>
        <ButtonLink href="/gestao/usuarios" variant="secondary">Voltar aos usuários</ButtonLink></div>}
    </QueryState>
  </>;
}

export function ReceptionistForm() {
  const client = useQueryClient();
  const router = useRouter();
  const create = useMutation({ mutationFn: (body) => api.request("users/receptionists", { method: "POST", body }), meta: { private: true },
    onSuccess: async () => { await client.invalidateQueries({ queryKey: ["users"] }); router.push("/gestao/usuarios"); } });
  const fields = fieldErrors(create.error);
  function submit(event) {
    event.preventDefault(); const form = new FormData(event.currentTarget);
    create.mutate({ name: String(form.get("name")).trim(), email: String(form.get("email")).trim(), password: String(form.get("password")) });
  }
  return <><div className="workspace-heading"><h1>Cadastrar recepcionista</h1><p>O novo colega terá acesso à área de gestão.</p></div>
    <form className="panel data-panel form-grid" onSubmit={submit}>
      <InputField label="Nome" name="name" required maxLength={255} autoComplete="name" error={fields.name} />
      <InputField label="E-mail" name="email" type="email" required maxLength={255} autoComplete="email" error={fields.email} />
      <InputField label="Senha inicial" name="password" type="password" required minLength={8} maxLength={128} autoComplete="new-password" error={fields.password} />
      <ApiFeedback error={create.error} /><Button type="submit" disabled={create.isPending}>{create.isPending ? "Cadastrando…" : "Cadastrar colega"}</Button>
    </form>
  </>;
}
