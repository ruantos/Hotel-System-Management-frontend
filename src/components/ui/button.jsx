import Link from "next/link";
import styles from "./button.module.css";

function classes(variant, className) {
  return [styles.button, styles[variant], className].filter(Boolean).join(" ");
}

export function Button({ variant = "primary", className, type = "button", ...props }) {
  return <button type={type} className={classes(variant, className)} {...props} />;
}

export function ButtonLink({ variant = "primary", className, ...props }) {
  return <Link className={classes(variant, className)} {...props} />;
}
