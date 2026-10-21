import { describe, it, expect, beforeEach } from 'vitest';
import { createDatabase, type DatabaseClient } from '../src/db/client.js';
import { TalentService } from '../src/services/talent.js';
import { InquiryService } from '../src/services/inquiry.js';
import { ContractService } from '../src/services/contract.js';
import { VerificationService } from '../src/services/verification.js';
import { EntitlementService } from '../src/services/entitlement.js';
import { Pay3Client } from '../src/pay3/client.js';
import { MockPay3Server } from './mocks/pay3.mock.js';
import { createMockEnv, createMockExecutionContext } from './setup.js';

describe('Talent & Human Service Contracts Full Suite', () => {
  let db: DatabaseClient;
  let talentService: TalentService;
  let inquiryService: InquiryService;
  let contractService: ContractService;
  let verificationService: VerificationService;
  let mockPay3Server: MockPay3Server;
  let pay3Client: Pay3Client;
  let mockEnv: ReturnType<typeof createMockEnv>;

  beforeEach(async () => {
    mockEnv = createMockEnv();
    const ctx = createMockExecutionContext();
    db = createDatabase(mockEnv, ctx);
    await db.init();

    mockPay3Server = new MockPay3Server(mockEnv.PAY3_JWT_SECRET);
    pay3Client = new Pay3Client({
      baseUrl: mockEnv.PAY3_BASE_URL,
      jwtSecret: mockEnv.PAY3_JWT_SECRET,
      fetchFn: mockPay3Server.createFetch(),
    });

    talentService = new TalentService(db);
    inquiryService = new InquiryService(db);
    contractService = new ContractService(db, pay3Client);
    const entitlementService = new EntitlementService(db);
    verificationService = new VerificationService(db, pay3Client, entitlementService);
  });

  it('creates and lists talents with categories and search filtering', async () => {
    const talent1 = await talentService.createTalent({
      name: 'Li Wei (David)',
      title: 'South China Supply Chain & Factory Auditor',
      category: 'inspection',
      location: 'Guangzhou / Shenzhen',
      hourlyRate: '35 USDT/hr',
      dailyRate: '250 USDT/day',
      rating: 4.95,
      completedContracts: 42,
      avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150',
      bio: 'Over 10 years experience in electronics & hardware factory inspection.',
      skills: ['Factory Audit', 'Quality Control', 'Supplier Verification'],
      languages: ['Chinese', 'English'],
      verified: true,
      status: 'active',
      sortOrder: 1,
    });

    const talent2 = await talentService.createTalent({
      name: 'Elena Zhang',
      title: 'Canton Fair & Business Interpreter',
      category: 'translation',
      location: 'Guangzhou / Yiwu',
      hourlyRate: '30 USDT/hr',
      dailyRate: '200 USDT/day',
      rating: 4.98,
      completedContracts: 58,
      avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150',
      bio: 'Bilingual specialist in trade negotiation and Canton Fair accompaniment.',
      skills: ['English Translation', 'Spanish', 'Trade Negotiation'],
      languages: ['Chinese', 'English', 'Spanish'],
      verified: true,
      status: 'active',
      sortOrder: 2,
    });

    expect(talent1.id).toBeDefined();
    expect(talent2.id).toBeDefined();

    // Query by category
    const inspectionTalents = await talentService.listTalents({ category: 'inspection' });
    expect(inspectionTalents.length).toBe(1);
    expect(inspectionTalents[0].name).toContain('David');

    // Query with search
    const searchResults = await talentService.listTalents({ query: 'Canton' });
    expect(searchResults.length).toBe(1);
    expect(searchResults[0].name).toContain('Elena');
  });

  it('manages inquiry lifecycle and back-and-forth messages', async () => {
    const inquiry = await inquiryService.createInquiry({
      userId: 'usr_buyer_1',
      userEmail: 'buyer@globalcorp.com',
      userName: 'Buyer Corp',
      category: 'inspection',
      title: 'Need 3 days factory inspection in Dongguan',
      message: 'We require a physical inspection of PCB supplier factories in Dongguan next week.',
      budget: '800 USDT',
      expectedDuration: '3 days',
      preferredChannel: 'in_app',
    });

    expect(inquiry.id).toBeDefined();
    expect(inquiry.status).toBe('pending');
    expect(inquiry.messages.length).toBe(1);

    // Agent replies
    const updated = await inquiryService.addMessage(
      inquiry.id,
      'agent',
      'Hello! We can arrange David Li for this assignment. He is based in Guangzhou and can travel to Dongguan easily.'
    );

    expect(updated.messages.length).toBe(2);
    expect(updated.status).toBe('in_progress');

    // User replies
    const userUpdated = await inquiryService.addMessage(
      inquiry.id,
      'user',
      'Sounds great, please prepare the contract for 3 days.',
      'Buyer Corp',
      'usr_buyer_1'
    );

    expect(userUpdated.messages.length).toBe(3);
  });

  it('completes the entire contract lifecycle: creation -> checkout -> payment -> completion', async () => {
    // 1. Agent drafts a contract for the user
    const contract = await contractService.createContract({
      userId: 'usr_buyer_1',
      userEmail: 'buyer@globalcorp.com',
      talentId: 'tal_david_li',
      talentName: 'Li Wei (David)',
      title: 'Dongguan PCB Factory 3-Day Inspection & On-site Audit Contract',
      description: 'Comprehensive quality control, component testing, and video inspection report.',
      scopeOfWork: [
        'Day 1: Facility audit and manufacturing process validation',
        'Day 2: PCB sample stress testing and defect analysis',
        'Day 3: Final exit inspection, packaging review, and executive report',
      ],
      milestones: [
        {
          title: 'Milestone 1: Preliminary On-site Audit & Day 1 Report',
          description: 'Factory check-in and facility verification document',
          amount: '400',
        },
        {
          title: 'Milestone 2: Final Inspection Report & Video Evidence',
          description: 'Full audit dossier signed by QA supervisor',
          amount: '400',
        },
      ],
      startDate: '2026-10-25',
      endDate: '2026-10-28',
      amount: '800.00',
      currency: 'USDT',
    });

    expect(contract.id).toBeDefined();
    expect(contract.status).toBe('pending_payment');
    expect(contract.paymentStatus).toBe('unpaid');
    expect(contract.milestones.length).toBe(2);

    // 2. User initiates checkout
    const checkout = await contractService.createContractCheckout(contract.id, 'usr_buyer_1');
    expect(checkout.order.id).toBeDefined();
    expect(checkout.payment.receiveAddress).toMatch(/^0x[0-9a-f]{40}$/i);
    expect(checkout.payment.amount).toBe('800.00');

    // 3. User verifies payment (triggers verification through Pay3 /verify endpoint)
    const verifyRes = await verificationService.verifyOrderInstant(checkout.order.id, 'usr_buyer_1');
    expect(verifyRes.paid).toBe(true);

    // Contract should now be active
    const activeContract = await contractService.getContractById(contract.id, 'usr_buyer_1');
    expect(activeContract?.paymentStatus).toBe('paid');
    expect(activeContract?.status).toBe('active');

    // 4. Update milestones
    const msUpdated = await contractService.updateMilestone(
      contract.id,
      0,
      'completed',
      'usr_buyer_1',
      true
    );
    expect(msUpdated.milestones[0].status).toBe('completed');

    // 5. User accepts final deliverables and marks contract complete
    const finished = await contractService.completeContract(contract.id, 'usr_buyer_1');
    expect(finished.status).toBe('completed');
  });
});
