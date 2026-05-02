# EPLTI 短板修复计划 (Plan 2.2) —— 从 MVP 到生产级产品

基于 PLAN2.1 和 MIMOPLAN 的全面复盘，EPLTI 在功能和内容层面已接近 100% 完成。Plan 2.2 专注于**安全加固、产品升级、工程质量**三大短板，目标是将 MVP 提升为一个可长期运营、可规模化、可过审的生产级产品。

> **关于 MiMo / DeepSeek 的说明**：MiMo Orbit 并未强制要求申请时必须已接入 MiMo。当前使用 DeepSeek 跑通效果是务实选择——待申请通过、拿到 Token 额度后再切到 MiMo。`mimo.js` 的通用 OpenAI-format 封装已为此做好了准备，切换只需改三个环境变量。

---

## 一、安全加固（P0 — 上线前必须修复）

### 1.1 OG 标签 Host 头 XSS 注入

**现状**：`server/index.js` 第 79 行，`req.get('host')` 直接拼入 HTML，攻击者可伪造 Host 头注入任意脚本。

**修复**：
```javascript
// index.js — 对 host 同样做转义
const safeHost = escapeHTML(host)
const ogImage = `https://${safeHost}/images/${safeTypeCode}.png`
```

**同时**：将 `http://` 硬编码改为 `https://`，避免混合内容警告。

**文件**：`server/index.js`，第 72-88 行区域。

---

### 1.2 引入安全中间件 helmet

**现状**：缺少所有标准安全响应头（CSP、HSTS、X-Content-Type-Options、X-Frame-Options 等）。

**方案**：
```bash
cd server && npm install helmet
```

```javascript
// server/index.js
import helmet from 'helmet'

app.use(helmet({
  contentSecurityPolicy: false, // 先关闭 CSP，SPA 内联样式较多，后续逐步开启
}))
```

**文件**：`server/index.js`、`server/package.json`。

---

### 1.3 对话历史迁移到 Redis（解决内存泄漏）

**现状**：`server/routes/ai.js` 的 `conversationStore` 是普通 `Map`，会话永不过期导致内存泄漏。

**方案**：
- 使用已有的 `server/lib/redis.js` 封装，在 chat 路由中替换 `Map` 为 Redis
- 会话 Key：`chat:{sessionId}`，TTL 设为 24 小时
- 如果 Redis 不可用，回退到 `Map`（保持优雅降级风格）

**文件**：`server/routes/ai.js`（chat 路由）。

---

### 1.4 管理导出接口加防暴力破解

**现状**：`/api/admin/export` 没有频率限制。

**修复**：加 `rateLimit({ max: 5 })` 中间件。

**文件**：`server/routes/result.js`。

---

### 1.5 全面排查 XSS 向量

**检查清单**：

| 位置 | 风险 | 状态 |
|------|------|------|
| OG 标签 host 注入 | 高 | 待修 (1.1) |
| `typeCode` 在 OG 中 | 已做 escapeHTML + 白名单 `[^\w]` 过滤 | ✅ 安全 |
| `req.originalUrl` 在 OG 中 | 已做 escapeHTML | ✅ 安全 |
| API 返回的 `insight`/`reply` 文本 | 前端直接渲染 | ⚠️ 需确保 React 默认转义生效 |
| 用户输入的 `message` 字段 | 存入对话历史 | ⚠️ 需验证前端不渲染为 HTML |

**建议**：在前端渲染 AI 返回的文本外层加一个简单的 `escapeHTML` 或确认 React JSX 的 `{}` 插值未被 `dangerouslySetInnerHTML` 绕过。

---

## 二、产品体验升级（P1 — 申请后首周）

### 2.1 用户测试历史记录

**痛点**：每次测试是一次性的，用户无法回顾自己的"心理变化曲线"。

**方案（最小可行版）**：
- 前端 `localStorage` 存储最近 3 次测试结果的摘要（类型 + 分数 + 时间戳）
- 结果页底部新增"你的测试历史"折叠卡片，展示历史的人格类型变化趋势
- 无需后端改动，纯前端实现

**进阶版（有用户体系后）**：
- 微信 OpenID 关联，服务端持久化历史
- 生成"赛季人格变化曲线"（每轮英超测一次，看五维波动）

**文件**：`client/src/pages/Result.jsx`（新增历史卡片）、`client/src/hooks/useTestHistory.js`（新增）。

---

### 2.2 丰富类型体系（14 种 → 20+ 种）

**痛点**：Big6 每队最多 2 种类型，复测体验单一。竞品分析指出的核心差距。

**方案**：
- Big6 每队扩充到 3 种类型（新增 6 种）
- 通用类型扩充 2-3 种（如"上古球迷"、"赌狗型球迷"）
- 总计 20-22 种

**注意**：每新增一种类型需要定义：名称、代码、描述、tagline、4 个标签、ideal 五维向量、最佳/最差 CP。这是一项**内容工作量为主**的任务。

**文件**：`client/src/data/types.ts`。

---

### 2.3 首页增加"结果预览"降低摩擦

**痛点**：新用户不知道测完是什么样，决策门槛高。

**方案**：
- 首页底部新增"看看别人是什么样的"滚动卡片
- 展示 3-4 个脱敏的结果摘要（如"一位阿森纳球迷被测出冠压抑，R 值 -4.2"）
- 纯前端实现，从 `/api/stats` 获取热门类型数据

**文件**：`client/src/pages/Landing.jsx`。

---

### 2.4 视觉品牌感强化

**痛点**：灰白极简风缺少记忆点。

**方案（低成本高收益）**：

| 改动 | 说明 |
|------|------|
| 品牌色系统 | 定义主色（如英超紫 #37003C）+ 辅助色，替代当前的纯灰色系 |
| 首页 Hero 动效 | 加入简单的 CSS 粒子/条纹动效（英超球场元素），提升视觉冲击 |
| 结果页"类型徽章" | 为每种人格生成一个独特的 emoji + 颜色组合，强化仪式感 |
| 海报模板多样化 | 新增 1-2 套海报风格可选（暗黑模式、复古票根风） |

**文件**：`tailwind.config.js`（品牌色）、`Landing.jsx`、`Result.jsx`、`SharePoster.jsx`。

---

### 2.5 PWA 支持

**痛点**：没有离线能力，网络差时直接白屏。

**方案**：使用 `vite-plugin-pwa`，自动生成 Service Worker + manifest.json。
- 缓存策略：静态资源 Cache First，API Network First
- 添加到主屏幕的 manifest 配置
- 离线时显示自定义离线页

**文件**：`client/vite.config.js`、`client/package.json`。

---

## 三、工程质量提升（P2 — 长期护城河）

### 3.1 完成 TypeScript 全量迁移

**现状**：`data/` 和 `engine/` 是 TS，其余页面和组件全是 JSX。

**方案**（渐进式）：
- Batch 1：页面层 `Landing.jsx` → `Landing.tsx`（逻辑最简单）
- Batch 2：`Quiz.jsx`、`Compare.jsx` → `.tsx`
- Batch 3：`Result.jsx`（最复杂，691 行）→ `.tsx`
- Batch 4：`SharePoster.jsx`、`ChatDrawer.jsx` → `.tsx`

**文件**：`client/src/pages/*.jsx`、`client/src/components/*.jsx`。

---

### 3.2 引入单元测试（核心算法层）

**现状**：零测试覆盖率。

**方案**：优先覆盖最高风险模块：
- `scoring.ts`：测试归一化、主队检测阈值、欧氏距离匹配
- `question-context.ts`：测试各题引言在不同 season-context 下的输出
- `db.js`：测试建表 SQL 语法（Mock MySQL）

```bash
cd client && npm install -D vitest
```

**文件**：`client/src/__tests__/scoring.test.ts`、`client/src/__tests__/question-context.test.ts`。

---

### 3.3 CI/CD 管线

**方案**：GitHub Actions 免费方案：
- `on: push` 触发 → `npm ci` → `npm run build` → `npm test`
- 防止合并有构建/测试错误的 PR

**文件**：`.github/workflows/ci.yml`（新增）。

---

### 3.4 日志系统

**现状**：只有 `console.error`，排错靠猜。

**方案**：引入 `pino`（轻量、高性能）：
- 请求日志：方法、路径、响应时间、状态码
- AI 调用日志：prompt 长度、响应时间、token 用量（有价值的数据，可用于 MiMo 申请）
- 错误堆栈输出到文件，按天滚动

**文件**：`server/lib/logger.js`（新增）、`server/index.js`。

---

### 3.5 管理后台 MVP

**痛点**：无法查看数据、看趋势、导出报表。

**方案**（最小可行版）：
- 复用 `/admin/export` 鉴权机制
- 新增简单 HTML 页面展示：
  - 总测试数、今日新增、7 日趋势图
  - 各类型分布饼图
  - AI 调用次数/Token 消耗统计（MiMo 申请的硬通货）
- 纯后端渲染简单 HTML，不依赖前端框架

**文件**：`server/routes/admin.js`（新增）。

---

## 四、MiMo Orbit 申请专项准备

### 4.1 申请材料完善

| 材料 | 当前状态 | 需要做 |
|------|---------|--------|
| GitHub 仓库 | ✅ 有 | 确认 README 英文/中文双版本 |
| 线上部署地址 | ✅ 有 | 确保可公网访问 |
| API 调用截图 | ❓ | 用 logger 输出 MiMo/DeepSeek 调用日志 → 截图 |
| 产品截图 | ❓ | AI 解读卡片 + Agent 对话 + 赛季情绪大盘 |
| 用户数据截图 | ❓ | `/api/stats` 统计数据截图 |
| Token 消耗预估 | ✅ MIMOPLAN 中有详细表格 | 基于真实调用数据修正预估 |

### 4.2 切换至 MiMo 的操作清单（申请通过后执行）

```bash
# 只需改 server/.env 的三个变量：
MIMO_API_KEY=<MiMo 发放的 Key>
MIMO_API_URL=https://api.xiaomimimo.com/v1/chat/completions
MIMO_MODEL=mimo-v2.5-pro
```

- 测试 `/api/ai/insight`、`/api/ai/chat`、`/api/ai/poster-line` 三个核心接口
- 对比 DeepSeek vs MiMo 的输出质量，调优 Prompt
- 更新 README badge 和文案中的 AI 供应商信息

---

## 五、实施优先级总览

### 🔴 P0：安全修复（已完成）

| # | 任务 | 状态 |
|---|------|------|
| 1 | 修复 Host 头 XSS | `[x]` 已完成 |
| 2 | 引入 helmet 安全头 | `[x]` 已完成 |
| 3 | 对话历史迁 Redis | `[x]` 已完成 |
| 4 | Admin export 加限频 | `[x]` 已完成 |
| 5 | 排查全量 XSS 向量 | `[x]` 已完成 |

### 🟡 P1：产品体验（申请后首周）

| # | 任务 | 工作量 |
|---|------|--------|
| 6 | 测试历史记录（localStorage） | 2 小时 |
| 7 | 类型扩充 14→20+（内容为主） | 4 小时 |
| 8 | 首页结果预览卡片 | 1 小时 |
| 9 | 品牌色 + 视觉强化 | 3 小时 |
| 10 | PWA 离线支持 | 1 小时 |

### 🟢 P2：工程质量（长线）

| # | 任务 | 工作量 |
|---|------|--------|
| 11 | TypeScript 全量迁移 | 6 小时 |
| 12 | 单元测试（scoring + context） | 3 小时 |
| 13 | GitHub Actions CI | 1 小时 |
| 14 | Pino 日志系统 | 1.5 小时 |
| 15 | 管理后台 MVP | 3 小时 |

---

## 六、一句话总结

> **Plan 2.2 不新增花哨功能，而是把 Plan 2.1 的成果从"能跑"打磨到"能扛"。安全先补、体验后加、工程最后——每一步都在为 MiMo Orbit 申请和长期运营铺路。**
