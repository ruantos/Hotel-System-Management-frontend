import test from "node:test";
import assert from "node:assert/strict";
import { createApiClient } from "../src/lib/api/client.js";

test("cada escrita recebe novo CSRF; 204 não é interpretado como JSON", async () => {
  const calls = [];
  const fetcher = async (url, init) => {
    calls.push({ url, init });
    return url.endsWith("/csrf") ? Response.json({ headerName: "X-CSRF-TOKEN", token: "token-" + calls.length }) : new Response(null, { status: 204 });
  };
  const api = createApiClient(fetcher);
  await api.request("auth/login", { method: "POST", body: new URLSearchParams({ email: "test@example.com", password: "test-only" }) });
  await api.request("auth/logout", { method: "POST" });
  assert.equal(calls.length, 4);
  assert.equal(calls[1].init.headers.get("X-CSRF-TOKEN"), "token-1");
  assert.equal(calls[3].init.headers.get("X-CSRF-TOKEN"), "token-3");
  assert.equal(calls[1].init.headers.get("content-type"), "application/x-www-form-urlencoded");
  assert.equal(calls[1].init.credentials, "include");
});

test("erros de campo usam o status HTTP; escrita com conexão interrompida não é repetida", async () => {
  const api = createApiClient(async () => Response.json({ status: 200, detail: "Campo inválido", errors: { name: "Obrigatório" } }, { status: 400 }));
  await assert.rejects(api.request("users/me"), (error) => error.status === 400 && error.fields.name === "Obrigatório");
  let writes = 0;
  const broken = createApiClient(async (url) => {
    if (url.endsWith("/csrf")) return Response.json({ headerName: "X-CSRF-TOKEN", token: "test" });
    writes++;
    throw new Error("network");
  });
  await assert.rejects(broken.request("rooms", { method: "POST", body: {} }), (error) => error.status === 0 && error.message.includes("Confira o resultado"));
  assert.equal(writes, 1);
});

test("HTML de infraestrutura não é exibido como erro e CSRF inválido impede escrita", async () => {
  const api = createApiClient(async () => new Response("<script>private</script>", { status: 502, headers: { "content-type": "text/html" } }));
  await assert.rejects(api.request("rooms"), (error) => error.status === 502 && !error.message.includes("script"));
  let calls = 0;
  const badCsrf = createApiClient(async () => { calls++; return Response.json({ headerName: "Authorization", token: "test" }); });
  await assert.rejects(badCsrf.request("auth/logout", { method: "POST" }));
  assert.equal(calls, 1);
});
