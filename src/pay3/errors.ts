export interface Pay3ErrorPayload {
  code?: string;
  message?: string;
  retryable?: boolean;
  details?: unknown;
}

export class Pay3ApiError extends Error {
  public status: number;
  public code: string;
  public retryable: boolean;
  public details?: unknown;

  constructor(status: number, payload: Pay3ErrorPayload | string) {
    const message =
      typeof payload === 'string'
        ? payload
        : payload.message || `Pay3 API request failed with status ${status}`;
    super(message);
    this.name = 'Pay3ApiError';
    this.status = status;
    this.code =
      typeof payload === 'object' && payload.code ? payload.code : `HTTP_${status}`;
    this.retryable =
      typeof payload === 'object' && payload.retryable !== undefined
        ? Boolean(payload.retryable)
        : status === 502 || status === 503 || status === 504 || status === 429;
    this.details = typeof payload === 'object' ? payload.details : undefined;
  }
}
