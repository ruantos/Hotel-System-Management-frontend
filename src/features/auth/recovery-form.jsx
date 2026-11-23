"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api/client";
import { ApiError, fieldErrors } from "@/lib/api/problem";
import { expireSession } from "@/lib/api/session-cache";
import { recoveryMessage, validResetToken, passwordConfirmationError } from "@/features/auth/recovery-contract";
import { Button, ButtonLink } from "@/components/ui/button";
import { ApiFeedback, InputField, Notice } from "@/components/ui/feedback";
import styles from "./auth.module.css";

export function RecoveryForm({ reset = false }) {
  const params = useSearchParams();
  const router = useRouter();
  const client = useQueryClient();
  const [token, setToken] = useState(() => reset ? params.get("token") ?? "" : "");
  const [password, setPassword] = useState("");
  const [confirmation, setConfirmation] = useState("");
  const [validation, setValidation] = useState("");
  const [sent, setSent] = useState(false);
  const [wait, setWait] = useState(0);
  useEffect(() => {
    if (!reset) return;
    const url = new URL(window.location.href);
    if (url.searchParams.has("token")) {
      url.searchParams.delete("token");
      window.history.replaceState(window.history.state, "", url.pathname + url.search + url.hash);
    }
  }, [reset]);
  useEffect(() => {
    if (!wait) return;
    const timer = setTimeout(() => setWait((remaining) => Math.max(0, remaining - 1)), 1000);
    return () => clearTimeout(timer);
  }, [wait]);
  const onError = (error) => { if (error instanceof ApiError && error.retryAfter) setWait(error.retryAfter); };
  const request = useMutation({ mutationFn: (body) => api.request("auth/forgot-password", { method: "POST", body }), onError });
  const redefine = useMutation({ mutationFn: (body) => api.request("auth/reset-password", { method: "POST", body }), onError });
  const mutation = reset ? redefine : request;
  const fields = fieldErrors(mutation.error);
  async function submit(event) {
    event.preventDefault();
    if (mutation.isPending || wait) return;
    if (reset) {
      const message = passwordConfirmationError(password, confirmation);
      if (message || !validResetToken(token)) { setValidation(message || "Link inválido. Solicite um novo link de recuperação."); return; }
      setValidation("");
      try {
        await redefine.mutateAsync({ token, newPassword: password });
        setToken(""); setPassword(""); setConfirmation("");
        await expireSession(client);
        redefine.reset();
        router.replace("/entrar?aviso=senha-redefinida");
      } catch { /* Erro exibido sem registrar token ou senha. */ }
    } else {
      const values = new FormData(event.currentTarget);
      try {
        await request.mutateAsync({ email: String(values.get("email")).trim() });
        setSent(true); setWait(60); request.reset();
      } catch { /* 202 não é simulado em falha de rede ou configuração. */ }
    }
  }
  if (reset && !validResetToken(token)) return <div className={styles.card}><h1>Link inválido ou ausente.</h1><p>Abra o link recebido por e-mail. Se ele expirou ou já foi usado, solicite outro.</p><ButtonLink href="/esqueci-minha-senha">Solicitar novo link</ButtonLink></div>;
  return <div className={styles.card}>
    <span className="eyebrow">RECUPERAÇÃO DE ACESSO</span>
    <h1>{reset ? "Escolha uma nova senha." : "Vamos recuperar seu acesso."}</h1>
    <p>{reset ? "Depois de salvar, você precisará entrar novamente. O link só pode ser usado uma vez." : "Informe seu e-mail para solicitar instruções de recuperação."}</p>
    {sent && <Notice>{recoveryMessage} O recebimento depende do processamento e da entrega do e-mail.</Notice>}
    <form className={styles.form} onSubmit={submit} aria-label={reset ? "Redefinir senha" : "Solicitar recuperação"}>
      {reset ? <><InputField label="Nova senha" type="password" autoComplete="new-password" required minLength={8} maxLength={128} value={password} onChange={(event) => setPassword(event.target.value)} error={fields.newPassword} />
        <InputField label="Confirme a nova senha" type="password" autoComplete="new-password" required minLength={8} maxLength={128} value={confirmation} onChange={(event) => setConfirmation(event.target.value)} /></>
        : <InputField label="E-mail" type="email" name="email" autoComplete="email" maxLength={255} required error={fields.email} />}
      {validation && <p className="field-error" role="alert">{validation}</p>}
      <ApiFeedback error={mutation.error} />
      {fields.token && <p className="field-error" role="alert">{fields.token}</p>}
      {wait > 0 && <p role="status">Aguarde {wait} segundos antes de tentar novamente.</p>}
      <Button type="submit" disabled={mutation.isPending || wait > 0}>{mutation.isPending ? "Aguarde…" : reset ? "Salvar nova senha" : sent ? "Solicitar novamente" : "Solicitar link"}</Button>
    </form>
    <ButtonLink variant="secondary" href={reset ? "/esqueci-minha-senha" : "/entrar"}>{reset ? "Solicitar novo link" : "Voltar para entrar"}</ButtonLink>
  </div>;
}
