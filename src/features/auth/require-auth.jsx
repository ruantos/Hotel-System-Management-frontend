"use client";

import { usePathname } from "next/navigation";
import { ShieldCheck, KeyRound } from "lucide-react";
import { useAuth } from "@/features/auth/auth-provider";
import { accountHome } from "@/features/auth/navigation";
import { QueryState } from "@/components/ui/feedback";
import { EmptyState } from "@/components/ui/empty-state";
import { ButtonLink } from "@/components/ui/button";

export function RequireAuth({ children, role }) {
  const session = useAuth();
  const pathname = usePathname();
  return <QueryState pending={session.isPending} error={session.error} onRetry={() => { void session.refetch(); }}>
    {!session.data ? <EmptyState icon={<KeyRound size={30} />} title="Entre para continuar."
      action={<ButtonLink href={"/entrar?retorno=" + encodeURIComponent(pathname)}>Acessar minha conta</ButtonLink>}>
      <p>Confirme sua conta para acessar esta área.</p>
    </EmptyState> : role && session.data.role !== role ? <EmptyState icon={<ShieldCheck size={30} />} title="Esta área exige outro perfil."
      action={<ButtonLink href={accountHome(session.data.role)}>Ir para minha área</ButtonLink>}><p>Sua conta não tem permissão para esta página.</p></EmptyState>
      : <section key={session.data.id}>{children}</section>}
  </QueryState>;
}
