"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import type { FormEvent } from "react";
import { useAuth } from "@/features/auth/auth-provider";
import { api } from "@/lib/api/client";
import { expireSession, isCurrentSession, sessionVersion } from "@/lib/api/session-cache";
import { fieldErrors } from "@/lib/api/problem";
import { Button } from "@/components/ui/button";
import { ApiFeedback, InputField, QueryState } from "@/components/ui/feedback";
import type { ChangePasswordRequest, UpdateAccountRequest, UserResponse } from "@/types/api";

export function AccountPage({ profileOnly = false }: { profileOnly?: boolean }) {
  const user = useAuth().data;
  const client = useQueryClient();
  const router = useRouter();
  const version = sessionVersion(client);
  const account = useQuery({ queryKey: ["account", user?.id], queryFn: ({ signal }) => api.request<UserResponse>("users/me", { signal }),
    enabled: !!user, meta: { private: true, userId: user?.id } });
  const saved = async () => { if (!isCurrentSession(client, user?.id, version)) return; await expireSession(client); router.replace("/entrar?aviso=conta-atualizada"); };
  const update = useMutation({ mutationFn: (body: UpdateAccountRequest) => api.request<UserResponse>("users/me", { method: "PUT", body }), onSuccess: saved, meta: { private: true } });
  const password = useMutation({ mutationFn: (body: ChangePasswordRequest) => api.request<void>("users/me/password", { method: "PUT", body }), onSuccess: saved, meta: { private: true } });
  const fields = fieldErrors(update.error);
  const passwordFields = fieldErrors(password.error);

  async function submitAccount(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    update.mutate({ name: String(form.get("name")).trim(), email: String(form.get("email")).trim(),
      ...(user?.role === "CLIENT" ? { phone: String(form.get("phone") || "") || null, document: String(form.get("document") || "") || null } : {}) });
  }

  return <><div className="workspace-heading"><span className="eyebrow">SEUS DADOS</span><h1>{profileOnly ? "Meu perfil de cliente" : "Minha conta"}</h1>
    <p>{profileOnly ? "Informações vinculadas à sua conta de cliente." : "Ao salvar dados ou senha, você precisará entrar novamente."}</p></div>
    <QueryState pending={account.isPending} error={account.error} onRetry={() => { void account.refetch(); }}>
      {account.data && (profileOnly ? <div className="panel data-panel"><dl className="data-list"><dt>Nome</dt><dd>{account.data.name}</dd><dt>Telefone</dt><dd>{account.data.customerProfile?.phone || "Não informado"}</dd><dt>Documento</dt><dd>{account.data.customerProfile?.document || "Não informado"}</dd></dl></div>
        : <div className="stack"><form className="panel data-panel form-grid" onSubmit={submitAccount} key={account.data.id}>
          <InputField label="Nome" name="name" defaultValue={account.data.name} maxLength={255} required autoComplete="name" error={fields.name} />
          <InputField label="E-mail" name="email" type="email" defaultValue={account.data.email} maxLength={255} required autoComplete="email" error={fields.email} />
          {account.data.customerProfile && <><InputField label="Telefone" name="phone" type="tel" defaultValue={account.data.customerProfile.phone ?? ""} maxLength={255} error={fields.phone} />
            <InputField label="Documento" name="document" defaultValue={account.data.customerProfile.document ?? ""} maxLength={255} error={fields.document} /></>}
          <ApiFeedback error={update.error} /><Button type="submit" disabled={update.isPending || password.isPending}>{update.isPending ? "Salvando…" : "Salvar e entrar novamente"}</Button>
        </form>
        <form className="panel data-panel form-grid" onSubmit={(event) => {
          event.preventDefault(); const form = new FormData(event.currentTarget);
          password.mutate({ currentPassword: String(form.get("currentPassword")), newPassword: String(form.get("newPassword")) });
        }}>
          <h2>Alterar senha</h2>
          <InputField label="Senha atual" name="currentPassword" type="password" autoComplete="current-password" maxLength={128} required error={passwordFields.currentPassword} />
          <InputField label="Nova senha" name="newPassword" type="password" autoComplete="new-password" minLength={8} maxLength={128} required error={passwordFields.newPassword} />
          <ApiFeedback error={password.error} /><Button type="submit" disabled={password.isPending || update.isPending}>{password.isPending ? "Alterando…" : "Alterar senha e entrar novamente"}</Button>
        </form></div>)}
    </QueryState>
  </>;
}
