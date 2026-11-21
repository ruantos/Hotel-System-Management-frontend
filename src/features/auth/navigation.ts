import type { UserRole } from "../../types/api.ts";

export function accountHome(role: UserRole) {
  return role === "RECEPTIONIST" ? "/gestao" : "/minhas-reservas";
}

export function safeReturnPath(value: string | null, fallback: string) {
  if (!value?.startsWith("/") || value.startsWith("//") || /[\\\u0000-\u001f]/.test(value)) return fallback;
  try {
    const target = new URL(value, "https://hotel.invalid");
    if (target.origin !== "https://hotel.invalid" || ["/entrar", "/cadastro"].includes(target.pathname)) return fallback;
    return target.pathname + target.search + target.hash;
  } catch { return fallback; }
}
