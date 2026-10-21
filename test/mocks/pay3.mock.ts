import { jwtVerify } from 'jose';
import type { Pay3OrderResponse, Pay3OrderStatus } from '../../src/pay3/types.js';

export interface MockOrderRecord {
  id: string;
  external_id: string;
  amount: string;
  ttl_seconds: number;
  status: Pay3OrderStatus;
  payment: {
    chain_id: number;
    token_address: string;
    token_symbol: string;
    token_decimals: number;
    amount: string;
    amount_raw: string;
    paid_amount_raw: string;
    receive_address: string;
    child_account_id: string;
    derivation_path: string;
    expires_at: string;
    monitor_until: string;
  };
  metadata?: Record<string, unknown>;
}

export class MockPay3Server {
  public orders = new Map<string, MockOrderRecord>(); // key: id
  public ordersByExternalId = new Map<string, MockOrderRecord>();
  public jwtSecret: string;
  public addressCounter = 1;

  constructor(jwtSecret: string) {
    this.jwtSecret = jwtSecret;
  }

  private async verifyAuth(req: Request, requiredScope: string): Promise<boolean> {
    const auth = req.headers.get('Authorization');
    if (!auth || !auth.startsWith('Bearer ')) return false;
    const token = auth.slice(7).trim();
    try {
      const { payload } = await jwtVerify(token, new TextEncoder().encode(this.jwtSecret));
      const scopes = String(payload.scope || '').split(' ');
      return scopes.includes(requiredScope);
    } catch {
      return false;
    }
  }

  createFetch(): typeof fetch {
    return async (input: RequestInfo | URL, init?: RequestInit): Promise<Response> => {
      const req = new Request(input, init);
      const url = new URL(req.url);
      const pathname = url.pathname;
      const method = req.method.toUpperCase();

      // POST /v1/orders
      if (method === 'POST' && pathname === '/v1/orders') {
        const authorized = await this.verifyAuth(req, 'orders:create');
        if (!authorized) {
          return Response.json({ code: 'UNAUTHORIZED', message: 'Missing orders:create scope' }, { status: 401 });
        }

        const body = await req.json() as any;
        if (!body.external_id || !body.amount) {
          return Response.json({ code: 'BAD_REQUEST', message: 'Missing external_id or amount' }, { status: 400 });
        }

        // Idempotency check
        if (this.ordersByExternalId.has(body.external_id)) {
          const existing = this.ordersByExternalId.get(body.external_id)!;
          return Response.json(existing, { status: 200 });
        }

        const id = `p3_ord_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
        const addrIndex = this.addressCounter++;
        const receive_address = `0x${addrIndex.toString(16).padStart(40, '0')}`;
        const amountRaw = (parseFloat(body.amount) * 1e6).toFixed(0);

        const newOrder: MockOrderRecord = {
          id,
          external_id: body.external_id,
          amount: body.amount,
          ttl_seconds: body.ttl_seconds || 3600,
          status: 'pending',
          payment: {
            chain_id: 80002,
            token_address: '0x3813e82e6f7098b9583FC0F33a9821830A26ad81',
            token_symbol: 'USDT',
            token_decimals: 6,
            amount: body.amount,
            amount_raw: amountRaw,
            paid_amount_raw: '0',
            receive_address,
            child_account_id: `acc_${id}`,
            derivation_path: `m/44'/60'/0'/0/${addrIndex}`,
            expires_at: new Date(Date.now() + (body.ttl_seconds || 3600) * 1000).toISOString(),
            monitor_until: new Date(Date.now() + ((body.ttl_seconds || 3600) + 3600) * 1000).toISOString(),
          },
          metadata: body.metadata,
        };

        this.orders.set(id, newOrder);
        this.ordersByExternalId.set(body.external_id, newOrder);

        const resPayload: Pay3OrderResponse = {
          id: newOrder.id,
          external_id: newOrder.external_id,
          status: newOrder.status,
          payment: newOrder.payment,
          diagnostics: {
            state: 'awaiting_payment',
            problem_payment_count: 0,
            problem_payment_total_raw: '0',
            late_payment_count: 0,
            late_payment_total_raw: '0',
            outside_window_payment_count: 0,
            outside_window_payment_total_raw: '0',
          },
        };

        return Response.json(resPayload, { status: 201 });
      }

      // GET /v1/orders/by-external-id/:external_id
      if (method === 'GET' && pathname.startsWith('/v1/orders/by-external-id/')) {
        const authorized = await this.verifyAuth(req, 'orders:read');
        if (!authorized) {
          return Response.json({ code: 'UNAUTHORIZED', message: 'Missing orders:read scope' }, { status: 401 });
        }

        const externalId = decodeURIComponent(pathname.replace('/v1/orders/by-external-id/', ''));
        const order = this.ordersByExternalId.get(externalId);
        if (!order) {
          return Response.json({ code: 'NOT_FOUND', message: 'Order not found' }, { status: 404 });
        }
        return Response.json(order, { status: 200 });
      }

      // POST /v1/orders/:id/verify
      if (method === 'POST' && pathname.endsWith('/verify')) {
        const authorized = await this.verifyAuth(req, 'orders:verify');
        if (!authorized) {
          return Response.json({ code: 'UNAUTHORIZED', message: 'Missing orders:verify scope' }, { status: 401 });
        }

        const id = decodeURIComponent(pathname.replace('/v1/orders/', '').replace('/verify', ''));
        const order = this.orders.get(id);
        if (!order) {
          return Response.json({ code: 'NOT_FOUND', message: 'Order not found' }, { status: 404 });
        }

        // Simulate successful payment verification
        order.status = 'paid';
        order.payment.paid_amount_raw = order.payment.amount_raw;

        return Response.json(order, { status: 200 });
      }

      // GET /v1/orders/:id
      if (method === 'GET' && pathname.startsWith('/v1/orders/')) {
        const authorized = await this.verifyAuth(req, 'orders:read');
        if (!authorized) {
          return Response.json({ code: 'UNAUTHORIZED', message: 'Missing orders:read scope' }, { status: 401 });
        }

        const id = decodeURIComponent(pathname.replace('/v1/orders/', ''));
        const order = this.orders.get(id);
        if (!order) {
          return Response.json({ code: 'NOT_FOUND', message: 'Order not found' }, { status: 404 });
        }
        return Response.json(order, { status: 200 });
      }

      return new Response('Not Found', { status: 404 });
    };
  }
}
