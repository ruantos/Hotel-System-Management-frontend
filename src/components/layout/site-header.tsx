"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Menu, Waves, X } from "lucide-react";
import { SessionMenu } from "@/features/auth/session-menu";
import { useState } from "react";
import styles from "./site-header.module.css";

const navigation = [
  { href: "/", label: "Início" },
  { href: "/quartos", label: "Acomodações" },
  { href: "/#essencia", label: "Nossa essência" },
];

export function SiteHeader() {
  const pathname = usePathname();
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <header className={styles.header}>
      <div className={["container", styles.inner].join(" ")}>
        <Link href="/" className={styles.brand} aria-label="Maré Hotel — início" onClick={() => setMenuOpen(false)}>
          <Waves size={35} strokeWidth={1.4} aria-hidden="true" />
          <span>maré<span className={styles.hotel}>HOTEL</span></span>
        </Link>
        <button className={styles.toggle} aria-expanded={menuOpen} aria-controls="site-navigation"
          aria-label={menuOpen ? "Fechar menu" : "Abrir menu"} onClick={() => setMenuOpen(!menuOpen)}>
          {menuOpen ? <X aria-hidden="true" /> : <Menu aria-hidden="true" />}
        </button>
        <nav id="site-navigation" aria-label="Navegação principal"
          className={[styles.navigation, menuOpen && styles.open].filter(Boolean).join(" ")}>
          {navigation.map((item) => (
            <Link key={item.href} href={item.href} onClick={() => setMenuOpen(false)}
              aria-current={pathname === item.href ? "page" : undefined}>
              {item.label}
            </Link>
          ))}
          <SessionMenu onNavigate={() => setMenuOpen(false)} />
          <Link href="/quartos" className={styles.booking} onClick={() => setMenuOpen(false)}>Explorar quartos</Link>
        </nav>
      </div>
    </header>
  );
}
