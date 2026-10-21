import { generatePay3Token } from './jwt.js';
import { Pay3ApiError, type Pay3ErrorPayload } from './errors.js';
import type {
  Pay3ClientConfig,
  Pay3CreateOrderParams,
  Pay3OrderResponse,
} from './types.js';

export class Pay3Client {
  private baseUrl: string;
  private fetchFn: typeof fetch;

  constructor(private config: Pay3ClientConfig) {
    this.baseUrl = config.baseUrl.replace(/\/+$/, '');
    this.fetchFn = config.fetchFn ?? globalThis.fetch;
  }

  private async request<T>(
    path: string,
    method: 'GET' | 'POST',
    scopes: string[],
    body?: unknown,
    retries = 2
  ): Promise<T> {
    const url = `${this.baseUrl}${path}`;
    const token = await generatePay3Token(this.config, scopes);

    let lastError: unknown;
    for (let attempt = 0; attempt <= retries; attempt++) {
      try {
        const resp = await this.fetchFn(url, {
          method,
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
            Accept: 'application/json',
          },
          body: body ? JSON.stringify(body) : undefined,
          signal: typeof AbortSignal !== 'undefined' && typeof AbortSignal.timeout === 'function'
            ? AbortSignal.timeout(5000)
            : undefined,
        });

        if (!resp.ok) {
          const errorPayload = (await resp.json().catch(() => ({}))) as Pay3ErrorPayload;
          const apiError = new Pay3ApiError(resp.status, errorPayload);
          if (apiError.retryable && attempt < retries && method === 'GET') {
            await new Promise((r) => setTimeout(r, 100 * Math.pow(2, attempt)));
            continue;
          }
          throw apiError;
        }

        return (await resp.json()) as T;
      } catch (err: any) {
        lastError = err;
        if (err instanceof Pay3ApiError) {
          throw err;
        }
        if (attempt < retries) {
          await new Promise((r) => setTimeout(r, 100 * Math.pow(2, attempt)));
          continue;
        }
      }
    }

    throw lastError;
  }

  async createOrder(params: Pay3CreateOrderParams): Promise<Pay3OrderResponse> {
    return await this.request<Pay3OrderResponse>(
      '/v1/orders',
      'POST',
      ['orders:create', 'orders:read'],
      {
        external_id: params.externalId,
        amount: params.amount,
        ttl_seconds: params.ttlSeconds,
        metadata: params.metadata,
      }
    );
  }

  async getOrder(orderId: string): Promise<Pay3OrderResponse> {
    return await this.request<Pay3OrderResponse>(
      `/v1/orders/${encodeURIComponent(orderId)}`,
      'GET',
      ['orders:read']
    );
  }

  async getOrderByExternalId(externalId: string): Promise<Pay3OrderResponse> {
    return await this.request<Pay3OrderResponse>(
      `/v1/orders/by-external-id/${encodeURIComponent(externalId)}`,
      'GET',
      ['orders:read']
    );
  }

  async verifyOrder(orderId: string): Promise<Pay3OrderResponse> {
    return await this.request<Pay3OrderResponse>(
      `/v1/orders/${encodeURIComponent(orderId)}/verify`,
      'POST',
      ['orders:verify', 'orders:read']
    );
  }
}
