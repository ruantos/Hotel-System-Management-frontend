type OriginEnvironment = {
  FRONTEND_ORIGIN?: string;
  VERCEL?: string;
  VERCEL_PROJECT_PRODUCTION_URL?: string;
  VERCEL_URL?: string;
  VERCEL_BRANCH_URL?: string;
};

export function normalizeFrontendOrigin(value?: string): string | null {
  if (!value?.trim()) return null;
  try {
    const url = new URL(value.trim());
    if (!["http:", "https:"].includes(url.protocol) || url.username || url.password ||
      url.pathname !== "/" || url.search || url.hash || url.hostname.includes("*")) return null;
    return url.origin;
  } catch { return null; }
}

export function resolveFrontendOrigins(env: OriginEnvironment): string[] {
  const candidates = [env.FRONTEND_ORIGIN];
  // Usar somente os domínios fornecidos pela plataforma, nunca Host/Forwarded
  // da requisição nem uma permissão genérica para *.vercel.app.
  if (env.VERCEL === "1") {
    for (const host of [env.VERCEL_PROJECT_PRODUCTION_URL, env.VERCEL_URL, env.VERCEL_BRANCH_URL]) {
      if (host?.trim()) candidates.push("https://" + host.trim());
    }
  }
  return [...new Set(candidates.map(normalizeFrontendOrigin).filter((value): value is string => value !== null))];
}
