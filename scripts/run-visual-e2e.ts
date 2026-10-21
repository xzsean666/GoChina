import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import puppeteer from 'puppeteer-core';
import { privateKeyToAccount } from 'viem/accounts';
import worker from '../src/index.js';
import { seedDatabase } from '../src/db/seed.js';
import { createDatabase } from '../src/db/client.js';
import { AuthService } from '../src/services/auth.js';
import { MockPay3Server } from '../test/mocks/pay3.mock.js';
import { createMockEnv, createMockExecutionContext } from '../test/setup.js';

const mockAccount = privateKeyToAccount('0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80');
const PORT = 5173;
const SCREENSHOT_DIR = path.resolve(process.cwd(), 'docs/screenshots');

const MIME_TYPES: Record<string, string> = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.json': 'application/json; charset=utf-8',
  '.woff2': 'font/woff2',
};

async function main() {
  console.log('🚀 Initializing GoChina Talent & Contract Visual E2E Environment...');

  if (!fs.existsSync(SCREENSHOT_DIR)) {
    fs.mkdirSync(SCREENSHOT_DIR, { recursive: true });
  }

  // 1. Initialize mock D1 and KVDB
  const env = createMockEnv();
  const ctx = createMockExecutionContext();
  const db = createDatabase(env, ctx);
  await db.init();
  await seedDatabase(db);
  console.log('✅ In-memory D1 & KVDB seeded with talents and admin successfully.');

  const authService = new AuthService(db, env.CACHE_KV, {
    jwtSecret: env.PORTAL_JWT_SECRET,
    environment: env.ENVIRONMENT,
  });

  const adminUser = {
    id: 'usr_admin_default',
    email: 'admin@gochina.io',
    role: 'admin' as const,
  };
  await db.users.set(adminUser.id, {
    email: adminUser.email,
    walletAddress: '0x0000000000000000000000000000000000000001',
    role: 'admin',
    status: 'active',
  }, {
    keys: {
      email: adminUser.email,
      role: 'admin',
      status: 'active',
    },
  });
  await db.users.flush();
  const adminToken = await authService.issueSessionToken(adminUser);

  const clientUser = {
    id: 'usr_client_e2e',
    email: `${mockAccount.address.slice(0, 8)}@wallet.gochina.io`,
    address: mockAccount.address,
    walletAddress: mockAccount.address,
    role: 'user' as const,
  };
  await db.users.set(clientUser.id, {
    email: clientUser.email,
    walletAddress: mockAccount.address,
    role: 'user',
    status: 'active',
  }, {
    keys: {
      email: clientUser.email,
      walletAddress: mockAccount.address,
      role: 'user',
      status: 'active',
    },
  });
  await db.users.flush();
  const clientToken = await authService.issueSessionToken(clientUser);

  // 2. Initialize Pay3 mock server
  const mockPay3Server = new MockPay3Server(env.PAY3_JWT_SECRET);
  const mockFetch = mockPay3Server.createFetch();
  const originalFetch = globalThis.fetch;
  globalThis.fetch = async (input, init) => {
    const url = typeof input === 'string' ? input : input instanceof Request ? input.url : input.toString();
    if (url.startsWith('http://127.0.0.1:8080') || url.startsWith('http://pay3.internal')) {
      return await mockFetch(input, init);
    }
    return await originalFetch(input, init);
  };
  console.log('✅ Pay3 mock daemon online.');

  // 3. HTTP server serving frontend/dist and Worker /api endpoints
  const distDir = path.resolve(process.cwd(), 'frontend/dist');
  const server = http.createServer(async (req, res) => {
    const parsedUrl = new URL(req.url || '/', `http://127.0.0.1:${PORT}`);
    const pathname = parsedUrl.pathname;

    if (pathname.startsWith('/api')) {
      try {
        const bodyChunks: Buffer[] = [];
        for await (const chunk of req) {
          bodyChunks.push(Buffer.from(chunk));
        }
        const body = bodyChunks.length > 0 && req.method !== 'GET' && req.method !== 'HEAD'
          ? Buffer.concat(bodyChunks)
          : undefined;

        const webHeaders = new Headers();
        for (const [k, v] of Object.entries(req.headers)) {
          if (v) {
            if (Array.isArray(v)) {
              for (const val of v) webHeaders.append(k, val);
            } else {
              webHeaders.set(k, v);
            }
          }
        }

        const webReq = new Request(`http://127.0.0.1:${PORT}${req.url}`, {
          method: req.method,
          headers: webHeaders,
          body,
        });

        const workerRes = await worker.fetch(webReq, env, ctx);
        console.log(`[API ${req.method} ${pathname}] -> Status ${workerRes.status}`);

        res.statusCode = workerRes.status;
        workerRes.headers.forEach((val, key) => {
          res.setHeader(key, val);
        });

        const resBuffer = await workerRes.arrayBuffer();
        res.end(Buffer.from(resBuffer));
      } catch (err: any) {
        console.error('Worker request error:', err);
        res.statusCode = 500;
        res.end(JSON.stringify({ error: err.message }));
      }
      return;
    }

    let filePath = path.join(distDir, pathname);
    if (!fs.existsSync(filePath) || fs.statSync(filePath).isDirectory()) {
      filePath = path.join(distDir, 'index.html');
    }

    const ext = path.extname(filePath);
    const mime = MIME_TYPES[ext] || 'application/octet-stream';
    res.setHeader('Content-Type', mime);
    res.end(fs.readFileSync(filePath));
  });

  await new Promise<void>((resolve) => server.listen(PORT, resolve));
  console.log(`✅ Test server running on http://127.0.0.1:${PORT}`);

  // 4. Launch headless Chrome browser
  console.log('🌐 Launching Headless Chrome Browser...');
  const browser = await puppeteer.launch({
    executablePath: '/usr/bin/google-chrome',
    headless: true,
    args: [
      '--no-sandbox',
      '--disable-setuid-sandbox',
      '--disable-dev-shm-usage',
      '--disable-gpu',
      '--hide-scrollbars',
    ],
    defaultViewport: {
      width: 1440,
      height: 900,
      deviceScaleFactor: 2,
    },
  });

  const page = await browser.newPage();
  page.on('console', (msg) => {
    console.log('BROWSER LOG:', msg.type(), msg.text());
  });
  page.on('pageerror', (err) => {
    console.error('BROWSER ERROR:', err.message);
  });

  await page.exposeFunction('mockSignMessage', async (msg: string) => {
    return await mockAccount.signMessage({ message: msg });
  });

  // Inject mock Web3 wallet provider with valid ECDSA signatures
  await page.evaluateOnNewDocument(`
    (function() {
      window.__name = function(fn) { return fn; };
      var mockAddress = '${mockAccount.address}';
      window.ethereum = {
        isMetaMask: true,
        request: function(args) {
          var method = args ? args.method : '';
          if (method === 'eth_requestAccounts' || method === 'eth_accounts') {
            return Promise.resolve([mockAddress]);
          }
          if (method === 'personal_sign') {
            var msg = args.params ? (args.params[0].startsWith('0x') ? args.params[1] : args.params[0]) : '';
            return window.mockSignMessage(msg);
          }
          return Promise.resolve(null);
        }
      };
    })();
  `);

  async function takeScreenshot(name: string, title: string) {
    const fullPath = path.join(SCREENSHOT_DIR, name);
    await page.screenshot({ path: fullPath, fullPage: false });
    console.log(`📸 [${name}] Captured: ${title}`);
  }

  try {
    // -------------------------------------------------------------
    // SCENARIO 1: Landing Page Hero Section
    // -------------------------------------------------------------
    await page.goto(`http://127.0.0.1:${PORT}/`, { waitUntil: 'networkidle0' });
    await page.waitForSelector('header');
    await new Promise((r) => setTimeout(r, 600));
    await takeScreenshot('01-landing-hero-talent.png', 'Landing Hero - On-Demand China Talent & Single Contracts');

    // -------------------------------------------------------------
    // SCENARIO 2: Featured China Specialists & Workflow
    // -------------------------------------------------------------
    await page.evaluate(() => {
      window.scrollBy({ top: 700, behavior: 'instant' });
    });
    await new Promise((r) => setTimeout(r, 600));
    await takeScreenshot('02-landing-featured-specialists.png', 'Featured China Specialists (Factory Auditor, Translator, Sourcing)');

    // -------------------------------------------------------------
    // SCENARIO 3: Talent Directory & Category Filter
    // -------------------------------------------------------------
    await page.goto(`http://127.0.0.1:${PORT}/talents`, { waitUntil: 'networkidle0' });
    await page.waitForSelector('h1');
    await new Promise((r) => setTimeout(r, 600));
    await takeScreenshot('03-talent-directory-market.png', 'China Talent Market - Category Filter & Vetted Specialists');

    // -------------------------------------------------------------
    // SCENARIO 4: Consultation & Inquiry Modal
    // -------------------------------------------------------------
    await page.evaluate(() => {
      const buttons = Array.from(document.querySelectorAll('button'));
      const consultBtn = buttons.find((b) =>
        b.textContent?.includes('Consult Support for Booking') ||
        b.textContent?.includes('与客服对接此服务类别') ||
        b.textContent?.includes('按此类兼职咨询客服')
      ) as HTMLButtonElement;
      consultBtn?.click();
    });
    await page.waitForSelector('.fixed.inset-0', { timeout: 10000 });
    await new Promise((r) => setTimeout(r, 600));
    await takeScreenshot('04-inquiry-modal-consultation.png', 'Custom Staffing & Labor Scope Consultation Modal');

    // Close inquiry modal
    await page.evaluate(() => {
      const closeBtn = document.querySelector('.fixed button') as HTMLButtonElement;
      closeBtn?.click();
    });
    await new Promise((r) => setTimeout(r, 300));

    // -------------------------------------------------------------
    // SCENARIO 5: Web3 Wallet Login & Authentication
    // -------------------------------------------------------------
    await page.evaluate(() => {
      const signInBtn = document.querySelector('header button.bg-gradient-to-r') as HTMLButtonElement;
      signInBtn?.click();
    });
    await page.waitForSelector('.fixed.inset-0');
    await new Promise((r) => setTimeout(r, 400));

    // Click Connect & Sign
    await page.evaluate(() => {
      const buttons = Array.from(document.querySelectorAll('button'));
      const connectBtn = buttons.find((b) => b.textContent?.includes('Connect & Sign') || b.textContent?.includes('Web3')) as HTMLButtonElement;
      connectBtn?.click();
    });
    await new Promise((r) => setTimeout(r, 1200));
    await takeScreenshot('05-auth-web3-login.png', 'Authenticated User Session - Web3 Wallet Connected in Navbar');
    console.log('✅ User logged in via Web3 wallet.');

    // -------------------------------------------------------------
    // SCENARIO 6: Built-in Live Chat Support Workspace
    // -------------------------------------------------------------
    await page.goto(`http://127.0.0.1:${PORT}/chat`, { waitUntil: 'networkidle0' });
    await page.waitForSelector('h1');
    await new Promise((r) => setTimeout(r, 800));

    // Send a message in live chat
    await page.evaluate(() => {
      const input = document.querySelector('input[placeholder*="Type your message"]') as HTMLInputElement;
      if (input) {
        input.value = 'Hello support, we need David Li for 3 days of on-site factory audit in Dongguan starting next Monday. Please prepare the contract.';
        input.dispatchEvent(new Event('input', { bubbles: true }));
      }
      const form = document.querySelector('form') as HTMLFormElement;
      form?.dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }));
    });
    await new Promise((r) => setTimeout(r, 1200));
    await takeScreenshot('06-built-in-chat-workspace.png', 'Built-in Support Chat Workspace - Multi-turn Consultation Stream');

    // -------------------------------------------------------------
    // SCENARIO 7: Global Floating Chat Bubble
    // -------------------------------------------------------------
    await page.goto(`http://127.0.0.1:${PORT}/talents`, { waitUntil: 'networkidle0' });
    await new Promise((r) => setTimeout(r, 600));

    // Click bottom-right floating chat bubble
    await page.evaluate(() => {
      const bubble = document.querySelector('.fixed.bottom-6.right-6 button') as HTMLButtonElement;
      bubble?.click();
    });
    await new Promise((r) => setTimeout(r, 800));
    await takeScreenshot('07-floating-chat-bubble.png', 'Global Built-in Floating Chat Bubble Expanded on Talents View');

    // Close bubble
    await page.evaluate(() => {
      const bubbleClose = document.querySelector('.fixed.bottom-6.right-6 button') as HTMLButtonElement;
      bubbleClose?.click();
    });
    await new Promise((r) => setTimeout(r, 300));

    // -------------------------------------------------------------
    // SCENARIO 8: Customer Support Admin Desk & Agent Reply
    // -------------------------------------------------------------
    await page.evaluate((token, user) => {
      localStorage.setItem('gc_token', token);
      localStorage.setItem('gc_user', JSON.stringify(user));
    }, adminToken, adminUser);

    await page.goto(`http://127.0.0.1:${PORT}/admin`, { waitUntil: 'networkidle0' });
    await page.waitForSelector('button');
    await new Promise((r) => setTimeout(r, 1200));

    // Agent replies in admin chat desk
    await page.evaluate(() => {
      const input = document.querySelector('input[placeholder*="Reply to customer"]') as HTMLInputElement;
      if (input) {
        input.value = 'Understood! I have confirmed with David Li. He is available next Monday. I am drafting your official 3-day labor contract now.';
        input.dispatchEvent(new Event('input', { bubbles: true }));
      }
      const form = document.querySelector('form') as HTMLFormElement;
      form?.dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }));
    });
    await new Promise((r) => setTimeout(r, 1000));
    await takeScreenshot('08-admin-support-desk-reply.png', 'Admin Support Desk - Reviewing Customer Inquiries & Live Reply');

    // -------------------------------------------------------------
    // SCENARIO 9: Admin Drafts & Issues Custom Contract Modal
    // -------------------------------------------------------------
    await page.evaluate(() => {
      const buttons = Array.from(document.querySelectorAll('button'));
      const draftBtn = buttons.find((b) => b.textContent?.includes('Draft New Contract') || b.textContent?.includes('Draft Contract')) as HTMLButtonElement;
      draftBtn?.click();
    });
    await page.waitForSelector('.fixed.inset-0 form', { timeout: 10000 });
    await new Promise((r) => setTimeout(r, 600));

    // Fill in client user ID and details
    await page.evaluate((userId, email) => {
      const uIdInput = document.querySelector('input[placeholder="usr_xxx"]') as HTMLInputElement;
      if (uIdInput) {
        uIdInput.value = userId;
        uIdInput.dispatchEvent(new Event('input', { bubbles: true }));
      }
      const emailInput = document.querySelector('input[placeholder="buyer@corp.com"]') as HTMLInputElement;
      if (emailInput) {
        emailInput.value = email;
        emailInput.dispatchEvent(new Event('input', { bubbles: true }));
      }
      const titleInput = document.querySelector('input[placeholder*="Ningbo Factory"]') as HTMLInputElement;
      if (titleInput) {
        titleInput.value = 'Dongguan 3-Day PCB Factory Quality Inspection';
        titleInput.dispatchEvent(new Event('input', { bubbles: true }));
      }
    }, clientUser.id, clientUser.email);
    await new Promise((r) => setTimeout(r, 400));

    await takeScreenshot('09-admin-draft-contract-modal.png', 'Admin Contract Drafting Modal - Scope of Work, Deliverables & Lump-sum Price');

    // Submit the contract
    await page.evaluate(() => {
      const buttons = Array.from(document.querySelectorAll('.fixed.inset-0 button'));
      const issueBtn = buttons.find((b) =>
        b.textContent?.includes('Issue Contract') ||
        b.textContent?.includes('整好并发布定制订单')
      ) as HTMLButtonElement;
      issueBtn?.click();
    });
    await new Promise((r) => setTimeout(r, 1200));

    // -------------------------------------------------------------
    // SCENARIO 10: User Contracts Center - Review Issued Contract
    // -------------------------------------------------------------
    // Switch back to client user
    await page.evaluate((token, user) => {
      localStorage.setItem('gc_token', token);
      localStorage.setItem('gc_user', JSON.stringify(user));
    }, clientToken, clientUser);

    await page.goto(`http://127.0.0.1:${PORT}/contracts`, { waitUntil: 'networkidle0' });
    await page.waitForSelector('h1');
    await new Promise((r) => setTimeout(r, 800));
    await takeScreenshot('10-user-contracts-center.png', 'User Contracts Center - Reviewing Support-Issued Contract (Pending Payment)');

    // -------------------------------------------------------------
    // SCENARIO 11: One-Time Crypto Checkout Modal (Pay3 HD Address)
    // -------------------------------------------------------------
    await page.evaluate(() => {
      const buttons = Array.from(document.querySelectorAll('button'));
      const payBtn = buttons.find((b) => b.textContent?.includes('Pay Contract')) as HTMLButtonElement;
      payBtn?.click();
    });
    await page.waitForSelector('.fixed.inset-0', { timeout: 10000 });
    await new Promise((r) => setTimeout(r, 1200));
    await takeScreenshot('11-contract-crypto-checkout-pay3.png', 'One-Time Crypto Checkout - Pay3 Dedicated HD Address & Amount');

    // -------------------------------------------------------------
    // SCENARIO 12: Verify On-Chain Payment & Transition to Active
    // -------------------------------------------------------------
    for (const [orderId, mockOrd] of mockPay3Server.orders) {
      mockOrd.status = 'paid';
      mockOrd.payment.paid_amount_raw = mockOrd.payment.amount_raw;
    }

    await page.evaluate(() => {
      const buttons = Array.from(document.querySelectorAll('button'));
      const verifyBtn = buttons.find((b) => b.textContent?.includes('I Have Paid') || b.textContent?.includes('Verify Instant')) as HTMLButtonElement;
      verifyBtn?.click();
    });
    await new Promise((r) => setTimeout(r, 2200));
    await takeScreenshot('12-contract-paid-and-active.png', 'Contract Activated - State Flipped to Active in Progress upon On-Chain Settlement');

    // -------------------------------------------------------------
    // SCENARIO 13: Client Dashboard Overview
    // -------------------------------------------------------------
    await page.goto(`http://127.0.0.1:${PORT}/dashboard`, { waitUntil: 'networkidle0' });
    await page.waitForSelector('h1');
    await new Promise((r) => setTimeout(r, 800));
    await takeScreenshot('13-user-dashboard-overview.png', 'Client Dashboard - Active Missions, Contract Tracking & Web3 Profile');

    console.log('🎉 All 13 comprehensive E2E visual scenarios captured and verified successfully!');
  } finally {
    await browser.close();
    server.close();
    console.log('🏁 Test server and browser shutdown cleanly.');
  }
}

main().catch((err) => {
  console.error('❌ Visual E2E Execution Failed:', err);
  process.exit(1);
});
