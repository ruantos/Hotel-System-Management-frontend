export class ApiError extends Error {
  readonly status: number;
  readonly fields: Record<string, string>;
  readonly retryAfter?: number;

  constructor(status: number, message: string, fields: Record<string, string> = {}, retryAfter?: number) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.fields = fields;
    this.retryAfter = retryAfter;
  }
}

export function retryAfterSeconds(value: string | null, now = Date.now()) {
  if (!value) return undefined;
  const seconds = /^\d+$/.test(value) ? Number(value) : Math.ceil((Date.parse(value) - now) / 1000);
  return Number.isFinite(seconds) ? Math.min(86_400, Math.max(0, seconds)) : undefined;
}

export function errorMessage(error: unknown) {
  return error instanceof ApiError ? error.message : "Não foi possível concluir. Tente novamente em instantes.";
}

export function fieldErrors(error: unknown) {
  return error instanceof ApiError ? error.fields : {};
}
