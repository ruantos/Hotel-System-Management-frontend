import test from "node:test";
import assert from "node:assert/strict";
import { resolveFrontendOrigins } from "../src/lib/api/frontend-origins.ts";
import { proxyBackend } from "../src/lib/api/server-proxy.ts";

const production = "https://hotel-system-management-frontend.vercel.app";
const deployment = "https://hotel-build-team.vercel.app";
const branch = "https://hotel-git-main-team.vercel.app";
const vercel = {
  VERCEL: "1",
  VERCEL_PROJECT_PRODUCTION_URL: new URL(production).host,
  VERCEL_URL: new URL(deployment).host,
  VERCEL_BRANCH_URL: new URL(branch).host,
};

async function login(origin, env, extraHeaders = {}) {
  let forwarded = 0;
  const headers = new Headers({ "Content-Type": "application/x-www-form-urlencoded", ...extraHeaders });
  if (origin !== undefined) headers.set("Origin", origin);
  const response = await proxyBackend(new Request(production + "/api/backend/auth/login", {
    method: "POST", headers, body: "email=probe%40example.invalid&password=synthetic-only",
  }), ["auth", "login"], {
    backendUrl: "https://spring.test/api",
    frontendOrigins: resolveFrontendOrigins(env),
    fetcher: async () => { forwarded++; return new Response(null, { status: 204 }); },
  });
  return { status: response.status, forwarded };
}

test("configuração aceita espaços e barra final sem liberar caminhos ou URLs com credenciais", async () => {
  for (const value of [production, production + "/", " \n" + production + "/ \n"]) {
    assert.deepEqual(await login(production, { FRONTEND_ORIGIN: value }), { status: 204, forwarded: 1 });
  }
  for (const value of [undefined, "", "null", "*", "https://*.vercel.app", production + "/entrar",
    production + "?other=1", production + "#other", "https://user:password@hotel-system-management-frontend.vercel.app",
    "ftp://hotel-system-management-frontend.vercel.app", "FRONTEND_ORIGIN=" + production]) {
    assert.deepEqual(await login(production, { FRONTEND_ORIGIN: value }), { status: 403, forwarded: 0 });
  }
});

test("Vercel reconhece somente os domínios exatos do projeto mesmo sem configuração manual atualizada", async () => {
  for (const FRONTEND_ORIGIN of [undefined, "http://localhost:3000", "configuração inválida"]) {
    for (const origin of [production, deployment, branch]) {
      assert.deepEqual(await login(origin, { ...vercel, FRONTEND_ORIGIN }), { status: 204, forwarded: 1 });
    }
  }
  for (const VERCEL of [undefined, "0"]) {
    assert.deepEqual(await login(production, { ...vercel, VERCEL }), { status: 403, forwarded: 0 });
  }
});

test("origens externas, ausentes e cabeçalhos Host/Forwarded forjados não autorizam escritas", async () => {
  for (const origin of [undefined, "null", "https://attacker.example", "https://other.vercel.app",
    production + ".attacker.example", production + "/", production + "/entrar", "http://" + new URL(production).host]) {
    assert.deepEqual(await login(origin, vercel, {
      Host: new URL(origin && origin.startsWith("http") ? origin : production).host,
      "X-Forwarded-Host": "attacker.example",
      "X-Forwarded-Proto": "https",
      Forwarded: "host=attacker.example;proto=https",
    }), { status: 403, forwarded: 0 });
  }
  assert.deepEqual(await login("https://attacker.example", {
    ...vercel, VERCEL_URL: "attacker.example/forged-path", VERCEL_BRANCH_URL: "user:password@attacker.example",
  }), { status: 403, forwarded: 0 });
});
