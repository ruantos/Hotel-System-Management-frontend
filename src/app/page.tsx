import Image from "next/image";
import Link from "next/link";
import { BedDouble, Heart, Leaf, Sun } from "lucide-react";
import { ButtonLink } from "@/components/ui/button";
import { RoomSearchForm } from "@/features/rooms/components/room-search-form";
import styles from "./page.module.css";

export default function HomePage() {
  return (
    <>
      <section className={["container", styles.hero].join(" ")} aria-labelledby="hero-title">
        <div className={styles.heroCopy}>
          <span className="eyebrow">UMA PAUSA QUE FAZ BEM</span>
          <h1 id="hero-title">Seu tempo.<br />Seu ritmo.<br /><em>Sua maré.</em></h1>
          <p>Deixe a rotina lá fora. Aqui, a ideia é simples: mais conforto, menos pressa e espaço para viver bons momentos.</p>
          <ButtonLink href="/quartos">Encontre seu lugar</ButtonLink>
          <span className={styles.heroFootnote}><Sun size={18} strokeWidth={1.5} aria-hidden="true" /> Um convite para desacelerar.</span>
        </div>
        <div className={styles.heroImage}>
          <Image src="/images/hotel-pool.jpg" alt="Piscina azul cercada de palmeiras em um hotel, imagem ilustrativa"
            fill sizes="(max-width: 700px) 100vw, 57vw" preload className={styles.cover} />
          <div className={styles.imageCaption}><span>O MELHOR DESTINO</span><p>é se sentir bem.</p></div>
          <span className={styles.photoNote}>Imagem ilustrativa</span>
        </div>
      </section>

      <section className={["container", styles.searchSection].join(" ")} aria-label="Encontre sua próxima estadia">
        <div className={styles.searchPanel}><RoomSearchForm /></div>
        <p className={styles.searchHint}>Ainda sem uma data? <Link href="/quartos">Comece pelas acomodações.</Link></p>
      </section>

      <section className={["container", styles.essence].join(" ")} id="essencia" aria-labelledby="essence-title">
        <div className={styles.essenceImage}>
          <Image src="/images/hotel-room.jpg" alt="Quarto com cama ampla e luz natural, imagem ilustrativa"
            fill sizes="(max-width: 700px) 100vw, 43vw" className={styles.cover} />
          <span className={styles.roomTag}><BedDouble size={17} aria-hidden="true" /> Espaço para descansar</span>
        </div>
        <div className={styles.essenceCopy}>
          <span className="eyebrow">NOSSA ESSÊNCIA</span>
          <h2 id="essence-title">O conforto mora<br />nos detalhes.</h2>
          <p>Uma boa viagem começa com a sensação de estar no lugar certo. A maré nasce desse desejo: transformar uma estadia em uma pausa de verdade.</p>
          <div className={styles.detail}>
            <span><Leaf size={22} strokeWidth={1.4} aria-hidden="true" /></span>
            <div><h3>Leveza para os seus dias</h3><p>Um novo ritmo para aproveitar o que importa.</p></div>
          </div>
          <div className={styles.detail}>
            <span><Heart size={22} strokeWidth={1.4} aria-hidden="true" /></span>
            <div><h3>Seu jeito de ficar</h3><p>Planeje a próxima pausa no seu tempo.</p></div>
          </div>
          <Link href="/quartos" className={styles.textLink}>Explore as acomodações</Link>
        </div>
      </section>

      <section className={styles.invitation} aria-labelledby="invitation-title">
        <div className={["container", styles.invitationInner].join(" ")}>
          <div><span className="eyebrow">QUE TAL UMA NOVA PAUSA?</span><h2 id="invitation-title">O próximo capítulo<br />pode começar aqui.</h2></div>
          <ButtonLink href="/quartos" variant="light">Planejar minha estadia</ButtonLink>
        </div>
      </section>
    </>
  );
}
