import test from "node:test";
import assert from "node:assert/strict";
import { QueryClient } from "@tanstack/react-query";
import { clearPrivateCache, expireSession, isCurrentSession, sessionVersion } from "../src/lib/api/session-cache.ts";
import { safeReturnPath } from "../src/features/auth/navigation.ts";

test("encerrar sessão remove dados privados e impede resposta tardia de restaurar cache", async () => {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false, gcTime: 0 } } });
  let release;
  const late = new Promise((resolve) => { release = resolve; });
  client.setQueryData(["auth", "me"], { id: 1 });
  client.setQueryData(["rooms"], [{ id: 1 }]);
  const pending = client.fetchQuery({ queryKey: ["reservations", 1], meta: { private: true, userId: 1 }, queryFn: () => late }).catch(() => {});
  await expireSession(client);
  release([{ id: 30, private: true }]);
  await pending;
  assert.equal(client.getQueryData(["auth", "me"]), null);
  assert.equal(client.getQueryData(["reservations", 1]), undefined);
  assert.deepEqual(client.getQueryData(["rooms"]), [{ id: 1 }]);
  client.clear();
});

test("trocar usuário limpa somente o cache antigo, preservando as consultas da nova conta", async () => {
  const client = new QueryClient({ defaultOptions: { queries: { gcTime: 0 } } });
  await client.fetchQuery({ queryKey: ["users", 1], queryFn: async () => ["old"], meta: { private: true, userId: 1 } });
  await client.fetchQuery({ queryKey: ["users", 2], queryFn: async () => ["new"], meta: { private: true, userId: 2 } });
  await clearPrivateCache(client, 1);
  assert.equal(client.getQueryData(["users", 1]), undefined);
  assert.deepEqual(client.getQueryData(["users", 2]), ["new"]);
  client.clear();
});

test("retorno após login não permite redirecionamento para outra origem", () => {
  for (const value of ["https://attacker.test", "//attacker.test", "/\\attacker.test", "/entrar", "javascript:alert(1)"]) {
    assert.equal(safeReturnPath(value, "/conta"), "/conta");
  }
  assert.equal(safeReturnPath("/quartos/3?origem=busca", "/conta"), "/quartos/3?origem=busca");
});

test("resposta de mutação anterior ao logout não pertence à nova sessão da mesma conta", async () => {
  const client = new QueryClient();
  client.setQueryData(["auth", "me"], { id: 1 });
  const previous = sessionVersion(client);
  assert.equal(isCurrentSession(client, 1, previous), true);
  await expireSession(client);
  client.setQueryData(["auth", "me"], { id: 1 });
  assert.equal(isCurrentSession(client, 1, previous), false);
  client.clear();
});
