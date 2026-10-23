# GoChina 平台测试环境部署与线上对接操作指南 (Test to Prod Runbook)

本文档记录了 **GoChina 数字化服务与定制人才门户系统** 部署到 Cloudflare 线上环境、对接 **Pay3 ERC20 支付网关（Polygon Amoy 测试网）**、新增 **Dev Faucet（测试水龙头）** 页面及端到端全流程验证的全部细节与运维手册。

---

## 1. 线上访问端点与部署架构速查

系统采用 **Cloudflare Serverless 纯边缘无服务器架构**，全面解耦并具备全球毫秒级访问能力：

| 服务组件 | 部署平台 | 线上访问 URL | 核心功能与说明 |
| :--- | :--- | :--- | :--- |
| **前端应用 (Web Portal)** | Cloudflare Pages | [https://gochina-portal.pages.dev](https://gochina-portal.pages.dev) | Vue 3 + Tailwind CSS 前端单页应用，支持人才浏览、加密收银台、个人工作台 |
| **测试水龙头 (Dev Faucet)** | Cloudflare Pages | [https://gochina-portal.pages.dev/faucet](https://gochina-portal.pages.dev/faucet) | 开发者与测试用户专用水龙头，支持一键免 Gas 领水、智能合约铸币与切网 |
| **边缘 API (Worker Gateway)** | Cloudflare Workers | [https://gochina-portal.xz-sean-g.workers.dev](https://gochina-portal.xz-sean-g.workers.dev) | 基于 Hono 框架的 API 网关，处理 Web3 鉴权、订单管理、秒级扫链核验与权益激活 |
| **支付网关 (Pay3 Daemon)** | 专属隧道 + 云端 | `https://home-10030.002788.xyz` | 企业级非托管 HD 钱包支付引擎，一单一地址，支持 EIP-3009 与 Meta-Tx 免 Gas 归集 |
| **边缘数据库 (KVDB / D1)** | Cloudflare D1 | 实例: `gochina-db`<br/>ID: `dc514e55-5bbb-4673-ad18-249f62885703` | 声明式 SQLite 数据库，Multi-Key 物理二级索引与 Keyset 游标分页 |
| **二级缓存 (Workers KV)** | Cloudflare KV | 命名空间: `gochina-cache-kv`<br/>ID: `ba553f4867b0457899c782d529e19209` | L2 分布式缓存与临时会话存储，实现方案亚毫秒点查 |

---

## 2. 区块链网络与测试代币参数 (Polygon Amoy)

- **网络名称**: Polygon Amoy Testnet
- **Chain ID**: `80002` (十六进制: `0x13882`)
- **原生代币**: `POL` (18位精度，Gas 燃料)
- **区块浏览器**: [https://amoy.polygonscan.com](https://amoy.polygonscan.com)
- **支持代币与合约地址**:
  - **USDC**: `0xc252a473DC466de3799149A2616ccc625832F40C` (6 位精度，EIP-3009 免 Gas 归集)
  - **USDT**: `0x2C2e569e3Df89c55Ba46Ce52248Ae180379d0B31` (6 位精度，Polygon Meta-Tx 免 Gas 归集)
- **归集总账钱包 (Treasury)**:
  `0x55193778A808426Eb4024fADAd1aC3c0968E8AF2`
- **平台测试打款钱包 (Payer)**:
  - 地址: `0x285bd8C75C7647b7da1C1154776633804d4ff5eC`
  - 私钥: `0xa010561d0ee36587adb4c9d81f4d19d84dc8b2246a9b7b8fd0665d1f8b15d844`

---

## 3. 测试水龙头 (Dev Faucet) 页面与 API

用户在测试开发环境中体验时，往往面临钱包没有测试代币或没有 POL 支付 Gas 的问题。为此我们在网站新增了专属的 **Faucet 页面**：

- **线上地址**: [https://gochina-portal.pages.dev/faucet](https://gochina-portal.pages.dev/faucet)

### 3.1 水龙头页面功能模块
1. **网络检测与一键切网**：
   - 自动检测连接的 Web3 钱包（MetaMask / OKX / Rabby 等）当前所在的 Chain ID。
   - 若不在 Polygon Amoy，顶部高亮告警并提供一键自动添加并切换到 Amoy 测试网（含 RPC 容灾列表）。
2. **实时资产仪表盘**：
   - 实时展示连接钱包的 POL、USDC、USDT 余额，带刷新旋转动画。
3. **免 Gas 快速领水通道（后端代付）**：
   - 输入目标 EVM 地址（默认填充当前连接钱包）。
   - 提供三个快捷领取按钮：
     - 💧 **领取 100 USDC** (免 Gas)
     - 💧 **领取 100 USDT** (免 Gas)
     - ⚡ **领取 0.1 POL** (Gas 燃料)
   - 点击后直接调用后端 `/api/faucet/claim`，由平台测试钱包广播交易，**用户即便钱包为 0 余额也能成功领取！**
4. **智能合约直接铸造通道**：
   - 针对有少量 POL 的钱包，支持直接调用 MockUSDC / MockUSDT 合约公开的 `faucet()`（Method ID: `0xde5f72fd`），单次直接铸造 1,000 枚！
5. **一键添加代币到钱包**：
   - 调用 `wallet_watchAsset` 一键将 USDC / USDT 资产和精度添加至 MetaMask / OKX。

### 3.2 水龙头后端 API
- **查询水龙头信息**: `GET /api/faucet/info`
- **免 Gas 快速领水**: `POST /api/faucet/claim`
  ```bash
  curl -sS -X POST "https://gochina-portal.pages.dev/api/faucet/claim" \
    -H "Content-Type: application/json" \
    -d '{
      "address": "0xYourWalletAddress...",
      "symbol": "USDC"
    }'
  ```

---

## 4. Pay3 鉴权与协议对接关键要点

在对接 `https://home-10030.002788.xyz` 支付网关时，需严格遵循以下规则：

### 4.1 JWT 签名规则与必须字段
Pay3 底层采用 Rust `jsonwebtoken` 严格校验规范：
- **算法 (`alg`)**: `HS256`
- **Key ID (`kid`)**: `pay3-dev-key-1` *(必须与网关配置的 JWT_KEY_ID 一致)*
- **签发者 (`iss`)**: `pay3`
- **接收者 (`aud`)**: `pay3-api`
- **主体 (`sub`)**: `gochina-portal` (或接入项目标识)
- **必须字段 (`nbf`)**: ⚠️ **必须显式设置 `nbf` (Not Before)**，否则 Pay3 网关会校验失败并返回 HTTP 401 `invalid token`。
- **签名密钥 (`secret`)**: `dev-dry-run-jwt-secret-000000000000666`

### 4.2 订单创建与即时扫块核验
1. **建单接口**: `POST /v1/orders`
   - 入参包含 `external_id`（业务单号）、`amount`（金额，如 `"15.00"`）、`ttl_seconds`（有效期秒数）。
   - 网关返回专属派生收款地址 `receive_address`。
2. **即时扫块核验**: `POST /v1/orders/{id}/verify`
   - 当用户在前端点击“我已支付”或轮询时，Worker 会向 Pay3 发起 `/verify`，触发网关立即对最新区块中匹配该收款地址的 Transfer Logs 进行拉取。
   - 网关判定 12 确认数达标后状态流转为 `confirmed` / `paid`。
   - Worker 判定支付成功后，原子更新订单状态为 `paid` 并自动激活权益 `Entitlement`。

---

## 5. Cloudflare 线上资源与环境配置

### 5.1 资源配置表

| 配置项 | 对应资源 / 变量 | 值 |
| :--- | :--- | :--- |
| **Worker 名称** | Cloudflare Workers | `gochina-portal` |
| **D1 数据库** | `env.DB` | 名称: `gochina-db`, ID: `dc514e55-5bbb-4673-ad18-249f62885703` |
| **KV 命名空间** | `env.CACHE_KV` | 名称: `gochina-cache-kv`, ID: `ba553f4867b0457899c782d529e19209` |
| **Pages 项目** | Cloudflare Pages | `gochina-portal` (主域名: `gochina-portal.pages.dev`) |
| **环境标识** | `env.ENVIRONMENT` | `"development"` |
| **Pay3 网关地址** | `env.PAY3_BASE_URL` | `https://home-10030.002788.xyz` |
| **Pay3 JWT 密钥** | `env.PAY3_JWT_SECRET` | `dev-dry-run-jwt-secret-000000000000666` |
| **Pay3 Key ID** | `env.PAY3_JWT_KEY_ID` | `pay3-dev-key-1` |
| **站内 JWT 密钥** | `env.PORTAL_JWT_SECRET`| `dev_secret_portal_key_for_testing_1234567890` |
| **测试代付私钥** | `env.FAUCET_PRIVATE_KEY`| `0xa010561d0ee36587adb4c9d81f4d19d84dc8b2246a9b7b8fd0665d1f8b15d844` |

---

## 6. 从零部署上线标准操作 Runbook

后续若有代码更新或需要重新部署，按以下步骤执行：

### 第一步：安装依赖与类型检查
```bash
# 1. 进入代码仓库根目录
cd /ssd0/git/GoChina

# 2. 安装并更新依赖
pnpm install

# 3. 运行全项目类型检查与单元测试
pnpm typecheck
pnpm test
```

### 第二步：编译前端生产静态资源
```bash
cd frontend
pnpm build
cd ..
```

### 第三步：部署 Cloudflare Workers 后端
```bash
# 验证打包无误
npx wrangler deploy --dry-run

# 发布 Worker 到 Cloudflare 边缘
npx wrangler deploy
```

### 第四步：初始化生产 D1 数据库与种子数据
在初次部署或重置数据库时，调用线上初始化端点：
```bash
curl -sS -X POST https://gochina-portal.xz-sean-g.workers.dev/api/setup/seed
```
响应返回：
```json
{"status":"ok","message":"Database schema initialized & seed data populated"}
```

### 第五步：部署 Cloudflare Pages 前端单页应用
```bash
npx wrangler pages deploy frontend/dist --project-name gochina-portal --commit-dirty=true
```
部署完成后即可通过 `https://gochina-portal.pages.dev` 访问。

---

## 7. 端到端全链路实测验证报告 (E2E Verification)

部署上线后，我们执行了真实的链上全流程自动化联调测试：

```
=== STEP 1: Web3 Wallet Auth ===
User JWT Token received. User ID: usr_w_1792749300893_07a49e587f9c

=== STEP 2: Create Checkout Order ===
Order created successfully!
  Order ID:        ord_1792749616035_2ko4h2
  Pay3 Order ID:   60883564-3084-4f99-b5e5-5e6597616136
  Receive Address: 0x6b2a7fb8fc337098c4b06fcc88182f3eb7bcb1aa
  Token:           USDC
  Amount:          15

=== STEP 3: Execute On-Chain Payment ===
Sending 15 (15000000 raw) to 0x6b2a7fb8fc337098c4b06fcc88182f3eb7bcb1aa...
Payment Tx Broadcasted! TxHash: 0x2f43e7622b06a31e75ea169762f367f6376e1fab5282191360e36a4f257d283b

=== STEP 4: Instant Verify & Entitlement Activation ===
Polling verification...
[Attempt 1] Status: pending
[Attempt 2] Status: paid
🎉 ORDER CONFIRMED AS PAID!
Entitlement Token Provisioned: goc_live_fa4f60fe7d53d96ac3cd3c637a670b1d97a0709a7105be03

=== STEP 5: Verify Active Entitlements in KVDB ===
Active Entitlements:
- Entitlement ID: ent_1792749641777_g3g4z5
- Plan: Starter Monthly (100,000 API Calls / 10 GB Bandwidth)
- Token: goc_live_fa4f60fe7d53d96ac3cd3c637a670b1d97a0709a7105be03
- Status: active

✅ ALL STEPS PASSED: PRODUCTION RUNTIME VERIFIED!
```

---

## 8. 运维与故障排查速查

1. **测试币不足时如何充值？**
   - 打开 [https://gochina-portal.pages.dev/faucet](https://gochina-portal.pages.dev/faucet) 输入钱包地址直接点击“免 Gas 领水”，或调用 `POST /api/faucet/claim`。
2. **付款后订单状态没有更新？**
   - 检查转账代币与收款地址是否与订单返回的一致。
   - 打开 Polygonscan 查询该笔交易是否已经有 12 个以上确认块。
   - 在前端点击“立即核验”按钮，触发 `/api/orders/{id}/verify` 强制链上即时扫块。
3. **查看后台定时对账巡检 (Cron Sweeper) 日志？**
   - Cloudflare Workers 已配置每 5 分钟定时任务 `*/5 * * * *`。可在 Cloudflare Dashboard -> Workers -> `gochina-portal` -> Logs 实时查看巡检结果。
