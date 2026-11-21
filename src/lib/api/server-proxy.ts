import { allowedMethods } from "./backend-routes.ts";

type ProxyOptions = {
  backendUrl?: string;
  frontendOrigin?: string;
  fetcher?: typeof fetch;
};

function problem(status: number, detail: string, extraHeaders?: HeadersInit) {
  return Response.json({ type: "about:blank", title: "Falha na solicitação", status, detail }, {
    status,
    headers: { "Content-Type": "application/problem+json", "Cache-Control": "no-store", ...extraHeaders },
  });
}

function backendAddress(value?: string) {
  if (!value) return null;
  try {
    const url = new URL(value);
    if (!["http:", "https:"].includes(url.protocol) || url.username || url.password || url.search || url.hash) return null;
    url.pathname = url.pathname.replace(/\/$/, "");
    if (!url.pathname.endsWith("/api")) return null;
    return url;
  } catch { return null; }
}

function validOrigin(origin: string | null, configured?: string) {
  if (!origin || !configured) return false;
  try {
    const url = new URL(configured);
    return ["http:", "https:"].includes(url.protocol) && url.origin === configured && origin === configured;
  } catch { return false; }
}

export function proxyCookie(cookie: string, backendPath: string) {
  const attributes = cookie.split(";").map((part) => part.trim());
  const output = [attributes[0]];
  let hasPath = false;
  for (const attribute of attributes.slice(1)) {
    if (/^domain=/i.test(attribute)) continue;
    if (/^path=/i.test(attribute)) {
      hasPath = true;
      const path = attribute.slice(5);
      const mapped = path === "/" ? "/" : path === backendPath || path.startsWith(backendPath + "/")
        ? "/api/backend" + path.slice(backendPath.length) : "/api/backend";
      output.push("Path=" + mapped);
    } else output.push(attribute);
  }
  if (!hasPath) output.push("Path=/api/backend");
  return output.join("; ");
}

async function limitedBody(request: Request) {
  if (!request.body) return undefined;
  const reader = request.body.getReader();
  const chunks: Uint8Array[] = [];
  let size = 0;
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    size += value.byteLength;
    if (size > 1_048_576) { await reader.cancel(); throw new RangeError("body"); }
    chunks.push(value);
  }
  const body = new Uint8Array(size);
  let offset = 0;
  for (const chunk of chunks) { body.set(chunk, offset); offset += chunk.byteLength; }
  return body;
}

export async function proxyBackend(request: Request, segments: string[], options: ProxyOptions): Promise<Response> {
  const path = segments.join("/");
  const methods = allowedMethods(path);
  if (!methods.length) return problem(404, "Recurso não encontrado.");
  if (!methods.includes(request.method)) return problem(405, "Método não permitido.", { Allow: methods.join(", ") });
  const backend = backendAddress(options.backendUrl);
  if (!backend) return problem(503, "O serviço está temporariamente indisponível. Tente novamente mais tarde.");
  const writes = request.method !== "GET";
  if (writes && !validOrigin(request.headers.get("origin"), options.frontendOrigin)) {
    return problem(403, "Origem da solicitação não permitida.");
  }
  const contentType = request.headers.get("content-type");
  if (writes && contentType && !/^(application\/json|application\/x-www-form-urlencoded)(;|$)/i.test(contentType)) {
    return problem(415, "Formato de solicitação não suportado.");
  }
  const headers = new Headers({ Accept: "application/json" });
  for (const name of ["cookie", "content-type", "x-csrf-token"]) {
    const value = request.headers.get(name);
    if (value) headers.set(name, value);
  }
  const target = new URL(backend.href.replace(/\/$/, "") + "/" + path);
  target.search = new URL(request.url).search;
  try {
    const body = writes ? await limitedBody(request) : undefined;
    const upstream = await (options.fetcher ?? fetch)(target, {
      method: request.method, headers, body, redirect: "manual", cache: "no-store",
      signal: AbortSignal.any([request.signal, AbortSignal.timeout(60_000)]),
    });
    const output = new Headers({ "Cache-Control": "no-store, max-age=0", "X-Content-Type-Options": "nosniff" });
    const type = upstream.headers.get("content-type");
    const retryAfter = upstream.headers.get("retry-after");
    if (retryAfter) output.set("Retry-After", retryAfter);
    if (type) output.set("Content-Type", type.includes("json") ? type : "text/plain; charset=utf-8");
    for (const cookie of upstream.headers.getSetCookie()) output.append("Set-Cookie", proxyCookie(cookie, backend.pathname));
    const location = upstream.headers.get("location");
    if (location) {
      try {
        const url = new URL(location, target);
        if (url.origin === backend.origin && url.pathname.startsWith(backend.pathname + "/")) {
          output.set("Location", "/api/backend" + url.pathname.slice(backend.pathname.length) + url.search);
        }
      } catch { /* Location inesperado é omitido sem perder uma gravação concluída. */ }
    }
    return new Response([204, 304].includes(upstream.status) ? null : upstream.body, { status: upstream.status, headers: output });
  } catch (error) {
    if (error instanceof RangeError) return problem(413, "A solicitação excede o tamanho permitido.");
    return problem(502, "Não foi possível acessar o serviço. Tente novamente em instantes.");
  }
}
