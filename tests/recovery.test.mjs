import test from "node:test";
import assert from "node:assert/strict";
import { allowedMethods } from "../src/lib/api/backend-routes.ts";
import { proxyBackend } from "../src/lib/api/server-proxy.ts";
import { createApiClient } from "../src/lib/api/client.ts";
import { retryAfterSeconds } from "../src/lib/api/problem.ts";
import { validResetToken, passwordConfirmationError } from "../src/features/auth/recovery-contract.ts";

test("recuperação aceita somente POST nas duas rotas documentadas", () => {
  assert.deepEqual(allowedMethods("auth/forgot-password"), ["POST"]);
  assert.deepEqual(allowedMethods("auth/reset-password"), ["POST"]);
});
test("proxy preserva 429 e Retry-After; cliente recebe tempo de espera", async () => {
  const request = new Request("https://site.test/api/backend/auth/forgot-password", { method: "POST", headers: { Origin: "https://site.test", "Content-Type": "application/json" }, body: JSON.stringify({ email: "test@example.invalid" }) });
  const response = await proxyBackend(request, ["auth", "forgot-password"], { backendUrl: "https://spring.test/api", frontendOrigin: "https://site.test",
    fetcher: async () => Response.json({ detail: "Aguarde para reenviar." }, { status: 429, headers: { "Retry-After": "60" } }) });
  assert.equal(response.status, 429); assert.equal(response.headers.get("Retry-After"), "60");
  const client = createApiClient(async () => response);
  await assert.rejects(client.request("auth/forgot-password"), (error) => error.status === 429 && error.retryAfter === 60);
  assert.equal(retryAfterSeconds("invalid"), undefined);
  assert.equal(retryAfterSeconds("Thu, 01 Jan 1970 00:01:00 GMT", 0), 60);
});
test("pedido exige CSRF e reset 204 não faz parser de JSON nem retentativa", async () => {
  const calls = [];
  const client = createApiClient(async (url, init) => {
    calls.push({ url, init });
    if (url.endsWith("/csrf")) return Response.json({ headerName: "X-CSRF-TOKEN", token: "csrf-test" });
    if (url.endsWith("/forgot-password")) return Response.json({ message: "Confirmação genérica" }, { status: 202 });
    return new Response(null, { status: 204 });
  });
  await client.request("auth/forgot-password", { method: "POST", body: { email: "test@example.invalid" } });
  assert.equal(await client.request("auth/reset-password", { method: "POST", body: { token: "A".repeat(43), newPassword: "test-only-password" } }), undefined);
  assert.equal(calls.length, 4);
  assert.equal(calls[3].init.headers.get("X-CSRF-TOKEN"), "csrf-test");
  assert.deepEqual(Object.keys(JSON.parse(calls[3].init.body)).sort(), ["newPassword", "token"]);
});
test("formato do link e confirmação de senha respeitam contrato, sem trim da senha", () => {
  assert.equal(validResetToken("A".repeat(43)), true);
  assert.equal(validResetToken("bad"), false);
  assert.equal(passwordConfirmationError(" password ", " password "), "");
  assert.notEqual(passwordConfirmationError("password", "different"), "");
  assert.notEqual(passwordConfirmationError("        ", "        "), "");
});
