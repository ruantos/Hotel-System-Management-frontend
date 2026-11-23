import styles from "./loading.module.css";

export default function Loading() {
  return <div className={["container", styles.wrapper].join(" ")} role="status" aria-live="polite">
    <span className={styles.line} /><span className={styles.block} /><p>Preparando seu espaço…</p>
  </div>;
}
