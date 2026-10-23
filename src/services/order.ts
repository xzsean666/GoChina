import type { DatabaseClient } from '../db/client.js';
import type { Pay3Client } from '../pay3/client.js';
import type { Order, OrderData, OrderStatus } from '../types/models.js';
import type { CheckoutResult, UserOrdersPage, UpdateOrderStatusOptions } from './types.js';

export class OrderService {
  constructor(
    private db: DatabaseClient,
    private pay3Client: Pay3Client
  ) {}

  async createCheckoutOrder(userId: string, planId: string): Promise<CheckoutResult> {
    const plan = await this.db.plans.get(planId);
    if (!plan || plan.enabled !== 1) {
      throw new Error(`Plan '${planId}' not found or is currently disabled`);
    }

    // Check for existing pending order for this user and plan with >= 5 minutes valid window
    const pendingOrders = await this.db.orders.find({
      userId,
      status: 'pending',
    });

    const now = Date.now();
    const existingOrder = pendingOrders.find((ord) => {
      if (ord.planId !== planId) return false;
      const expiry = new Date(ord.expiresAt).getTime();
      return expiry - now > 5 * 60 * 1000;
    });

    if (existingOrder) {
      const orderId = (existingOrder as any).key || existingOrder.id;
      return {
        order: { id: orderId, ...existingOrder },
        payment: {
          chainId: existingOrder.chainId,
          tokenAddress: existingOrder.tokenAddress || '0xc252a473dc466de3799149a2616ccc625832f40c',
          tokenSymbol: existingOrder.tokenSymbol,
          tokenDecimals: 6,
          amount: existingOrder.amount,
          receiveAddress: existingOrder.receiveAddress,
          expiresAt: existingOrder.expiresAt,
        },
      };
    }

    const orderId = `ord_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;
    const externalId = `ord_gochina_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;

    const pay3Res = await this.pay3Client.createOrder({
      externalId,
      amount: plan.tokenAmount,
      ttlSeconds: 3600,
      metadata: {
        userId,
        planId,
        orderId,
      },
    });

    const orderData: OrderData = {
      externalId: pay3Res.external_id,
      pay3OrderId: pay3Res.id,
      userId,
      planId,
      amount: plan.tokenAmount,
      tokenSymbol: pay3Res.payment.token_symbol,
      tokenAddress: pay3Res.payment.token_address,
      chainId: pay3Res.payment.chain_id,
      receiveAddress: pay3Res.payment.receive_address,
      status: 'pending',
      expiresAt: pay3Res.payment.expires_at,
      metadata: {
        planName: plan.name,
        planPriceUsd: plan.priceUsd,
        durationDays: plan.durationDays,
      },
    };

    await this.db.orders.set(orderId, orderData, {
      keys: {
        externalId: pay3Res.external_id,
        pay3OrderId: pay3Res.id,
        userId,
        status: 'pending',
        receiveAddress: pay3Res.payment.receive_address,
      },
    });
    await this.db.orders.flush();

    const createdOrder: Order = {
      id: orderId,
      ...orderData,
    };

    return {
      order: createdOrder,
      payment: {
        chainId: pay3Res.payment.chain_id,
        tokenAddress: pay3Res.payment.token_address,
        tokenSymbol: pay3Res.payment.token_symbol,
        tokenDecimals: pay3Res.payment.token_decimals,
        amount: pay3Res.payment.amount,
        receiveAddress: pay3Res.payment.receive_address,
        expiresAt: pay3Res.payment.expires_at,
      },
    };
  }

  async getOrderDetails(orderId: string, userId?: string): Promise<Order | null> {
    const order = await this.db.orders.get(orderId);
    if (!order) return null;

    if (userId && order.userId !== userId) {
      throw new Error('Unauthorized order access');
    }

    return {
      id: orderId,
      ...order,
    };
  }

  async getOrderByExternalId(externalId: string): Promise<Order | null> {
    const record = await this.db.orders.getBy('externalId', externalId);
    if (!record) return null;

    return {
      id: String(record.key),
      ...record,
    };
  }

  async getUserOrders(userId: string, cursor?: string, limit = 10): Promise<UserOrdersPage> {
    const page = await this.db.orders.findPage(
      { userId },
      {
        cursor,
        limit,
        sort: [{ field: 'created_at', direction: 'desc' }],
      }
    );

    const orders: Order[] = page.items.map((item: any) => ({
      id: item.key || item.id,
      ...item,
    }));

    return {
      orders,
      cursor: page.cursor,
      hasMore: !page.complete,
    };
  }

  async updateOrderStatus(orderId: string, options: UpdateOrderStatusOptions): Promise<Order> {
    const order = await this.db.orders.get(orderId);
    if (!order) {
      throw new Error(`Order '${orderId}' not found`);
    }

    order.status = options.status;
    if (options.paidAmount) order.paidAmount = options.paidAmount;
    if (options.txHash) order.txHash = options.txHash;

    await this.db.orders.set(orderId, order, {
      keys: {
        externalId: order.externalId,
        pay3OrderId: order.pay3OrderId,
        userId: order.userId,
        status: options.status,
        receiveAddress: order.receiveAddress,
      },
    });
    await this.db.orders.flush();

    return {
      id: orderId,
      ...order,
    };
  }
}
