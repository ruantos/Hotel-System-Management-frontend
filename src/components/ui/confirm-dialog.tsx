"use client";

import { useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { ApiFeedback } from "@/components/ui/feedback";
import styles from "./confirm-dialog.module.css";

export function ConfirmDialog({ open, title, description, pending, error, onConfirm, onCancel }:
  { open: boolean; title: string; description: string; pending: boolean; error: unknown; onConfirm: () => void; onCancel: () => void }) {
  const dialog = useRef<HTMLDialogElement>(null);
  const cancel = useRef<HTMLButtonElement>(null);
  useEffect(() => {
    if (open && !dialog.current?.open) { dialog.current?.showModal(); cancel.current?.focus(); }
    if (!open && dialog.current?.open) dialog.current.close();
  }, [open]);
  return <dialog ref={dialog} className={styles.dialog} aria-labelledby="confirm-title" aria-describedby="confirm-description"
    onCancel={(event) => { event.preventDefault(); if (!pending) onCancel(); }}>
    <h2 id="confirm-title">{title}</h2><p id="confirm-description">{description}</p>
    <ApiFeedback error={error} />
    <div className="actions"><button className={styles.cancel} ref={cancel} disabled={pending} onClick={onCancel}>Voltar</button>
      <Button disabled={pending} onClick={onConfirm}>{pending ? "Aguarde…" : "Confirmar"}</Button></div>
  </dialog>;
}
