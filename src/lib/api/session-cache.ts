import type { QueryClient } from "@tanstack/react-query";

const versions = new WeakMap<QueryClient, number>();

export function sessionVersion(client: QueryClient) { return versions.get(client) ?? 0; }

export function isCurrentSession(client: QueryClient, userId: number | undefined, version: number) {
  return userId !== undefined && client.getQueryData<{ id: number } | null>(["auth", "me"])?.id === userId && sessionVersion(client) === version;
}

export async function clearPrivateCache(client: QueryClient, userId?: number) {
  const filter = { predicate: (query: { meta?: Record<string, unknown> }) =>
    query.meta?.private === true && (userId === undefined || query.meta.userId === userId) };
  await client.cancelQueries(filter);
  client.removeQueries(filter);
}

export async function expireSession(client: QueryClient) {
  versions.set(client, sessionVersion(client) + 1);
  await client.cancelQueries({ queryKey: ["auth", "me"], exact: true });
  await clearPrivateCache(client);
  client.setQueryData(["auth", "me"], null);
  client.getMutationCache().clear();
}
