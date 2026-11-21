// Contrato e casos negativos reais. Não altera senha nem depende de caixa de e-mail.
import { randomBytes } from "node:crypto";
import { mkdirSync, writeFileSync } from "node:fs";

const origin = process.env.FRONTEND_ORIGIN || "http://localhost:3000";
const cookies = new Map();
const results = [];
const email = "recovery-probe-" + randomBytes(8).toString("hex") + "@example.invalid";
async function call(path, options = {}) {
  const headers = new Headers({ Accept: "application/json" });
  if (cookies.size) headers.set("Cookie", [...cookies].map(([key, value]) => key + "=" + value).join("; "));
  if (options.body) { headers.set("Content-Type", "application/json"); headers.set("Origin", origin); }
  if (options.csrf) headers.set(options.csrf.headerName, options.csrf.token);
  const response = await fetch(origin + "/api/backend/" + path, {
    method: options.body ? "POST" : "GET", headers, body: options.body ? JSON.stringify(options.body) : undefined,
    redirect: "manual", signal: AbortSignal.timeout(90_000),
  });
  for (const cookie of response.headers.getSetCookie()) {
    const pair = cookie.split(";", 1)[0]; const split = pair.indexOf("=");
    if (/max-age=0/i.test(cookie)) cookies.delete(pair.slice(0, split)); else cookies.set(pair.slice(0, split), pair.slice(split + 1));
  }
  let data;
  try { data = await response.json(); } catch { data = {}; }
  return { response, data };
}
async function probe(label, path, body, expected, sendCsrf = true) {
  try {
    const csrf = await call("auth/csrf");
    if (csrf.response.status !== 200) throw new Error("CSRF indisponível: HTTP " + csrf.response.status);
    const { response, data } = await call(path, { body, csrf: sendCsrf ? csrf.data : undefined });
    const detail = typeof data.detail === "string" ? data.detail.replace(/[A-Za-z0-9_-]{43,}/g, "[redigido]").replace(/\S+@\S+/g, "[email redigido]") : undefined;
    results.push({ label, method: "POST", path: "/api/" + path, expected, actual: response.status, passed: response.status === expected,
      detail, retryAfter: response.headers.get("Retry-After"), fieldNames: Object.keys(data.errors || {}) });
    console.log(label + ": HTTP " + response.status + " (esperado " + expected + ")");
  } catch (error) {
    results.push({ label, path: "/api/" + path, passed: false, error: error.message });
    console.log(label + ": falha de conexão/preparação.");
  }
}
await probe("Escrita sem CSRF", "auth/forgot-password", { email }, 403, false);
await probe("E-mail malformado", "auth/forgot-password", { email: "invalid-email" }, 400);
await probe("Solicitação genérica para e-mail inexistente", "auth/forgot-password", { email }, 202);
await probe("Token malformado", "auth/reset-password", { token: "invalid", newPassword: randomBytes(18).toString("base64url") }, 400);
await probe("Token inexistente em formato válido", "auth/reset-password", { token: randomBytes(32).toString("base64url"), newPassword: randomBytes(18).toString("base64url") }, 400);
await probe("Senha curta", "auth/reset-password", { token: randomBytes(32).toString("base64url"), newPassword: "short" }, 400);
try {
  const csrf = await call("auth/csrf");
  await call("auth/logout", { body: {}, csrf: csrf.data });
} catch { /* somente sessão anônima de teste */ }
mkdirSync(".local", { recursive: true });
writeFileSync(".local/recovery-check.json", JSON.stringify({ checkedAt: new Date().toISOString(), backend: process.env.BACKEND_API_URL, results,
  positiveFlow: "Pendente de caixa de teste controlada/capturador SMTP remoto e token recebido por e-mail." }, null, 2) + "\n", { mode: 0o600 });
if (results.some((result) => !result.passed)) process.exitCode = 1;
