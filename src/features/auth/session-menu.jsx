"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/features/auth/auth-provider";
import { useAuthActions } from "@/features/auth/use-auth-actions";
import { accountHome } from "@/features/auth/navigation";
import { ApiFeedback } from "@/components/ui/feedback";
import styles from "./session-menu.module.css";

export function SessionMenu({ onNavigate }) {
  const session = useAuth();
  const { logout } = useAuthActions();
  const router = useRouter();
  if (!session.data) return <Link href="/entrar" onClick={onNavigate}>{session.isPending ? "Confirmando sessão…" : "Minha conta"}</Link>;
  return <div className={styles.menu}>
    <Link href={accountHome(session.data.role)} onClick={onNavigate}>{session.data.role === "RECEPTIONIST" ? "Área da recepção" : "Minhas reservas"}</Link>
    <Link href="/conta" onClick={onNavigate}>Minha conta</Link>
    <button type="button" disabled={logout.isPending} onClick={() => logout.mutate(undefined, {
      onSuccess: () => { onNavigate(); router.replace("/"); },
    })}>{logout.isPending ? "Saindo…" : "Sair"}</button>
    <ApiFeedback error={logout.error} />
  </div>;
}
