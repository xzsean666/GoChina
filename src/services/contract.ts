import type { DatabaseClient } from '../db/client.js';
import type { Pay3Client } from '../pay3/client.js';
import type { Contract, ContractData, ContractMilestone, ContractStatus, OrderData } from '../types/models.js';
import type { CheckoutResult } from './types.js';

export interface CreateContractDto {
  userId: string;
  userEmail: string;
  category?: string;
  talentId: string;
  talentName: string;
  inquiryId?: string;
  title: string;
  description: string;
  scopeOfWork: string[];
  terms?: string;
  milestones: Array<{
    title: string;
    description: string;
    amount: string;
    dueDate?: string;
  }>;
  startDate: string;
  endDate: string;
  amount: string;
  currency?: 'USDT' | 'USDC';
}

export class ContractService {
  constructor(
    private db: DatabaseClient,
    private pay3Client: Pay3Client
  ) {}

  async createContract(dto: CreateContractDto): Promise<Contract> {
    const id = `ctr_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    const dateStr = new Date().toISOString().slice(0, 10).replace(/-/g, '');
    const contractNo = `CTR-${dateStr}-${Math.floor(1000 + Math.random() * 9000)}`;

    const milestones: ContractMilestone[] = (dto.milestones || []).map((m, idx) => ({
      id: `ms_${idx + 1}`,
      title: m.title,
      description: m.description,
      amount: m.amount,
      status: 'pending',
      dueDate: m.dueDate,
    }));

    const contract: Contract = {
      id,
      contractNo,
      userId: dto.userId,
      userEmail: dto.userEmail,
      category: dto.category || 'custom',
      talentId: dto.talentId,
      talentName: dto.talentName,
      inquiryId: dto.inquiryId,
      title: dto.title,
      description: dto.description,
      scopeOfWork: dto.scopeOfWork || [],
      terms:
        dto.terms ||
        'Standard GoChina On-Demand Escrow & Deliverable Terms: Payment is held in secure smart escrow until deliverable review and milestone completion.',
      milestones,
      startDate: dto.startDate,
      endDate: dto.endDate,
      amount: dto.amount,
      currency: dto.currency || 'USDT',
      paymentStatus: 'unpaid',
      status: 'pending_payment',
      created_at: Date.now(),
      updated_at: Date.now(),
    };

    await this.db.contracts.set(id, contract, {
      keys: {
        userId: dto.userId,
        talentId: dto.talentId,
        status: 'pending_payment',
        contractNo,
      },
    });
    await this.db.contracts.flush();

    // If linked to an inquiry, update the inquiry status
    if (dto.inquiryId) {
      const inq = await this.db.inquiries.get(dto.inquiryId);
      if (inq) {
        const updatedInq = {
          ...inq,
          status: 'contract_offered' as const,
          contractId: id,
          updated_at: Date.now(),
        };
        await this.db.inquiries.set(dto.inquiryId, updatedInq, {
          keys: {
            userId: inq.userId,
            status: 'contract_offered',
            category: inq.category,
          },
        });
        await this.db.inquiries.flush();
      }
    }

    return contract;
  }

  async getContractById(id: string, userId?: string, isAdmin = false): Promise<Contract | null> {
    const item = await this.db.contracts.get(id);
    if (!item) return null;
    if (!isAdmin && userId && item.userId !== userId) {
      throw new Error('Unauthorized contract access');
    }
    return { id, ...item };
  }

  async listContracts(userId?: string, status?: string, isAdmin = false): Promise<Contract[]> {
    let records: ContractData[] = [];

    if (userId && !isAdmin) {
      if (status) {
        records = await this.db.contracts.find({ userId, status });
      } else {
        records = await this.db.contracts.find({ userId });
      }
    } else {
      if (status) {
        records = await this.db.contracts.find({ status });
      } else {
        records = await this.db.contracts.find({});
      }
    }

    const items: Contract[] = records.map((r) => ({
      id: (r as any).key || (r as any).id,
      ...r,
    }));

    items.sort((a, b) => (b.created_at || 0) - (a.created_at || 0));
    return items;
  }

  async createContractCheckout(contractId: string, userId: string): Promise<CheckoutResult> {
    const contract = await this.getContractById(contractId, userId, false);
    if (!contract) {
      throw new Error(`Contract '${contractId}' not found`);
    }

    if (contract.paymentStatus === 'paid') {
      throw new Error('Contract has already been paid and activated');
    }

    // Check for existing pending order for this contract
    const pendingOrders = await this.db.orders.find({
      userId,
      status: 'pending',
    });

    const now = Date.now();
    const existingOrder = pendingOrders.find((ord) => {
      if (ord.contractId !== contractId) return false;
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

    const orderId = `ord_ctr_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    const externalId = `ord_ctr_gochina_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;

    const pay3Res = await this.pay3Client.createOrder({
      externalId,
      amount: contract.amount,
      ttlSeconds: 7200,
      metadata: {
        userId,
        contractId,
        orderId,
        contractNo: contract.contractNo,
      },
    });

    const orderData: OrderData = {
      externalId: pay3Res.external_id,
      pay3OrderId: pay3Res.id,
      userId,
      contractId,
      orderType: 'contract',
      amount: contract.amount,
      tokenSymbol: pay3Res.payment.token_symbol,
      tokenAddress: pay3Res.payment.token_address,
      chainId: pay3Res.payment.chain_id,
      receiveAddress: pay3Res.payment.receive_address,
      status: 'pending',
      expiresAt: pay3Res.payment.expires_at,
      metadata: {
        contractId,
        contractNo: contract.contractNo,
        title: contract.title,
      },
    };

    await this.db.orders.set(orderId, orderData, {
      keys: {
        externalId: pay3Res.external_id,
        pay3OrderId: pay3Res.id,
        userId,
        status: 'pending',
        receiveAddress: pay3Res.payment.receive_address,
        contractId,
      },
    });
    await this.db.orders.flush();

    // Link order to contract
    const updatedContract: Contract = {
      ...contract,
      orderId,
      updated_at: Date.now(),
    };

    await this.db.contracts.set(contractId, updatedContract, {
      keys: {
        userId: contract.userId,
        talentId: contract.talentId,
        status: contract.status,
        contractNo: contract.contractNo,
        orderId,
      },
    });
    await this.db.contracts.flush();

    return {
      order: {
        id: orderId,
        ...orderData,
      },
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

  async markContractPaid(contractId: string, orderId?: string): Promise<Contract> {
    const contract = await this.getContractById(contractId, undefined, true);
    if (!contract) {
      throw new Error(`Contract '${contractId}' not found`);
    }

    const updated: Contract = {
      ...contract,
      paymentStatus: 'paid',
      status: 'active',
      orderId: orderId || contract.orderId,
      updated_at: Date.now(),
    };

    await this.db.contracts.set(contractId, updated, {
      keys: {
        userId: updated.userId,
        talentId: updated.talentId,
        status: 'active',
        contractNo: updated.contractNo,
        orderId: updated.orderId,
      },
    });
    await this.db.contracts.flush();
    return updated;
  }

  async updateMilestone(
    contractId: string,
    milestoneIndex: number,
    status: 'pending' | 'in_progress' | 'completed',
    userId?: string,
    isAdmin = false
  ): Promise<Contract> {
    const contract = await this.getContractById(contractId, userId, isAdmin);
    if (!contract) {
      throw new Error(`Contract '${contractId}' not found`);
    }

    if (!contract.milestones || !contract.milestones[milestoneIndex]) {
      throw new Error(`Milestone at index ${milestoneIndex} does not exist`);
    }

    const updatedMilestones = [...contract.milestones];
    updatedMilestones[milestoneIndex] = {
      ...updatedMilestones[milestoneIndex],
      status,
    };

    const allCompleted = updatedMilestones.every((m) => m.status === 'completed');
    const nextContractStatus: ContractStatus = allCompleted ? 'review' : 'in_progress';

    const updated: Contract = {
      ...contract,
      status: contract.status === 'active' ? nextContractStatus : contract.status,
      milestones: updatedMilestones,
      updated_at: Date.now(),
    };

    await this.db.contracts.set(contractId, updated, {
      keys: {
        userId: updated.userId,
        talentId: updated.talentId,
        status: updated.status,
        contractNo: updated.contractNo,
        orderId: updated.orderId,
      },
    });
    await this.db.contracts.flush();
    return updated;
  }

  async completeContract(contractId: string, userId: string): Promise<Contract> {
    const contract = await this.getContractById(contractId, userId, false);
    if (!contract) {
      throw new Error(`Contract '${contractId}' not found`);
    }

    const updated: Contract = {
      ...contract,
      status: 'completed',
      updated_at: Date.now(),
    };

    await this.db.contracts.set(contractId, updated, {
      keys: {
        userId: updated.userId,
        talentId: updated.talentId,
        status: 'completed',
        contractNo: updated.contractNo,
        orderId: updated.orderId,
      },
    });
    await this.db.contracts.flush();
    return updated;
  }
}
