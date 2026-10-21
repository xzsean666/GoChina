import type { DatabaseClient } from '../db/client.js';
import type { Pay3Client } from '../pay3/client.js';
import { EntitlementService } from './entitlement.js';
import type { Entitlement, Order, OrderData } from '../types/models.js';

export interface VerifyOrderResult {
  order: Order;
  paid: boolean;
  pay3Status: string;
  entitlement?: Entitlement;
  message?: string;
}

export interface SweepResult {
  sweptCount: number;
  paidCount: number;
  expiredCount: number;
}

export class VerificationService {
  private entitlementService: EntitlementService;

  constructor(
    private db: DatabaseClient,
    private pay3Client: Pay3Client,
    entitlementService?: EntitlementService
  ) {
    this.entitlementService = entitlementService || new EntitlementService(db);
  }

  async verifyOrderInstant(orderId: string, userId?: string): Promise<VerifyOrderResult> {
    const order = await this.db.orders.get(orderId);
    if (!order) {
      throw new Error(`Order '${orderId}' not found`);
    }

    if (userId && order.userId !== userId) {
      throw new Error('Unauthorized order access');
    }

    if (order.status === 'paid') {
      const activeEntitlement = await this.getEntitlementForOrder(orderId);
      return {
        order: { id: orderId, ...order },
        paid: true,
        pay3Status: 'paid',
        entitlement: activeEntitlement ?? undefined,
        message: 'Order has already been fulfilled',
      };
    }

    // Call Pay3 direct verify endpoint
    const pay3Res = await this.pay3Client.verifyOrder(order.pay3OrderId);

    if (pay3Res.status === 'paid') {
      // Re-fetch order to protect against concurrent fulfillment race condition (TOCTOU)
      const currentOrder = await this.db.orders.get(orderId);
      if (currentOrder && currentOrder.status === 'paid') {
        const activeEntitlement = await this.getEntitlementForOrder(orderId);
        return {
          order: { id: orderId, ...currentOrder },
          paid: true,
          pay3Status: 'paid',
          entitlement: activeEntitlement ?? undefined,
          message: 'Order has already been fulfilled',
        };
      }

      order.status = 'paid';
      order.paidAmount = pay3Res.payment.amount;
      order.metadata = {
        ...order.metadata,
        paidAt: new Date().toISOString(),
        diagnostics: pay3Res.diagnostics,
      };

      await this.saveOrder(orderId, order);

      let entitlement: Entitlement | undefined;
      if (order.contractId) {
        const contract = await this.db.contracts.get(order.contractId);
        if (contract) {
          const updatedContract = {
            ...contract,
            paymentStatus: 'paid' as const,
            status: 'active' as const,
            orderId,
            updated_at: Date.now(),
          };
          await this.db.contracts.set(order.contractId, updatedContract, {
            keys: {
              userId: contract.userId,
              talentId: contract.talentId,
              status: 'active',
              contractNo: contract.contractNo,
              orderId,
            },
          });
          await this.db.contracts.flush();
        }
      } else if (order.planId) {
        entitlement = await this.entitlementService.provisionOrExtendEntitlement(
          order.userId,
          order.planId,
          orderId
        );
      }

      return {
        order: { id: orderId, ...order },
        paid: true,
        pay3Status: 'paid',
        entitlement,
      };
    }

    // Check for late payment or diagnostics
    if (pay3Res.diagnostics && pay3Res.diagnostics.late_payment_count > 0) {
      order.metadata = {
        ...order.metadata,
        latePayment: true,
        diagnostics: pay3Res.diagnostics,
      };
    }

    if (pay3Res.status === 'partial') {
      order.status = 'partial';
      await this.saveOrder(orderId, order);
    } else if (pay3Res.status === 'expired' || new Date(order.expiresAt).getTime() < Date.now()) {
      order.status = 'expired';
      await this.saveOrder(orderId, order);
    }

    return {
      order: { id: orderId, ...order },
      paid: false,
      pay3Status: pay3Res.status,
    };
  }

  async sweepPendingOrders(batchSize = 20): Promise<SweepResult> {
    // Leverage KVDB physical B-Tree index on status column with pagination limit
    const page = await this.db.orders.findPage(
      { status: 'pending' },
      { limit: batchSize }
    );

    const candidates = page.items;
    let paidCount = 0;
    let expiredCount = 0;

    // Process with bounded concurrency (5 concurrent requests) to optimize throughput without saturating limits
    const chunkSize = 5;
    for (let i = 0; i < candidates.length; i += chunkSize) {
      const chunk = candidates.slice(i, i + chunkSize);
      await Promise.allSettled(
        chunk.map(async (rawOrder: any) => {
          const orderId = rawOrder.key || rawOrder.id;
          const order = await this.db.orders.get(orderId);
          if (!order || order.status !== 'pending') return;

          try {
            const pay3Res = await this.pay3Client.getOrder(order.pay3OrderId);

            if (pay3Res.status === 'paid') {
              order.status = 'paid';
              order.paidAmount = pay3Res.payment.amount;
              order.metadata = {
                ...order.metadata,
                paidAt: new Date().toISOString(),
                diagnostics: pay3Res.diagnostics,
              };
              await this.saveOrder(orderId, order);
              if (order.contractId) {
                const contract = await this.db.contracts.get(order.contractId);
                if (contract) {
                  const updatedContract = {
                    ...contract,
                    paymentStatus: 'paid' as const,
                    status: 'active' as const,
                    orderId,
                    updated_at: Date.now(),
                  };
                  await this.db.contracts.set(order.contractId, updatedContract, {
                    keys: {
                      userId: contract.userId,
                      talentId: contract.talentId,
                      status: 'active',
                      contractNo: contract.contractNo,
                      orderId,
                    },
                  });
                  await this.db.contracts.flush();
                }
              } else if (order.planId) {
                await this.entitlementService.provisionOrExtendEntitlement(
                  order.userId,
                  order.planId,
                  orderId
                );
              }
              paidCount++;
            } else if (
              pay3Res.status === 'expired' ||
              new Date(order.expiresAt).getTime() < Date.now()
            ) {
              order.status = 'expired';
              if (pay3Res.diagnostics) {
                order.metadata = { ...order.metadata, diagnostics: pay3Res.diagnostics };
              }
              await this.saveOrder(orderId, order);
              expiredCount++;
            }
          } catch (err) {
            console.error(`Error sweeping order ${orderId}:`, err);
          }
        })
      );
    }

    await this.db.orders.flush();
    return {
      sweptCount: candidates.length,
      paidCount,
      expiredCount,
    };
  }

  private async getEntitlementForOrder(orderId: string): Promise<Entitlement | null> {
    const list = await this.db.entitlements.find({ orderId });
    if (list.length === 0) return null;
    const item = list[0]!;
    return {
      id: (item as any).key || item.id,
      ...item,
    };
  }

  private async saveOrder(orderId: string, order: OrderData): Promise<void> {
    await this.db.orders.set(orderId, order, {
      keys: {
        externalId: order.externalId,
        pay3OrderId: order.pay3OrderId,
        userId: order.userId,
        status: order.status,
        receiveAddress: order.receiveAddress,
      },
    });
    await this.db.orders.flush();
  }
}
