import { ApiError, retryAfterSeconds } from "./problem.js";

export function createApiClient(fetcher = (...args) => fetch(...args), base = "/api/backend") {
  async function send(path, options = {}, csrf) {
    const headers = new Headers({ Accept: "application/json" });
    const form = options.body instanceof URLSearchParams;
    if (options.body !== undefined) headers.set("Content-Type", form ? "application/x-www-form-urlencoded" : "application/json");
    if (csrf) headers.set(csrf.headerName, csrf.token);
    let response;
    try {
      response = await fetcher(base + "/" + path, {
        method: options.method ?? "GET", headers,
        body: options.body === undefined ? undefined : form ? options.body : JSON.stringify(options.body),
        credentials: "include", cache: "no-store", signal: options.signal,
      });
    } catch (error) {
      if (options.signal?.aborted) throw error;
      throw new ApiError(0, options.method && options.method !== "GET"
        ? "A conexão foi interrompida. Confira o resultado antes de repetir a operação."
        : "Não foi possível conectar. Confira a conexão e tente novamente.");
    }
    const json = response.headers.get("content-type")?.includes("json");
    let data;
    if (response.status !== 204 && json) {
      try { data = await response.json(); } catch { /* resposta inválida tratada abaixo */ }
    }
    if (!response.ok) {
      const problem = data && typeof data === "object" ? data : {};
      const fields = problem.errors && typeof problem.errors === "object"
        ? Object.fromEntries(Object.entries(problem.errors).filter((entry) => typeof entry[1] === "string")) : {};
      throw new ApiError(response.status, typeof problem.detail === "string" ? problem.detail : "O serviço não pôde concluir a solicitação. Tente novamente.", fields, retryAfterSeconds(response.headers.get("Retry-After")));
    }
    if (response.status !== 204 && data === undefined) throw new ApiError(502, "O serviço retornou uma resposta inesperada.");
    return data;
  }

  async function request(path, options = {}) {
    if (!options.method || options.method === "GET") return send(path, options);
    const csrf = await send("auth/csrf", { signal: options.signal });
    if (csrf.headerName !== "X-CSRF-TOKEN" || !csrf.token) throw new ApiError(502, "Não foi possível preparar uma solicitação segura.");
    return send(path, options, csrf);
  }
  return { request };
}

export const api = createApiClient();
