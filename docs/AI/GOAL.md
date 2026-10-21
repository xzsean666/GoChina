# Project Goal: GoChina Portal (GoChina 门户系统)

## 1. 核心定位与业务目标 (Executive Summary)

GoChina 是一个基于 **Cloudflare Serverless 生态**构建的全新一代 **数字化服务、方案订阅与支付门户系统**。

传统类似服务平台通常依赖臃肿沉重的传统后端（如 PHP/Laravel、Java 单体服务），需要常驻 VPS、MySQL、Redis，面临运维复杂、单点故障、多地访问延迟高以及支付通道不稳定等痛点。

GoChina 彻底推翻旧式架构，基于 **100% Cloudflare Edge Serverless** 边缘计算构建：
1. **零服务器运维负担**：API 运行于 Cloudflare Workers，前端静态资源托管于 Cloudflare Pages 全球 CDN。
2. **极速边缘持久化**：使用自研 [`cloudflare-worker-kvdb`](file:///ssd0/git/cloudlflare-worker-kvdb) 统一调度 Cloudflare D1 (SQLite) 与 Workers KV，享受物理 B-Tree 索引、Auto-Batch 微批写优化与亚毫秒级读缓存。
3. **安全可靠的 Web3 支付**：深度集成自研 [`pay3`](file:///ssd0/git/pay3) 支付守护进程，提供单订单单地址 HD 派生、链上 Transfer 直连扫描与国库资金归集，摆脱中心化法币支付通道冻结与退单风险。
4. **全自动数字化履约**：订单支付确认后毫秒级自动激活用户服务权益与配额，提供自助式用户仪表盘。

---

## 2. MVP 阶段必须交付的核心特性 (In-Scope MVP Deliverables)

### 2.1 边缘基础设施与工程底座
- 基于 TypeScript 与 Cloudflare Workers 的工程脚手架（严格类型检查、Vitest 单元测试与 Miniflare 边缘模拟环境）。
- 规范的 Git+Hash 内部自研 SDK 依赖管理机制与本地热修复闭环。

### 2.2 数据模型与存储引擎 (`cloudflare-worker-kvdb`)
- 在 Cloudflare D1 中建立具备物理二级索引的 Schema Tables：
  - 用户表 `users` (支持邮箱及 Web3 钱包检索)
  - 服务与方案表 `plans` (支持在线状态与权重排序)
  - 订单表 `orders` (支持 `external_id`、`pay3_order_id` 及用户检索)
  - 权益/订阅表 `entitlements` (支持 `entitlement_token` 毫秒级寻址)

### 2.3 加密支付接入 (`pay3`)
- 高性能轻量 `Pay3Client`（TypeScript），自动签发带细粒度 Scope 的 JWT。
- 订单创建全链路：生成业务订单 -> 调用 Pay3 获取独立收款地址 -> 写入 KVDB。
- 支付核验双引擎：
  - 用户端主动点击“已完成支付”触发即时重算 (`POST /api/orders/:id/verify`)。
  - 后台 Scheduled Cron 定时扫描未决订单并同步链上到账状态。
- 支付成功自动履约：触发服务权益自动开通或到期顺延。

### 2.4 现代化 Web 门户前端 (Portal Web UI)
- 响应式 UI（支持桌面与手机端），现代化暗色/亮色美学设计。
- 服务与方案选购卡片、币种选择。
- 交互式结账弹窗（高清收款二维码、一键复制钱包地址、倒计时、实时付款状态跳动）。
- 用户仪表盘（已生效权益、用量进度条、到期时间、凭据查看）。
- 管理员控制台（方案管理、订单审计、支付诊断追踪）。

---

## 3. 非目标与阶段边界 (Out-of-Scope / Non-Goals)

为了确保工程高质量交付，以下内容明确不包含在当前 MVP 阶段：
1. **中心化法币支付（Stripe / 支付宝 / 微信支付等）**：MVP 聚焦于无审查风险的 ERC20 加密支付 (USDT/USDC)。
2. **重型 ERP / 物理仓储物流系统**：MVP 聚焦数字化服务与订阅方案的在线购买与履约。

---

## 4. 关键指标与验收标准 (Success Criteria)

- **性能目标**：方案列表查询与权益拉取全球 P95 响应时间 < 50ms。
- **稳定性目标**：100% Serverless 运行时，零单点服务器宕机风险。
- **资金与订单安全**：单订单严格单地址，绝无地址复用；所有到账必须有链上区块确认保障；代码库零私钥泄露。
- **代码质量**：TypeScript 严格模式 (`strict: true`)，核心业务与客户端适配器 100% 单元测试覆盖。
