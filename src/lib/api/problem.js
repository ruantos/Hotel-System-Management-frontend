export class ApiError extends Error {
  constructor(status, message, fields = {}, retryAfter) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.fields = fields;
    this.retryAfter = retryAfter;
  }
}

export function retryAfterSeconds(value, now = Date.now()) {
  if (!value) return undefined;
  const seconds = /^\d+$/.test(value) ? Number(value) : Math.ceil((Date.parse(value) - now) / 1000);
  return Number.isFinite(seconds) ? Math.min(86_400, Math.max(0, seconds)) : undefined;
}

export function errorMessage(error) {
  return error instanceof ApiError ? error.message : "Não foi possível concluir. Tente novamente em instantes.";
}

export function fieldErrors(error) {
  return error instanceof ApiError ? error.fields : {};
}
