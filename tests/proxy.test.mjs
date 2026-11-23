import test from "node:test";
import assert from "node:assert/strict";
import { proxyBackend } from "../src/lib/api/server-proxy.js";

const origin = "https://hotel.test";
const config = { backendUrl: "https://spring.test/api", frontendOrigin: origin };
const request = (path, init = {}) => new Request(origin + "/api/backend/" + path, init);

test("proxy recusa caminhos, verbos e origens não autorizados antes de acessar o upstream", async () => {
  let called = 0;
  const fetcher = async () => { called++; return Response.json({}); };
  for (const [path, method, headers, status] of [
    ["customers", "GET", {}, 404], ["rooms/../users", "GET", {}, 404],
    ["reservations/1", "DELETE", { origin }, 405],
    ["auth/login", "POST", { origin: "https://attacker.test" }, 403],
    ["auth/login", "POST", {}, 403],
  ]) {
    const response = await proxyBackend(request(path, { method, headers }), path.split("/"), { ...config, fetcher });
    assert.equal(response.status, status);
    assert.equal(response.headers.get("cache-control"), "no-store");
  }
  assert.equal(called, 0);
});

test("cookies de usuários distintos não são compartilhados e a query é encaminhada", async () => {
  const cookies = [];
  const fetcher = async (url, init) => {
    cookies.push(init.headers.get("cookie"));
    assert.equal(new URL(url).searchParams.get("checkInDate"), "2027-01-10");
    assert.equal(init.cache, "no-store");
    assert.equal(init.redirect, "manual");
    return Response.json({ available: true });
  };
  const path = "rooms/1/availability";
  await Promise.all(["session-a", "session-b"].map((cookie) => proxyBackend(
    request(path + "?checkInDate=2027-01-10", { headers: { cookie: "JSESSIONID=" + cookie } }),
    path.split("/"), { ...config, fetcher },
  )));
  assert.deepEqual(cookies.sort(), ["JSESSIONID=session-a", "JSESSIONID=session-b"]);
});

test("login mantém formulário, CSRF, rotação e todos os Set-Cookie sem quebrar Expires", async () => {
  const headers = new Headers();
  headers.append("Set-Cookie", "JSESSIONID=new; Path=/; HttpOnly; Secure; SameSite=Lax");
  headers.append("Set-Cookie", "old=; Domain=spring.test; Path=/api; Expires=Thu, 01 Jan 1970 00:00:00 GMT; Max-Age=0; HttpOnly");
  const fetcher = async (url, init) => {
    assert.equal(String(url), "https://spring.test/api/auth/login");
    assert.equal(init.headers.get("x-csrf-token"), "csrf-current");
    assert.equal(init.headers.get("origin"), null);
    assert.equal(new TextDecoder().decode(init.body), "email=test%40example.com&password=test-only");
    return new Response(null, { status: 204, headers });
  };
  const response = await proxyBackend(request("auth/login", { method: "POST", headers: {
    origin, "content-type": "application/x-www-form-urlencoded", "x-csrf-token": "csrf-current",
  }, body: "email=test%40example.com&password=test-only" }), ["auth", "login"], { ...config, fetcher });
  assert.equal(response.status, 204);
  assert.equal(await response.text(), "");
  assert.equal(response.headers.getSetCookie().length, 2);
  assert.match(response.headers.getSetCookie()[0], /HttpOnly; Secure; SameSite=Lax/);
  assert.match(response.headers.getSetCookie()[1], /Path=\/api\/backend; Expires=Thu, 01 Jan 1970/);
  assert.doesNotMatch(response.headers.getSetCookie()[1], /Domain=/);
});

test("Location é mapeado para o BFF e Problem Details mantém o status real", async () => {
  const created = await proxyBackend(request("rooms", { method: "POST", headers: { origin } }), ["rooms"], {
    ...config, fetcher: async () => Response.json({ id: 3 }, { status: 201, headers: { Location: "https://spring.test/api/rooms/3" } }),
  });
  assert.equal(created.headers.get("Location"), "/api/backend/rooms/3");
  const failed = await proxyBackend(request("rooms/1"), ["rooms", "1"], {
    ...config, fetcher: async () => Response.json({ detail: "Conflito" }, { status: 409, headers: { "content-type": "application/problem+json" } }),
  });
  assert.equal(failed.status, 409);
  assert.equal((await failed.json()).detail, "Conflito");
});

test("configuração inválida não cria proxy aberto; falhas de rede retornam erro seguro", async () => {
  for (const backendUrl of [undefined, "file:///api", "https://user:password@spring.test/api", "https://spring.test/api?target=other"]) {
    const response = await proxyBackend(request("rooms"), ["rooms"], { ...config, backendUrl });
    assert.equal(response.status, 503);
  }
  const response = await proxyBackend(request("rooms"), ["rooms"], {
    ...config, fetcher: async () => { throw new Error("internal-host-and-secret"); },
  });
  assert.equal(response.status, 502);
  assert.doesNotMatch(await response.text(), /internal-host-and-secret/);
});
