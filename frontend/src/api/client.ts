export interface PlanDefinition {
  id: string;
  name: string;
  category: string;
  description: string;
  price_usd: number;
  currency: string;
  duration_days: number;
  quota_limit: number;
  features: string[];
  enabled: boolean;
}

export interface UserProfile {
  id: string;
  role: 'user' | 'admin';
  email?: string;
  address?: string;
  walletAddress?: string;
  created_at?: number;
}

export interface OrderRecord {
  id: string;
  user_id: string;
  plan_id: string;
  chain_id: number;
  token_symbol: string;
  expected_amount: string;
  pay3_order_id: string;
  deposit_address: string;
  status: 'pending' | 'paid' | 'expired' | 'failed';
  expires_at: number;
  paid_at?: number;
  created_at: number;
  updated_at: number;
}

export interface EntitlementRecord {
  id: string;
  user_id: string;
  plan_id: string;
  status: 'active' | 'expired' | 'revoked';
  access_token: string;
  quota_limit: number;
  quota_used: number;
  expires_at: number;
  created_at: number;
}

export interface TalentItem {
  id: string;
  name: string;
  title: string;
  category: string;
  location: string;
  hourlyRate: string;
  dailyRate?: string;
  rating: number;
  completedContracts: number;
  avatar: string;
  bio: string;
  skills: string[];
  languages: string[];
  verified: boolean;
  status: 'active' | 'busy' | 'offline';
  sortOrder: number;
}

export interface InquiryMessage {
  id: string;
  sender: 'user' | 'agent' | 'system';
  senderName?: string;
  text: string;
  timestamp: number;
}

export interface InquiryItem {
  id: string;
  userId: string;
  userEmail: string;
  userName?: string;
  talentId?: string;
  talentName?: string;
  category: string;
  title: string;
  message: string;
  budget?: string;
  expectedDuration?: string;
  preferredChannel: 'in_app' | 'telegram' | 'whatsapp' | 'wechat';
  contactInfo?: string;
  status: 'pending' | 'in_progress' | 'contract_offered' | 'closed';
  messages: InquiryMessage[];
  contractId?: string;
  created_at?: number;
  updated_at?: number;
}

export interface ContractMilestone {
  id: string;
  title: string;
  description: string;
  amount: string;
  status: 'pending' | 'in_progress' | 'completed';
  dueDate?: string;
}

export interface ContractItem {
  id: string;
  contractNo: string;
  userId: string;
  userEmail: string;
  category?: string;
  talentId: string;
  talentName: string;
  inquiryId?: string;
  title: string;
  description: string;
  scopeOfWork: string[];
  terms: string;
  milestones: ContractMilestone[];
  startDate: string;
  endDate: string;
  amount: string;
  currency: 'USDT' | 'USDC';
  paymentStatus: 'unpaid' | 'paid';
  status: 'draft' | 'pending_payment' | 'active' | 'in_progress' | 'review' | 'completed' | 'cancelled';
  orderId?: string;
  created_at?: number;
  updated_at?: number;
}

export function normalizePlan(p: any): PlanDefinition {
  if (!p) return p;
  return {
    id: p.id || p.key || '',
    name: p.name || '',
    category: p.category || 'Basic',
    description: p.description || '',
    price_usd: typeof p.price_usd === 'number' ? p.price_usd : Number(p.priceUsd || 0),
    currency: p.currency || p.tokenSymbol || 'USDT',
    duration_days: p.duration_days ?? (p.durationDays || 30),
    quota_limit: p.quota_limit ?? (p.quota?.bandwidthBytes || (p.quota?.apiCalls ? p.quota.apiCalls * 1024 * 1024 : 50 * 1024 * 1024 * 1024)),
    features: Array.isArray(p.features) ? p.features : [],
    enabled: typeof p.enabled === 'boolean' ? p.enabled : Boolean(p.enabled),
  };
}

export function normalizeOrder(o: any): OrderRecord {
  if (!o) return o;
  const deposit_address = o.deposit_address || o.receiveAddress || o.payment?.receiveAddress || '';
  const expected_amount = o.expected_amount || o.amount || o.payment?.amount || '0';
  const rawExpiresAt = o.expires_at ?? o.expiresAt ?? o.payment?.expiresAt;
  const expires_at = typeof rawExpiresAt === 'number'
    ? rawExpiresAt
    : rawExpiresAt
    ? new Date(rawExpiresAt).getTime()
    : Date.now() + 1800000;

  return {
    id: o.id || o.key || '',
    user_id: o.user_id || o.userId || '',
    plan_id: o.plan_id || o.planId || '',
    chain_id: o.chain_id || o.chainId || 1,
    token_symbol: o.token_symbol || o.tokenSymbol || 'USDT',
    expected_amount: String(expected_amount),
    pay3_order_id: o.pay3_order_id || o.pay3OrderId || '',
    deposit_address,
    status: o.status || 'pending',
    expires_at,
    paid_at: o.paid_at || o.paidAt,
    created_at: o.created_at || o.createdAt || Date.now(),
    updated_at: o.updated_at || o.updatedAt || Date.now(),
  };
}

export function normalizeEntitlement(e: any): EntitlementRecord {
  if (!e) return e;
  return {
    id: e.id || e.key || '',
    user_id: e.user_id || e.userId || '',
    plan_id: e.plan_id || e.planId || '',
    status: e.status || 'active',
    access_token: e.access_token || e.token || '',
    quota_limit: e.quota_limit ?? (e.quota?.bandwidthBytes || 50 * 1024 * 1024 * 1024),
    quota_used: e.quota_used ?? (e.usage?.usedBandwidth || 0),
    expires_at: e.expires_at ?? (e.expireTime || Date.now() + 30 * 24 * 3600 * 1000),
    created_at: e.created_at ?? (e.startTime || Date.now()),
  };
}

class ApiClient {
  private baseUrl = '';

  private getAuthHeader(): Record<string, string> {
    const token = typeof localStorage !== 'undefined' ? localStorage.getItem('gc_token') : null;
    return token ? { Authorization: `Bearer ${token}` } : {};
  }

  private async request<T>(path: string, options: RequestInit = {}): Promise<T> {
    const headers = {
      'Content-Type': 'application/json',
      ...this.getAuthHeader(),
      ...(options.headers as Record<string, string> || {}),
    };

    const res = await fetch(`${this.baseUrl}${path}`, {
      ...options,
      headers,
    });

    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      const errorMsg = (data as any)?.error || (data as any)?.message || `HTTP ${res.status}`;
      throw new Error(errorMsg);
    }

    return data as T;
  }

  // Plans
  async getPlans(): Promise<PlanDefinition[]> {
    const res = await this.request<{ plans: any[] }>('/api/plans');
    return (res.plans || []).map(normalizePlan);
  }

  // Auth (Web3 Only)
  /** @deprecated Email registration is disabled. Use loginWeb3 instead. */
  async requestOtp(email: string): Promise<{ ok: boolean; message?: string }> {
    return this.request<{ ok: boolean; message?: string }>('/api/auth/otp/request', {
      method: 'POST',
      body: JSON.stringify({ email }),
    });
  }

  /** @deprecated Email registration is disabled. Use loginWeb3 instead. */
  async verifyOtp(email: string, code: string): Promise<{ token: string; user: UserProfile }> {
    return this.request<{ token: string; user: UserProfile }>('/api/auth/otp/verify', {
      method: 'POST',
      body: JSON.stringify({ email, code }),
    });
  }

  async loginWeb3(address: string, signature: string, message: string): Promise<{ token: string; user: UserProfile }> {
    const res = await this.request<{ token: string; user: any }>('/api/auth/web3', {
      method: 'POST',
      body: JSON.stringify({ address, signature, message }),
    });
    const addr = res.user.walletAddress || res.user.address || address;
    return {
      token: res.token,
      user: {
        id: res.user.id,
        role: res.user.role || 'user',
        email: res.user.email,
        address: addr,
        walletAddress: addr,
        created_at: res.user.created_at,
      },
    };
  }

  // User Dashboard
  async getUserProfile(): Promise<UserProfile> {
    const res = await this.request<{ user: UserProfile }>('/api/user/profile');
    return res.user;
  }

  async getUserEntitlements(): Promise<EntitlementRecord[]> {
    const res = await this.request<{ entitlements: any[] }>('/api/user/entitlements');
    return (res.entitlements || []).map(normalizeEntitlement);
  }

  // Orders & Payment
  async createOrder(params: { planId: string; chainId?: number; tokenSymbol?: string }): Promise<OrderRecord> {
    const res = await this.request<{ order: any; payment?: any }>('/api/orders', {
      method: 'POST',
      body: JSON.stringify(params),
    });
    const orderData = res.order || res;
    if (res.payment && !orderData.payment) {
      orderData.payment = res.payment;
    }
    return normalizeOrder(orderData);
  }

  async getOrder(orderId: string): Promise<OrderRecord> {
    const res = await this.request<{ order: any }>(`/api/orders/${orderId}`);
    return normalizeOrder(res.order || res);
  }

  async verifyOrder(orderId: string): Promise<{ order: OrderRecord; verified: boolean }> {
    const res = await this.request<{ order: any; verified?: boolean; paid?: boolean }>(`/api/orders/${orderId}/verify`, {
      method: 'POST',
    });
    return {
      order: normalizeOrder(res.order || res),
      verified: Boolean(res.verified || res.paid),
    };
  }

  // Admin
  async getAdminPlans(): Promise<PlanDefinition[]> {
    const res = await this.request<{ plans: any[] }>('/api/admin/plans');
    return (res.plans || []).map(normalizePlan);
  }

  async saveAdminPlan(plan: Partial<PlanDefinition>): Promise<PlanDefinition> {
    const res = await this.request<{ plan: any }>('/api/admin/plans', {
      method: 'POST',
      body: JSON.stringify(plan),
    });
    return normalizePlan(res.plan || res);
  }

  async getAdminOrders(cursor?: string): Promise<{ orders: OrderRecord[]; nextCursor?: string }> {
    const query = cursor ? `?cursor=${encodeURIComponent(cursor)}` : '';
    const res = await this.request<{ orders: any[]; nextCursor?: string }>(`/api/admin/orders${query}`);
    return {
      orders: (res.orders || []).map(normalizeOrder),
      nextCursor: res.nextCursor,
    };
  }

  // ==========================================
  // Talents & Human Staffing Services
  // ==========================================
  async getTalents(category?: string, query?: string): Promise<TalentItem[]> {
    const params = new URLSearchParams();
    if (category && category !== 'all') params.append('category', category);
    if (query) params.append('q', query);
    const qs = params.toString() ? `?${params.toString()}` : '';
    const res = await this.request<{ talents: TalentItem[] }>(`/api/talents${qs}`);
    return res.talents || [];
  }

  async getTalent(id: string): Promise<TalentItem> {
    const res = await this.request<{ talent: TalentItem }>(`/api/talents/${id}`);
    return res.talent;
  }

  // ==========================================
  // Inquiries & Live Customer Consultation
  // ==========================================
  async createInquiry(dto: {
    talentId?: string;
    talentName?: string;
    category?: string;
    title: string;
    message: string;
    budget?: string;
    expectedDuration?: string;
    preferredChannel?: 'in_app' | 'telegram' | 'whatsapp' | 'wechat';
    contactInfo?: string;
  }): Promise<InquiryItem> {
    const res = await this.request<{ inquiry: InquiryItem }>('/api/inquiries', {
      method: 'POST',
      body: JSON.stringify(dto),
    });
    return res.inquiry;
  }

  async getInquiries(status?: string): Promise<InquiryItem[]> {
    const qs = status ? `?status=${encodeURIComponent(status)}` : '';
    const res = await this.request<{ inquiries: InquiryItem[] }>(`/api/inquiries${qs}`);
    return res.inquiries || [];
  }

  async getInquiry(id: string): Promise<InquiryItem> {
    const res = await this.request<{ inquiry: InquiryItem }>(`/api/inquiries/${id}`);
    return res.inquiry;
  }

  async sendInquiryMessage(inquiryId: string, text: string): Promise<InquiryItem> {
    const res = await this.request<{ inquiry: InquiryItem }>(`/api/inquiries/${inquiryId}/messages`, {
      method: 'POST',
      body: JSON.stringify({ text }),
    });
    return res.inquiry;
  }

  // ==========================================
  // Custom Contracts & Crypto Checkout
  // ==========================================
  async getContracts(status?: string): Promise<ContractItem[]> {
    const qs = status ? `?status=${encodeURIComponent(status)}` : '';
    const res = await this.request<{ contracts: ContractItem[] }>(`/api/contracts${qs}`);
    return res.contracts || [];
  }

  async getContract(id: string): Promise<ContractItem> {
    const res = await this.request<{ contract: ContractItem }>(`/api/contracts/${id}`);
    return res.contract;
  }

  async createContract(dto: {
    userId: string;
    userEmail?: string;
    category?: string;
    talentId: string;
    talentName: string;
    inquiryId?: string;
    title: string;
    description: string;
    scopeOfWork: string[];
    terms?: string;
    milestones: Array<{ title: string; description: string; amount: string; dueDate?: string }>;
    startDate?: string;
    endDate?: string;
    amount: string;
    currency?: 'USDT' | 'USDC';
  }): Promise<ContractItem> {
    const res = await this.request<{ contract: ContractItem }>('/api/contracts', {
      method: 'POST',
      body: JSON.stringify(dto),
    });
    return res.contract;
  }

  async checkoutContract(contractId: string): Promise<{ order: OrderRecord; payment: any }> {
    const res = await this.request<{ order: any; payment: any }>(`/api/contracts/${contractId}/checkout`, {
      method: 'POST',
    });
    return {
      order: normalizeOrder(res.order),
      payment: res.payment,
    };
  }

  async verifyContractPayment(contractId: string): Promise<{ contract: ContractItem; paid: boolean }> {
    const res = await this.request<{ contract: ContractItem; paid: boolean }>(`/api/contracts/${contractId}/verify`, {
      method: 'POST',
    });
    return res;
  }

  async updateContractMilestone(contractId: string, index: number, status: string): Promise<ContractItem> {
    const res = await this.request<{ contract: ContractItem }>(`/api/contracts/${contractId}/milestones/${index}`, {
      method: 'POST',
      body: JSON.stringify({ status }),
    });
    return res.contract;
  }

  async completeContract(contractId: string): Promise<ContractItem> {
    const res = await this.request<{ contract: ContractItem }>(`/api/contracts/${contractId}/complete`, {
      method: 'POST',
    });
    return res.contract;
  }
}

export const api = new ApiClient();
