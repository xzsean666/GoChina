import type { DatabaseClient } from '../db/client.js';
import type { Talent, TalentData } from '../types/models.js';

export interface TalentFilterOptions {
  category?: string;
  status?: string;
  query?: string;
  limit?: number;
}

export class TalentService {
  constructor(private db: DatabaseClient) {}

  async listTalents(options: TalentFilterOptions = {}): Promise<Talent[]> {
    const { category, status = 'active', query, limit = 50 } = options;

    let items: Talent[] = [];

    if (category && category !== 'all') {
      const records = await this.db.talents.find({ category, status });
      items = records.map((t) => ({ id: (t as any).key || t.id, ...t }));
    } else {
      const records = await this.db.talents.find({ status });
      items = records.map((t) => ({ id: (t as any).key || t.id, ...t }));
    }

    if (query && query.trim()) {
      const q = query.toLowerCase().trim();
      items = items.filter(
        (t) =>
          t.name.toLowerCase().includes(q) ||
          t.title.toLowerCase().includes(q) ||
          t.location.toLowerCase().includes(q) ||
          t.skills.some((s) => s.toLowerCase().includes(q)) ||
          t.bio.toLowerCase().includes(q)
      );
    }

    // Sort by sortOrder ascending, rating descending
    items.sort((a, b) => {
      if (a.sortOrder !== b.sortOrder) return a.sortOrder - b.sortOrder;
      return (b.rating || 0) - (a.rating || 0);
    });

    return items.slice(0, limit);
  }

  async getTalentById(id: string): Promise<Talent | null> {
    const talent = await this.db.talents.get(id);
    if (!talent) return null;
    return { id, ...talent };
  }

  async createTalent(data: TalentData): Promise<Talent> {
    const id = `tal_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    const category = data.category || 'sourcing';
    const status = data.status || 'active';
    const sortOrder = data.sortOrder || 0;

    const talent: Talent = {
      id,
      ...data,
      created_at: Date.now(),
      updated_at: Date.now(),
    };

    await this.db.talents.set(id, talent, {
      keys: {
        category,
        status,
        sortOrder,
      },
    });
    await this.db.talents.flush();
    return talent;
  }

  async updateTalent(id: string, updates: Partial<TalentData>): Promise<Talent> {
    const existing = await this.getTalentById(id);
    if (!existing) {
      throw new Error(`Talent '${id}' not found`);
    }

    const updated: Talent = {
      ...existing,
      ...updates,
      updated_at: Date.now(),
    };

    await this.db.talents.set(id, updated, {
      keys: {
        category: updated.category,
        status: updated.status,
        sortOrder: updated.sortOrder,
      },
    });
    await this.db.talents.flush();
    return updated;
  }
}
