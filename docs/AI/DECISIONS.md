# 重要架构决策记录 (Architectural Decision Records - ADRs)

本文档记录 GoChina 门户系统设计与实现过程中的关键技术选型、架构权衡与设计决策。

---

## ADR-001: 全面采用 Cloudflare Serverless 边缘架构 (Workers + Pages)

- **状态**: Accepted
- **背景**: 传统电商与服务门户多依赖 Linux 单机服务器、MySQL 与 Redis，存在单点故障风险、运维繁琐、多地域网络延迟高以及突发流量下容易挂起等问题。
- **决策**:
  - 前端静态门户托管于 Cloudflare Pages 全球 CDN；
  - 后端边缘 API 统一运行于 Cloudflare Workers (`workerd` 运行时)；
  - 完全摒弃传统 VPS 常驻后端进程。
- **后果与收益**:
  - 全球分布式就近接入，冷启动时间 < 5ms，P95 响应时间极低；
  - 零服务器打补丁与运维成本，自带 Cloudflare DDoS 与 WAF 防护；
  - 必须遵守 `workerd` 无原生 C++ 模块的约束，仅能使用 Web 标准 API 与纯 TypeScript/WASM 库。

---

## ADR-002: 采用内部自研 `cloudflare-worker-kvdb` 作为统一存储持久层

- **状态**: Accepted
- **背景**: 直接裸写 Cloudflare D1 SQL 或 Workers KV 面临严苛限制：D1 单写者并发锁冲突 (`SQLITE_BUSY`)、每条 SQL 严格 100 参数限制、缺乏原生多键二级索引以及大结果集查询行账单昂贵。
- **决策**:
  - 引入内部自研基础库 [`cloudflare-worker-kvdb`](file:///ssd0/git/cloudlflare-worker-kvdb)；
  - 利用其 Schema Table 动态多键（Multi-Key）能力在 D1 上映射物理列与挂载 B-Tree 索引；
  - 启用 Auto-Batch 微批写优化，自动规避 100 参数上限；
  - 启用分层缓存（L1 内存 LRU + L2 Workers KV），对方案列表与高频配置提供微秒级响应。
- **后果与收益**:
  - 代码层面享受类似 ORM 的清洁 API（`table.getBy()`, `table.findPage()`）；
  - 彻底规避 D1 锁超时与参数超限崩盘；
  - 依赖统一采用 Git + Commit Hash 锁定。

---

## ADR-003: 接入内部自研 `pay3` 作为唯一原生 Web3 ERC20 支付网关

- **状态**: Accepted
- **背景**: 传统法币支付（如 Stripe、PayPal）手续费高昂且容易冻结商户；第三方加密网关无法做到私有化审计与资产归集全受控。
- **决策**:
  - 采用公司内部自研的 [`pay3`](file:///ssd0/git/pay3) 收款后端；
  - 采用“单订单单地址（HD 派生）”模式，订单 ID 作为 `external_id`；
  - 采用 HS256 JWT Bearer 鉴权，颁发仅限 `orders:create`, `orders:read`, `orders:verify` 的短期令牌调用 Pay3 REST API。
- **后果与收益**:
  - 零中介通道抽成，资金直接通过 Pay3 归集至私有国库地址；
  - 严格防范虚假转账与过期重放攻击；
  - Portal 端无需保存任何钱包私钥，实现 100% 资金风险隔离。

---

## ADR-004: 数字化服务权益与履约状态机设计 (Digital Entitlement State Machine)

- **状态**: Accepted
- **背景**: 用户完成支付后，系统需要以高可靠、防并发重复开通的方式将数字化权益交付给用户，并支持有效时长顺延与配额追加。
- **决策**:
  - 建立独立的 `entitlements` 实体模型，记录 `user_id`, `plan_id`, `expire_time`, `quota_limit`, `quota_used`, `status`；
  - 支付确认触发履约时，若用户已拥有同类生效中权益，自动采用时间累加（延长到期时间）和配额叠加规则；若无则创建全新权益实体；
  - 履约操作具备幂等性约束，依据 `order_id` 与订单 `paid` 状态保障单订单至多执行一次权益激活。
- **后果与收益**:
  - 杜绝重复充值导致的权益计算错误；
  - 用户续费与新购体验平滑一致。

---

## ADR-005: 采用“用户主动验证 + 后台 Cron 定时扫描”双轨履约模式

- **状态**: Accepted
- **背景**: 区块链转账存在确认时延（Polygon 通常 2-5 秒，以太坊通常 12-30 秒）。如果仅依赖后台轮询，用户在前端支付完成后需要等待较长时间才能看到权益生效。
- **决策**:
  - **通道一（即时用户触发）**：用户在支付弹窗点击“我已完成转账”时，前端直接发起 `POST /api/orders/:id/verify`，边缘端立即向 Pay3 发起直连链上 RPC 校验；若检测到有效付款且确认数达标，毫秒级激活权益并返回；
  - **通道二（兜底定时补偿）**：通过 Workers `scheduled` 定时任务（Cron Trigger），每分钟轮询扫描数据库中所有处于 `pending` 状态的活跃订单，批量向 Pay3 请求核验并自动履约。
- **后果与收益**:
  - 用户体验得到最大化即时满足；
  - 用户即便直接关闭浏览器网页，后台 Cron 也能确保付款后权益自动到账，杜绝掉单。

---

## ADR-006: 权益凭据 (`entitlement_token`) 与用户登录会话 Token 物理隔离

- **状态**: Accepted
- **背景**: 数字化权益兑换或第三方 API 调用可能需要出示凭据。若凭据与登录身份耦合，一旦配置暴露将危及整个用户账号。
- **决策**:
  - 权益凭据使用独立的高熵随机字符串 `entitlement_token`；
  - `entitlement_token` 仅用于消费/验证具体服务权益，绝不承载用户个人信息修改或订单发起权限；
  - 用户在 Web 控制台可以随时重置凭据。
- **后果与收益**:
  - 权限最小化设计原则得以彻底贯彻；
  - 安全审计边界清晰。
