export type Pay3OrderStatus = 'pending' | 'partial' | 'confirming' | 'paid' | 'expired';

export interface Pay3PaymentInfo {
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
}

export interface Pay3Diagnostics {
  state: string;
  problem_payment_count: number;
  problem_payment_total_raw: string;
  late_payment_count: number;
  late_payment_total_raw: string;
  outside_window_payment_count: number;
  outside_window_payment_total_raw: string;
  latest_problem_payment?: unknown;
  problem_collection?: unknown;
  manual_acceptance?: unknown;
}

export interface Pay3OrderResponse {
  id: string;
  external_id: string;
  status: Pay3OrderStatus;
  payment: Pay3PaymentInfo;
  diagnostics?: Pay3Diagnostics;
}

export interface Pay3CreateOrderParams {
  externalId: string;
  amount: string;
  ttlSeconds: number;
  metadata?: Record<string, unknown>;
}

export interface Pay3ClientConfig {
  baseUrl: string;
  jwtSecret: string;
  jwtIssuer?: string;
  jwtAudience?: string;
  jwtSubject?: string;
  jwtKeyId?: string;
  fetchFn?: typeof fetch;
}
