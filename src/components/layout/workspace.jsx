"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuth } from "@/features/auth/auth-provider";
import { RequireAuth } from "@/features/auth/require-auth";
import styles from "./workspace.module.css";

const managementLinks = [
  ["/gestao", "Visão geral"], ["/gestao/quartos", "Quartos"], ["/gestao/caracteristicas", "Características"],
  ["/gestao/reservas", "Reservas"], ["/gestao/tipos", "Tipos de quarto"], ["/gestao/usuarios", "Usuários"], ["/gestao/clientes", "Perfis de clientes"],
];

export function Workspace({ area, children }) {
  const pathname = usePathname();
  const session = useAuth();
  const links = area === "management" ? managementLinks : [
    ["/conta", "Minha conta"],
    ...(session.data?.role === "CLIENT" ? [["/conta/perfil", "Meu perfil"], ["/minhas-reservas", "Minhas reservas"]] : [["/gestao", "Área da recepção"]]),
  ];
  return <div className="container"><RequireAuth role={area === "management" ? "RECEPTIONIST" : area === "reservations" ? "CLIENT" : undefined}>
    <div className={styles.workspace}>
      <aside className={styles.sidebar}><p className="eyebrow">{area === "management" ? "RECEPÇÃO" : "SEU ESPAÇO"}</p>
        <p className={styles.name}>{session.data?.name}</p>
        <nav aria-label={area === "management" ? "Navegação da gestão" : "Navegação da conta"}>{links.map(([href, label]) =>
          <Link key={href} href={href} aria-current={pathname === href ? "page" : undefined}>{label}</Link>)}</nav>
      </aside>
      <div className={styles.content}>{children}</div>
    </div>
  </RequireAuth></div>;
}
