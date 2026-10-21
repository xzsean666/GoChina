import type { DatabaseClient } from './client.js';
import type { PlanData, TalentData } from '../types/models.js';

export const INITIAL_TALENTS: Array<{ id: string; data: TalentData }> = [
  {
    id: 'tal_master_zhang',
    data: {
      name: 'Master Zhang (张师傅)',
      title: 'Executive Bilingual Chauffeur & Luxury MPV Escort (司机带车)',
      category: 'driver',
      location: 'Shenzhen / Guangzhou / Hong Kong Corridor',
      hourlyRate: '25 USDT/hr',
      dailyRate: '180 USDT/day',
      rating: 4.98,
      completedContracts: 146,
      avatar: 'https://images.unsplash.com/photo-1560250097-0b93528c311a?w=200',
      bio: '12+ years VIP driving experience across Guangdong, Shenzhen, and Hong Kong borders. Drives Toyota Alphard / Buick GL8 Luxury MPV. Fluent in road navigation, business airport transfers, and factory commuting.',
      skills: ['Luxury MPV Included', 'Airport Transfer', 'Factory Route Navigation', 'Cross-Border Travel'],
      languages: ['English (Basic/Conversational)', 'Mandarin (Native)', 'Cantonese (Native)'],
      verified: true,
      status: 'active',
      sortOrder: 1,
    },
  },
  {
    id: 'tal_lily_lin',
    data: {
      name: 'Lily Lin (林导)',
      title: 'Licensed Bilingual Tour Guide & Cultural Companion (私人地陪导游)',
      category: 'guide',
      location: 'Beijing / Shanghai / Xi\'an / Hangzhou',
      hourlyRate: '22 USDT/hr',
      dailyRate: '160 USDT/day',
      rating: 4.97,
      completedContracts: 89,
      avatar: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=200',
      bio: 'Certified National Senior Tour Guide with 8+ years experience guiding foreign executives, delegations, and independent travelers. Tailors custom itineraries, historic cultural spots, and local culinary immersions.',
      skills: ['Cultural Interpretation', 'Custom Itinerary Design', 'VIP Delegation Escort', 'City Walk & Food Tour'],
      languages: ['English (Fluent / TEM-8)', 'Mandarin (Native)'],
      verified: true,
      status: 'active',
      sortOrder: 2,
    },
  },
  {
    id: 'tal_alex_wang',
    data: {
      name: 'Alex Wang (王工)',
      title: 'Full-Stack Edge Engineer & China Tech Specialist (兼职程序员)',
      category: 'tech',
      location: 'Shanghai / Shenzhen / Remote',
      hourlyRate: '45 USDT/hr',
      dailyRate: '320 USDT/day',
      rating: 5.0,
      completedContracts: 42,
      avatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=200',
      bio: 'Senior software architect specialized in Cloudflare Workers, Web3 smart contracts, WeChat Mini-Programs, and cross-border API integration inside the Great Firewall. Fast prototyping and production delivery.',
      skills: ['Cloudflare Workers', 'TypeScript/Vue/Node', 'WeChat Mini-Program', 'ERC20 / Web3'],
      languages: ['English (Fluent)', 'Mandarin (Native)'],
      verified: true,
      status: 'active',
      sortOrder: 3,
    },
  },
  {
    id: 'tal_teacher_chen',
    data: {
      name: 'Teacher Chen (陈老师)',
      title: 'Senior Business Mandarin & HSK Private Tutor (对外中文私教)',
      category: 'chinese_tutor',
      location: 'Beijing / Shanghai / Online Remote',
      hourlyRate: '28 USDT/hr',
      dailyRate: '190 USDT/day',
      rating: 4.99,
      completedContracts: 104,
      avatar: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=200',
      bio: 'Master\'s in Teaching Chinese as a Foreign Language (TCSOL) with 9+ years coaching multinational corporate expats, founders, and diplomatic staff. Specialized in rapid conversational fluency, business etiquette, and HSK 1-6 prep.',
      skills: ['Business Chinese', 'Executive 1-on-1 Coaching', 'HSK Fast-Track Prep', 'Cross-Cultural Etiquette'],
      languages: ['English (Fluent)', 'Mandarin (Native, Level 1-A)', 'French (Conversational)'],
      verified: true,
      status: 'active',
      sortOrder: 4,
    },
  },
  {
    id: 'tal_david_li',
    data: {
      name: 'David Li (李伟)',
      title: 'Senior Electronics & Hardware Factory Auditor (验厂验货专家)',
      category: 'inspection',
      location: 'Shenzhen / Dongguan / Guangzhou',
      hourlyRate: '35 USDT/hr',
      dailyRate: '260 USDT/day',
      rating: 4.96,
      completedContracts: 68,
      avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200',
      bio: '12+ years experience in quality assurance (QA/QC), factory social compliance, ISO9001 verification, and on-site container loading inspection in Guangdong manufacturing hubs.',
      skills: ['Factory Audit', 'PCB & Electronics QC', 'Container Loading', 'Supplier Due Diligence'],
      languages: ['English (Fluent)', 'Mandarin (Native)', 'Cantonese'],
      verified: true,
      status: 'active',
      sortOrder: 5,
    },
  },
  {
    id: 'tal_elena_zhang',
    data: {
      name: 'Elena Zhang (张敏)',
      title: 'Bilingual Trade Negotiator & Canton Fair Companion (商务翻译)',
      category: 'translation',
      location: 'Guangzhou / Yiwu / Shanghai',
      hourlyRate: '30 USDT/hr',
      dailyRate: '220 USDT/day',
      rating: 4.99,
      completedContracts: 94,
      avatar: 'https://images.unsplash.com/photo-1580489944761-15a19d654956?w=200',
      bio: 'Professional business interpreter accompanying foreign buyers across Canton Fair, Yiwu Trade Mart, and direct factory negotiations. Expert in cross-cultural contracts.',
      skills: ['Simultaneous Interpretation', 'Contract Negotiation', 'Canton Fair Escort', 'Spanish & English'],
      languages: ['English (Proficient)', 'Spanish (DELE B2)', 'Mandarin (Native)'],
      verified: true,
      status: 'active',
      sortOrder: 6,
    },
  },
  {
    id: 'tal_sarah_liu',
    data: {
      name: 'Sarah Liu (刘欣)',
      title: 'China Local Concierge & Company Registration Advisor (本地代办)',
      category: 'concierge',
      location: 'Beijing / Shanghai / Shenzhen',
      hourlyRate: '32 USDT/hr',
      dailyRate: '240 USDT/day',
      rating: 4.94,
      completedContracts: 53,
      avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200',
      bio: 'Assists international entrepreneurs with WFOE company formation, trademark registration, local notary documents, banking appointments, and business travel logistics.',
      skills: ['WFOE Registration', 'Legal Document Notary', 'Bank Account Setup', 'VIP Airport Transfer'],
      languages: ['English (Fluent)', 'French (Conversational)', 'Mandarin (Native)'],
      verified: true,
      status: 'active',
      sortOrder: 7,
    },
  },
];

export const INITIAL_PLANS: Array<{ id: string; data: PlanData }> = [
  {
    id: 'plan_starter_monthly',
    data: {
      name: 'Starter Monthly',
      description: 'Ideal for individual developers and testing',
      priceUsd: '15.00',
      tokenAmount: '15.00',
      tokenSymbol: 'USDT',
      durationDays: 30,
      features: ['100,000 API Calls', '10 GB Bandwidth', 'Community Support'],
      quota: {
        apiCalls: 100000,
        bandwidthBytes: 10 * 1024 * 1024 * 1024,
        maxSeats: 1,
      },
      category: 'standard',
      enabled: 1,
      sortOrder: 1,
    },
  },
  {
    id: 'plan_pro_monthly',
    data: {
      name: 'Pro Monthly',
      description: 'For power users and scaling digital services',
      priceUsd: '45.00',
      tokenAmount: '45.00',
      tokenSymbol: 'USDT',
      durationDays: 30,
      features: ['1,000,000 API Calls', '100 GB Bandwidth', 'Priority Edge Routing', '24/7 SLA'],
      quota: {
        apiCalls: 1000000,
        bandwidthBytes: 100 * 1024 * 1024 * 1024,
        maxSeats: 5,
      },
      category: 'pro',
      enabled: 1,
      sortOrder: 2,
    },
  },
  {
    id: 'plan_pro_quarterly',
    data: {
      name: 'Professional Edge',
      description: 'High-throughput enterprise pipeline with priority routing (Save 15%)',
      priceUsd: '99.00',
      tokenAmount: '99.00',
      tokenSymbol: 'USDT',
      durationDays: 90,
      features: ['2,500,000 API Calls', '250 GB Bandwidth', 'Priority Edge Routing', 'VIP Support'],
      quota: {
        apiCalls: 2500000,
        bandwidthBytes: 250 * 1024 * 1024 * 1024,
        maxSeats: 10,
      },
      category: 'pro',
      enabled: 1,
      sortOrder: 3,
    },
  },
  {
    id: 'plan_enterprise_yearly',
    data: {
      name: 'Enterprise Annual',
      description: 'Unlimited dedicated scale and custom SLAs',
      priceUsd: '450.00',
      tokenAmount: '450.00',
      tokenSymbol: 'USDT',
      durationDays: 365,
      features: ['Unlimited API Calls', '1 TB Bandwidth', 'Dedicated HD Account', 'Custom Contract'],
      quota: {
        apiCalls: 20000000,
        bandwidthBytes: 1024 * 1024 * 1024 * 1024,
        maxSeats: 50,
      },
      category: 'enterprise',
      enabled: 1,
      sortOrder: 4,
    },
  },
];

export async function seedDatabase(db: DatabaseClient): Promise<void> {
  await db.init();
  for (const plan of INITIAL_PLANS) {
    const existing = await db.plans.get(plan.id);
    if (!existing) {
      await db.plans.set(plan.id, plan.data, {
        keys: {
          category: plan.data.category,
          enabled: plan.data.enabled,
          sortOrder: plan.data.sortOrder,
        },
      });
    }
  }
  await db.plans.flush();

  // Seed default administrator
  const adminEmail = 'admin@gochina.io';
  const adminWallet = '0x70997970c51812dc3a010c7d01b50e0d17dc79c8';
  const existingAdmin = await db.users.getBy('email', adminEmail);
  if (!existingAdmin) {
    await db.users.set('usr_admin_default', {
      email: adminEmail,
      walletAddress: adminWallet,
      name: 'System Admin',
      role: 'admin',
      status: 'active',
    }, {
      keys: {
        email: adminEmail,
        walletAddress: adminWallet,
        role: 'admin',
        status: 'active',
      },
    });
    await db.users.flush();
  }

  // Seed Talents
  for (const talent of INITIAL_TALENTS) {
    const existing = await db.talents.get(talent.id);
    if (!existing) {
      await db.talents.set(talent.id, talent.data, {
        keys: {
          category: talent.data.category,
          status: talent.data.status,
          sortOrder: talent.data.sortOrder,
        },
      });
    }
  }
  await db.talents.flush();
}
