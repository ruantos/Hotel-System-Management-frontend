import type { ReactNode } from "react";
import styles from "./empty-state.module.css";

export function EmptyState({ icon, title, children, action }:
  { icon: ReactNode; title: string; children: ReactNode; action?: ReactNode }) {
  return (
    <div className={styles.state}>
      <span className={styles.icon} aria-hidden="true">{icon}</span>
      <h2>{title}</h2>
      <div className={styles.description}>{children}</div>
      {action}
    </div>
  );
}
