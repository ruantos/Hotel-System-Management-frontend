"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";
import { Button, ButtonLink } from "@/components/ui/button";
import { InputField, ApiFeedback, Notice } from "@/components/ui/feedback";
import { fieldErrors } from "@/lib/api/problem";
import { useAuth } from "@/features/auth/auth-provider";
import { useAuthActions } from "@/features/auth/use-auth-actions";
import { safeReturnPath, accountHome } from "@/features/auth/navigation";
import styles from "./auth.module.css";

export function AuthForm({ mode }) {
  const router = useRouter();
  const params = useSearchParams();
  const session = useAuth();
  const { login, register } = useAuthActions();
  const [registered, setRegistered] = useState(false);
  const mutation = mode === "login" ? login : register;
  const fields = fieldErrors(mutation.error);

  async function submit(event) {
    event.preventDefault();
    const values = new FormData(event.currentTarget);
    const email = String(values.get("email")).trim();
    const password = String(values.get("password"));
    try {
      if (mode === "register") {
        await register.mutateAsync({ name: String(values.get("name")).trim(), email, password,
          phone: String(values.get("phone") || "") || null, document: String(values.get("document") || "") || null });
        setRegistered(true);
      } else {
        const user = await login.mutateAsync({ email, password });
        router.replace(safeReturnPath(params.get("retorno"), accountHome(user.role)));
      }
    } catch { /* erro disponível na mutation, sem descartar inputs */ }
  }

  if (registered) return <div className={styles.card}><h1>Boas-vindas à maré.</h1><Notice>Sua conta foi criada. Entre com seu e-mail e senha para continuar.</Notice><ButtonLink href="/entrar">Entrar na minha conta</ButtonLink></div>;
  if (session.data) return <div className={styles.card}><h1>Você já está em casa.</h1><p>Conectado como {session.data.name}.</p><ButtonLink href={accountHome(session.data.role)}>Acessar minha área</ButtonLink></div>;
  return <div className={styles.card}>
    <span className="eyebrow">SEU ESPAÇO NA MARÉ</span>
    <h1>{mode === "login" ? "Que bom ter você aqui." : "Sua próxima pausa começa aqui."}</h1>
    <p>{mode === "login" ? "Entre para acompanhar suas reservas e cuidar da sua estadia." : "Crie sua conta de cliente para planejar a próxima viagem."}</p>
    {params.get("aviso") === "conta-atualizada" && <Notice>Alteração salva. Por segurança, entre novamente com seus dados atuais.</Notice>}
    {params.get("aviso") === "senha-redefinida" && <Notice>Senha redefinida. Entre com sua nova senha.</Notice>}
    <form onSubmit={submit} className={styles.form} aria-label={mode === "login" ? "Entrar" : "Cadastrar cliente"}>
      {mode === "register" && <InputField label="Nome completo" name="name" autoComplete="name" maxLength={255} required error={fields.name} />}
      <InputField label="E-mail" name="email" type="email" autoComplete="email" maxLength={255} required error={fields.email} />
      <InputField label="Senha" name="password" type="password" autoComplete={mode === "login" ? "current-password" : "new-password"}
        minLength={mode === "register" ? 8 : undefined} maxLength={128} required error={fields.password}
        hint={mode === "register" ? "Entre 8 e 128 caracteres." : undefined} />
      {mode === "register" && <><InputField label="Telefone (opcional)" name="phone" type="tel" autoComplete="tel" maxLength={255} error={fields.phone} />
        <InputField label="Documento (opcional)" name="document" maxLength={255} error={fields.document} /></>}
      <ApiFeedback error={mutation.error} />
      <Button type="submit" disabled={mutation.isPending}>{mutation.isPending ? "Aguarde…" : mode === "login" ? "Entrar" : "Criar minha conta"}</Button>
    </form>
    {mode === "login" && <Link href="/esqueci-minha-senha">Esqueci minha senha</Link>}
    <p className={styles.switch}>{mode === "login" ? "Ainda não tem conta? " : "Já tem uma conta? "}<Link href={mode === "login" ? "/cadastro" : "/entrar"}>{mode === "login" ? "Cadastre-se" : "Entrar"}</Link></p>
  </div>;
}
