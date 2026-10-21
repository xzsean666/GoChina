# GoChina 系统架构说明 (System Architecture)

> **核心事实来源关联**：本文件与 [`docs/ARCHITECTURE.PROTAL.md`](file:///ssd0/git/GoChina/docs/ARCHITECTURE.PROTAL.md) 保持完全一致的系统级架构事实。

---

## 1. 架构总览

GoChina 是一个基于 **Cloudflare Serverless 生态**构建的高性能、现代化数字化服务与订阅门户平台。其核心系统构成包括：

1. **前端展示层 (Frontend)**：托管于 Cloudflare Pages 的 Vue 3 现代化多语言响应式单页应用。
2. **边缘网关层 (Edge API)**：运行于 Cloudflare Workers 的全局分布式无状态 API 网关与服务中枢。
3. **数据真相层 (Storage Engine)**：**100% 由内部自研基础库 [`cloudflare-worker-kvdb`](file:///ssd0/git/cloudlflare-worker-kvdb) 承载**：
   - 彻底取代手写裸 SQL 迁移，全量声明 `MultiKeySchema`；
   - 将高频检索字段直接映射为 D1 (SQLite) 的物理列并自动挂载 B-Tree 索引；
   - 启用 Auto-Batch 微批写优化（单批最大 50 条，50ms 聚合窗口），解决 D1 单主写锁冲突；
   - 启用 Keyset 游标高效分页 (`table.findPage`)，杜绝全表扫描与大 `OFFSET` 行账单损耗；
   - 集成 Workers KV 构成 L2 分布式缓存。
4. **支付网关层 (Crypto Payment)**：基于内部自研模块 [`pay3`](file:///ssd0/git/pay3)，实现 ERC20 多币种去中心化收款、HD 派生子地址隔离、直连 RPC 扫链与国库资金归集。
5. **权益履约层 (Fulfillment Engine)**：处理用户购买后的数字化服务权益自动激活、有效期延长、配额管理与凭据核验。

完整架构拓扑图、数据模型表结构定义、支付序列交互图及 API 契约，请参阅：
👉 [**docs/ARCHITECTURE.PROTAL.md 门户完整架构设计详述**](file:///ssd0/git/GoChina/docs/ARCHITECTURE.PROTAL.md)

---

## 2. 核心模块单向依赖与调用规约

```text
Pages Web UI -> Workers API Gateway -> Services (Auth / Plan / Order / Verification / Entitlement)
Services -> cloudflare-worker-kvdb (Multi-Key Tables / Auto-Batch / TieredCache)
Services -> Pay3Client (HTTP + Bearer JWT) -> Pay3 Daemon (Rust / PostgreSQL)
```

### 严格限制规则：
1. **边缘无状态**：Workers 实例不得在全局内存中缓存跨请求的业务状态，所有持久化读写均通过 `cloudflare-worker-kvdb`。
2. **纯净 KVDB 规范**：严禁在业务代码中散落手写 D1 SQL；全部业务实体必须通过 KVDB 的 Schema Table、`table.getBy()`、`table.set()`、`table.findPage()` 进行操作。
3. **支付解耦**：Portal 永远不保存助记词或私钥，所有链上交互由 Pay3 托管，Portal 仅消费 Pay3 开放的订单相关 Scope 接口。
4. **安全凭据隔离**：权益 Token 与登录 Session Token 严格隔离，对外凭据无法反查用户真实账户信息。
