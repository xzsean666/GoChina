export type UserRole = 'user' | 'admin';
export type UserStatus = 'active' | 'suspended';

export interface UserData {
  email: string;
  name?: string;
  avatar?: string;
  walletAddress?: string;
  role: UserRole;
  status: UserStatus;
  preferences?: Record<string, unknown>;
}

export type UserKeys = {
  email: string;
  walletAddress?: string;
  role: string;
  status: string;
};

export interface User extends UserData {
  id: string;
  created_at?: number;
  updated_at?: number;
}

export interface PlanData {
  name: string;
  description: string;
  priceUsd: string;
  tokenAmount: string;
  tokenSymbol: string;
  durationDays: number;
  features: string[];
  quota: {
    apiCalls?: number;
    bandwidthBytes?: number;
    maxSeats?: number;
  };
  category: string;
  enabled: number; // 1 = true, 0 = false
  sortOrder: number;
}

export type PlanKeys = {
  category: string;
  enabled: number;
  sortOrder: number;
};

export interface Plan extends PlanData {
  id: string;
  created_at?: number;
  updated_at?: number;
}

export type OrderStatus = 'pending' | 'partial' | 'confirming' | 'paid' | 'expired' | 'failed';

export interface OrderData {
  externalId: string;
  pay3OrderId: string;
  userId: string;
  planId?: string;
  contractId?: string;
  orderType?: 'plan' | 'contract';
  amount: string;
  paidAmount?: string;
  tokenSymbol: string;
  tokenAddress?: string;
  chainId: number;
  receiveAddress: string;
  status: OrderStatus;
  expiresAt: string;
  txHash?: string;
  metadata?: Record<string, unknown>;
}

export type OrderKeys = {
  externalId: string;
  pay3OrderId: string;
  userId: string;
  status: string;
  receiveAddress: string;
  contractId?: string;
};

export interface Order extends OrderData {
  id: string;
  created_at?: number;
  updated_at?: number;
}

export type EntitlementStatus = 'active' | 'expired' | 'revoked';

export interface EntitlementData {
  token: string;
  userId: string;
  planId: string;
  orderId: string;
  status: EntitlementStatus;
  startTime: number;
  expireTime: number;
  quota: {
    apiCalls?: number;
    bandwidthBytes?: number;
  };
  usage: {
    usedCalls: number;
    usedBandwidth: number;
  };
  metadata?: Record<string, unknown>;
}

export type EntitlementKeys = {
  token: string;
  userId: string;
  planId: string;
  status: string;
  expireTime: number;
};

export interface Entitlement extends EntitlementData {
  id: string;
  created_at?: number;
  updated_at?: number;
}

// ==========================================
// Talent & Human Services Models
// ==========================================

export type TalentCategory =
  | 'driver'
  | 'guide'
  | 'tech'
  | 'chinese_tutor'
  | 'translation'
  | 'inspection'
  | 'sourcing'
  | 'concierge'
  | 'legal'
  | 'custom'
  | string;

export interface TalentData {
  name: string;
  title: string;
  category: TalentCategory | string;
  location: string;
  hourlyRate: string; // e.g. "25 USDT/hr" or "200 USDT/day"
  dailyRate?: string;
  rating: number; // e.g. 4.95
  completedContracts: number;
  avatar: string;
  bio: string;
  skills: string[];
  languages: string[];
  verified: boolean;
  status: 'active' | 'busy' | 'offline';
  sortOrder: number;
  metadata?: Record<string, unknown>;
}

export type TalentKeys = {
  category: string;
  status: string;
  sortOrder: number;
};

export interface Talent extends TalentData {
  id: string;
  created_at?: number;
  updated_at?: number;
}

// ==========================================
// Customer Inquiry & Communication Models
// ==========================================

export interface InquiryMessage {
  id: string;
  sender: 'user' | 'agent' | 'system';
  senderName?: string;
  text: string;
  timestamp: number;
}

export type InquiryStatus = 'pending' | 'in_progress' | 'contract_offered' | 'closed';

export interface InquiryData {
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
  status: InquiryStatus;
  messages: InquiryMessage[];
  contractId?: string;
  metadata?: Record<string, unknown>;
}

export type InquiryKeys = {
  userId: string;
  status: string;
  category: string;
};

export interface Inquiry extends InquiryData {
  id: string;
  created_at?: number;
  updated_at?: number;
}

// ==========================================
// Custom Human Service Contract Models
// ==========================================

export type ContractStatus =
  | 'draft'
  | 'pending_payment'
  | 'active'
  | 'in_progress'
  | 'review'
  | 'completed'
  | 'cancelled';

export interface ContractMilestone {
  id: string;
  title: string;
  description: string;
  amount: string;
  status: 'pending' | 'in_progress' | 'completed';
  dueDate?: string;
}

export interface ContractData {
  contractNo: string; // e.g. "CTR-20261021-9982"
  userId: string;
  userEmail: string;
  category?: string; // Talent category: driver, guide, tech, chinese_tutor, etc.
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
  status: ContractStatus;
  orderId?: string;
  metadata?: Record<string, unknown>;
}

export type ContractKeys = {
  userId: string;
  talentId: string;
  status: string;
  contractNo: string;
  orderId?: string;
};

export interface Contract extends ContractData {
  id: string;
  created_at?: number;
  updated_at?: number;
}
