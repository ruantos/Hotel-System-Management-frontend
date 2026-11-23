const versions = new WeakMap();

export function sessionVersion(client) { return versions.get(client) ?? 0; }

export function isCurrentSession(client, userId, version) {
  return userId !== undefined && client.getQueryData(["auth", "me"])?.id === userId && sessionVersion(client) === version;
}

export async function clearPrivateCache(client, userId) {
  const filter = { predicate: (query) =>
    query.meta?.private === true && (userId === undefined || query.meta.userId === userId) };
  await client.cancelQueries(filter);
  client.removeQueries(filter);
}

export async function expireSession(client) {
  versions.set(client, sessionVersion(client) + 1);
  await client.cancelQueries({ queryKey: ["auth", "me"], exact: true });
  await clearPrivateCache(client);
  client.setQueryData(["auth", "me"], null);
  client.getMutationCache().clear();
}
