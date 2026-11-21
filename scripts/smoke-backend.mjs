// Verificação HTTP real, sem criação/edição/exclusão de dados de negócio.
// Executar com o frontend iniciado. Credenciais opcionais ficam só no ambiente.
import assert from "node:assert/strict";

const origin = process.env.FRONTEND_ORIGIN || "http://localhost:3000";
const base = origin + "/api/backend";
const cookies = new Map();

async function call(path, { method = "GET", body, csrf } = {}) {
  const headers = new Headers({ Accept: "application/json" });
  if (cookies.size) headers.set("Cookie", [...cookies].map(([name, value]) => name + "=" + value).join("; "));
  if (method !== "GET") headers.set("Origin", origin);
  if (csrf) headers.set(csrf.headerName, csrf.token);
  if (body) headers.set("Content-Type", "application/x-www-form-urlencoded");
  const response = await fetch(base + "/" + path, { method, headers, body, redirect: "manual", signal: AbortSignal.timeout(90_000) });
  for (const cookie of response.headers.getSetCookie()) {
    const pair = cookie.split(";", 1)[0];
    const split = pair.indexOf("=");
    const name = pair.slice(0, split);
    const value = pair.slice(split + 1);
    if (!value || /max-age=0/i.test(cookie)) cookies.delete(name); else cookies.set(name, value);
  }
  assert.match(response.headers.get("Cache-Control") || "", /no-store/);
  return response;
}

const failures = [];
async function verify(label, action) {
  try { await action(); console.log(label + ": aprovado"); }
  catch (error) { failures.push(label); console.error(label + ": falhou (" + error.message + ")"); }
}

for (const path of ["rooms", "room-types", "amenities"]) {
  await verify(path, async () => {
    const response = await call(path);
    assert.equal(response.status, 200, "HTTP esperado 200; recebido " + response.status);
    const items = await response.json();
    assert.ok(Array.isArray(items));
    console.log("  " + items.length + " registros");
  });
}

async function csrfToken() {
  const response = await call("auth/csrf");
  assert.equal(response.status, 200);
  const csrf = await response.json();
  assert.equal(csrf.headerName, "X-CSRF-TOKEN");
  assert.ok(csrf.token && cookies.has("JSESSIONID"));
  return csrf;
}

await verify("Sessão anônima, CSRF, cookies e logout", async () => {
  const csrf = await csrfToken();
  assert.equal((await call("auth/me")).status, 401);
  assert.equal((await call("auth/logout", { method: "POST", csrf })).status, 204);
  assert.equal((await call("auth/me")).status, 401);
});

for (const [profile, prefix] of [["CLIENT", "HOTEL_SMOKE_CLIENT"], ["RECEPTIONIST", "HOTEL_SMOKE_RECEPTIONIST"]]) {
  const email = process.env[prefix + "_EMAIL"];
  const password = process.env[prefix + "_PASSWORD"];
  if (!email || !password) {
    console.log(profile + ": pendente de credenciais de demonstração; nenhum dado de conta foi criado.");
    continue;
  }
  await verify("Identidade e permissões " + profile, async () => {
    try {
      const csrf = await csrfToken();
      const previousSession = cookies.get("JSESSIONID");
      const login = await call("auth/login", { method: "POST", csrf, body: new URLSearchParams({ email, password }) });
      assert.equal(login.status, 204, "login da conta de teste");
      assert.notEqual(cookies.get("JSESSIONID"), previousSession, "rotação da sessão no login");
      const account = await call("auth/me");
      assert.equal(account.status, 200);
      const user = await account.json();
      assert.equal(user.role, profile);
      assert.equal((await call("users/me")).status, 200);
      assert.equal((await call("reservations")).status, 200);
      assert.equal((await call("users")).status, profile === "CLIENT" ? 403 : 200);
    } finally {
      const fresh = await csrfToken();
      assert.equal((await call("auth/logout", { method: "POST", csrf: fresh })).status, 204);
      assert.equal((await call("auth/me")).status, 401);
    }
  });
}

if (failures.length) { console.error("Verificações pendentes/falhas: " + failures.join(", ")); process.exitCode = 1; }
