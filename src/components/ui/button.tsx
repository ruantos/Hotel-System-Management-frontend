import Link from "next/link";
import type { ButtonHTMLAttributes, ComponentProps } from "react";
import styles from "./button.module.css";

type Variant = "primary" | "secondary" | "light";

function classes(variant: Variant, className?: string) {
  return [styles.button, styles[variant], className].filter(Boolean).join(" ");
}

export function Button({ variant = "primary", className, type = "button", ...props }:
  ButtonHTMLAttributes<HTMLButtonElement> & { variant?: Variant }) {
  return <button type={type} className={classes(variant, className)} {...props} />;
}

export function ButtonLink({ variant = "primary", className, ...props }:
  ComponentProps<typeof Link> & { variant?: Variant }) {
  return <Link className={classes(variant, className)} {...props} />;
}
