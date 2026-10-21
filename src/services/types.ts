import type { Order, OrderStatus } from '../types/models.js';

export interface CheckoutResult {
  order: Order;
  payment: {
    chainId: number;
    tokenAddress: string;
    tokenSymbol: string;
    tokenDecimals: number;
    amount: string;
    receiveAddress: string;
    expiresAt: string;
  };
}

export interface UserOrdersPage {
  orders: Order[];
  cursor?: string;
  hasMore: boolean;
}

export interface UpdateOrderStatusOptions {
  status: OrderStatus;
  paidAmount?: string;
  txHash?: string;
}
