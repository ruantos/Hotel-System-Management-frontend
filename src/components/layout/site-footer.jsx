import Link from "next/link";
import { Waves } from "lucide-react";
import styles from "./site-footer.module.css";

export function SiteFooter() {
  return (
    <footer className={styles.footer}>
      <div className={["container", styles.content].join(" ")}>
        <Link href="/" className={styles.brand}><Waves aria-hidden="true" /> maré hotel</Link>
        <p>Mais tempo para o que faz bem.</p>
        <nav aria-label="Navegação do rodapé">
          <Link href="/quartos">Acomodações</Link><Link href="/entrar">Minha conta</Link>
        </nav>
      </div>
      <div className={["container", styles.note].join(" ")}>
        <span>Projeto acadêmico · Marca e imagens ilustrativas.</span>
        <span>Reservas sujeitas à disponibilidade e aprovação da recepção.</span>
      </div>
    </footer>
  );
}
