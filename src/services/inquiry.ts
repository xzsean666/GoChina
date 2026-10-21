import type { DatabaseClient } from '../db/client.js';
import type { Inquiry, InquiryData, InquiryMessage, InquiryStatus } from '../types/models.js';

export interface CreateInquiryDto {
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
  preferredChannel?: 'in_app' | 'telegram' | 'whatsapp' | 'wechat';
  contactInfo?: string;
}

export class InquiryService {
  constructor(private db: DatabaseClient) {}

  async createInquiry(dto: CreateInquiryDto): Promise<Inquiry> {
    const id = `inq_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    const now = Date.now();

    const initialMessage: InquiryMessage = {
      id: `msg_${now}_init`,
      sender: 'user',
      senderName: dto.userName || dto.userEmail,
      text: dto.message,
      timestamp: now,
    };

    const inquiry: Inquiry = {
      id,
      userId: dto.userId,
      userEmail: dto.userEmail,
      userName: dto.userName,
      talentId: dto.talentId,
      talentName: dto.talentName,
      category: dto.category,
      title: dto.title,
      message: dto.message,
      budget: dto.budget,
      expectedDuration: dto.expectedDuration,
      preferredChannel: dto.preferredChannel || 'in_app',
      contactInfo: dto.contactInfo,
      status: 'pending',
      messages: [initialMessage],
      created_at: now,
      updated_at: now,
    };

    await this.db.inquiries.set(id, inquiry, {
      keys: {
        userId: dto.userId,
        status: 'pending',
        category: dto.category,
      },
    });
    await this.db.inquiries.flush();
    return inquiry;
  }

  async getInquiryById(id: string, userId?: string, isAdmin = false): Promise<Inquiry | null> {
    const item = await this.db.inquiries.get(id);
    if (!item) return null;
    if (!isAdmin && userId && item.userId !== userId) {
      throw new Error('Unauthorized inquiry access');
    }
    return { id, ...item };
  }

  async listInquiries(userId?: string, status?: string, isAdmin = false): Promise<Inquiry[]> {
    let records: InquiryData[] = [];

    if (userId && !isAdmin) {
      if (status) {
        records = await this.db.inquiries.find({ userId, status });
      } else {
        records = await this.db.inquiries.find({ userId });
      }
    } else {
      if (status) {
        records = await this.db.inquiries.find({ status });
      } else {
        records = await this.db.inquiries.find({});
      }
    }

    const items: Inquiry[] = records.map((r) => ({
      id: (r as any).key || (r as any).id,
      ...r,
    }));

    // Sort by updated_at descending
    items.sort((a, b) => (b.updated_at || 0) - (a.updated_at || 0));
    return items;
  }

  async addMessage(
    inquiryId: string,
    sender: 'user' | 'agent' | 'system',
    text: string,
    senderName?: string,
    currentUserId?: string,
    isAdmin = false
  ): Promise<Inquiry> {
    const inquiry = await this.getInquiryById(inquiryId, currentUserId, isAdmin);
    if (!inquiry) {
      throw new Error(`Inquiry '${inquiryId}' not found`);
    }

    const msg: InquiryMessage = {
      id: `msg_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      sender,
      senderName: senderName || (sender === 'agent' ? 'GoChina Support' : 'Customer'),
      text,
      timestamp: Date.now(),
    };

    const nextStatus: InquiryStatus =
      sender === 'agent' && inquiry.status === 'pending'
        ? 'in_progress'
        : inquiry.status;

    const updated: Inquiry = {
      ...inquiry,
      status: nextStatus,
      messages: [...(inquiry.messages || []), msg],
      updated_at: Date.now(),
    };

    await this.db.inquiries.set(inquiryId, updated, {
      keys: {
        userId: updated.userId,
        status: updated.status,
        category: updated.category,
      },
    });
    await this.db.inquiries.flush();
    return updated;
  }

  async updateStatus(
    inquiryId: string,
    status: InquiryStatus,
    contractId?: string
  ): Promise<Inquiry> {
    const inquiry = await this.getInquiryById(inquiryId, undefined, true);
    if (!inquiry) {
      throw new Error(`Inquiry '${inquiryId}' not found`);
    }

    const updated: Inquiry = {
      ...inquiry,
      status,
      contractId: contractId || inquiry.contractId,
      updated_at: Date.now(),
    };

    await this.db.inquiries.set(inquiryId, updated, {
      keys: {
        userId: updated.userId,
        status: updated.status,
        category: updated.category,
      },
    });
    await this.db.inquiries.flush();
    return updated;
  }
}
