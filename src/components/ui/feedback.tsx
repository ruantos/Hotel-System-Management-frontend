"use client";

import { useId, type InputHTMLAttributes, type ReactNode } from "react";
import { CloudOff, Compass } from "lucide-react";
import { ApiError, errorMessage } from "@/lib/api/problem";
import { Button, ButtonLink } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import styles from "./feedback.module.css";

export function ApiFeedback({ error }: { error: unknown }) {
  return error ? <p className={styles.error} role="alert">{errorMessage(error)}</p> : null;
}

export function Notice({ children }: { children: ReactNode }) {
  return <p className={styles.notice} role="status">{children}</p>;
}

export function InputField({ label, error, hint, id, ...props }:
  InputHTMLAttributes<HTMLInputElement> & { label: string; error?: string; hint?: string }) {
  const generated = useId();
  const fieldId = id ?? generated;
  return <div className="form-field">
    <label htmlFor={fieldId}>{label}</label>
    <input {...props} id={fieldId} aria-invalid={!!error} aria-describedby={error || hint ? fieldId + "-help" : undefined} />
    {(error || hint) && <span id={fieldId + "-help"} className={error ? styles.fieldError : styles.hint}>{error || hint}</span>}
  </div>;
}

export function QueryState({ pending, error, onRetry, children }:
  { pending: boolean; error: unknown; onRetry: () => void; children: ReactNode }) {
  if (pending) return <p className={styles.loading} role="status">Carregando informações…</p>;
  if (error instanceof ApiError && error.status === 404) return <EmptyState icon={<Compass size={28} />} title="Registro não encontrado."
    action={<ButtonLink href="/" variant="secondary">Voltar ao início</ButtonLink>}><p>{errorMessage(error)}</p></EmptyState>;
  if (error) return <EmptyState icon={<CloudOff size={28} />} title="Não foi possível carregar."
    action={<Button onClick={onRetry}>Tentar novamente</Button>}><p role="alert">{errorMessage(error)}</p></EmptyState>;
  return children;
}
