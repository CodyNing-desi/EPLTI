# EPLTI Plan 2.3 —— 产品化与工程深度

> **前置状态**：Plan 2.1 (AI 功能) 已 100% 完成，Plan 2.2 P0 (安全修复) 已完成。
> Plan 2.3 = Plan 2.2 的 P1/P2 剩余项 + 三项真正有价值的工程深度改进。
>
> **不再包含**：3D 渲染（Three.js 太重，bundle +500KB 对 2 分钟停留的测试页没有 ROI）、音效/震动（移动端 90% 静音浏览）、天气式动态 UI（实现成本远大于收益）。这些是拿到 Token、有用户规模后再考虑的事。

---

## 一、工程深度：三条实打实的改进

### 1.1 SSE 断线保护 —— 不被浪费的 Token

**问题**：MiMo/DeepSeek 流式推流过程中，用户关闭浏览器 → Express 仍在等待大模型返回 → Token 白烧。流式传输的特性放大了这个问题：用户可能在看到一半时退出，但 API 调用已经发生。

**方案**：

```javascript
// server/routes/ai.js — insight 流式路由增加断线保护
router.post('/insight', aiLimit, async (req, res) => {
  // ... 现有逻辑 ...

  if (stream) {
    const abortController = new AbortController();

    // 客户端断开 → 立即中断上游 API 请求
    req.on('close', () => {
      abortController.abort();
    });

    const streamBody = await callMiMoAPI(prompt, {
      stream: true,
      signal: abortController.signal,  // 传给 fetch
    });

    // 同样处理 pipe 过程中的错误，避免未捕获的异常
    streamBody.on('error', (err) => {
      if (err.name !== 'AbortError') {
        console.error('Stream error:', err.message);
      }
    });

    streamBody.pipe(res);
    return;
  }
});
```

```javascript
// server/lib/mimo.js — fetch 调用增加 signal 支持
export async function callMiMoAPI(prompt, options = {}) {
  const response = await fetch(apiUrl, {
    // ...
    body: JSON.stringify({ /* ... */ }),
    signal: options.signal,  // 传递 AbortSignal
  });
}
```

**影响**：同样是 chat 路由的流式模式也需要加同样的保护。这是评委能一眼看懂"你考虑过成本控制"的细节。

**文件**：`server/routes/ai.js`、`server/lib/mimo.js`。

**工作量**：1 小时。

---

### 1.2 自动化赛事情报 Agent —— AI 自己看球

**问题**：`season-context.json` 依赖人工每轮更新，忘了更新内容就过期。PLAN2.1 的优雅降级虽然能兜底，但数据新鲜度是产品生命线。

**方案**：一个独立的 Node.js 脚本，用 cron 定时执行（或手动触发）：

```
脚本流程：
1. 调用 football-data.org API（免费 tier 足够）拉取最新积分榜和赛果
2. 将裸数据喂给 MiMo/DeepSeek：
   "以下是本周英超赛果和积分榜变化，请生成：
    - 一段 30 字以内的赛季叙事 (narrative)
    - 对以下 6 支球队的情绪判断 (mood)，每个 3-5 字: ARS, MUN, LFC, MCI, CHE, TOT
    - 3 个本周热门话题 (hot_topics)
    输出格式: JSON"
3. 覆写 server/data/season-context.json
4. 写入 updated 字段为当前日期
```

**降级策略**：
- football-data.org API 挂了 → 保留旧 JSON，首页不显示"数据更新中"警告
- AI 生成结果不合法 → JSON Schema 校验 + 人工兜底
- 先用半自动模式（脚本跑完 → 人工 review 一眼 → 确认覆写），稳定后再全自动

**叙事价值**（用于 MiMo 申请）："我们的 AI 引擎每周自动感知英超赛场变化，无人值守更新世界观。这是真正的 Event-Driven AI，不是静态 Prompt。"

**文件**：`server/cron/update-season.js`（新增）。

**工作量**：3 小时。

---

### 1.3 用户账号体系 —— 从"用完即走"到"赛季心电图"

**问题**：目前没有用户体系，每次测试是孤立的，"重复测"的体验很差——看不出任何变化。

**方案（最小可行版）**：

**第一步（前端实现，0 后端改动）**：
- `localStorage` 存储最近 3 次结果摘要（类型、分数、时间、gameweek）
- 结果页底部展示历史卡片：上次你是 XXX，这次你是 YYY，R 值变化了 +1.2
- 引导用户在不同轮次重复测试

**第二步（后端实现，有 Token 后）**：
- 微信网页授权获取 OpenID（静默授权，用户无感）
- `quiz_results` 表加 `openid` 字段
- 新增 `/api/my-history` 接口，返回该用户所有历史结果
- 前端渲染"赛季情绪折线图"——五维分数随轮次的变化趋势

```sql
-- quiz_results 表增加字段
ALTER TABLE quiz_results ADD COLUMN openid VARCHAR(64) DEFAULT NULL;
CREATE INDEX idx_openid ON quiz_results (openid);
```

**文件**：`client/src/hooks/useTestHistory.js`（新增）、`client/src/pages/Result.jsx`（新增历史卡片）、`server/routes/result.js`（新增 `/my-history`）。

**工作量**：第一步 2 小时，第二步 4 小时。

---

## 二、产品体验补完（来自 Plan 2.2 P1 剩余项）

### 2.1 类型体系扩充 14 → 20+

Big6 每队从 2 种扩充到 3 种（+6），通用类型新增 2-3 种，总计 20-22 种人格。

每新增一种类型需要定义：名称、代码、描述、tagline、4 个标签、ideal 五维向量、最佳/最差 CP。主要是内容工作量。

**文件**：`client/src/data/types.ts`。

**工作量**：4 小时。

---

### 2.2 首页"结果预览"降低参与门槛

首页底部展示 3-4 条脱敏的真实结果摘要，例如"一位阿森纳球迷被测出冠压抑，R 值 -4.2"。数据来自 `/api/stats` 的热门类型 + 静态示例混排。

**文件**：`client/src/pages/Landing.jsx`。

**工作量**：1 小时。

---

### 2.3 品牌感轻量强化

不改版，只做低成本高收益的三件事：
- 定义品牌主色（英超紫 #37003C）+ 辅助色，替代纯灰色系
- 每种人格配 emoji + 独特色值，强化"类型徽章"仪式感
- 海报新增一套暗黑模板（`dark` / `light` 切换）

不引入粒子特效、不搞大动画。保持页面加载 < 3 秒。

**文件**：`tailwind.config.js`、`client/src/data/types.ts`、`client/src/components/SharePoster.jsx`。

**工作量**：2 小时。

---

### 2.4 PWA 离线支持

`vite-plugin-pwa`，自动生成 Service Worker。静态资源 Cache First，API Network First。离线时展示简易离线页。

**文件**：`client/vite.config.js`、`client/package.json`。

**工作量**：1 小时。

---

## 三、工程质量补完（来自 Plan 2.2 P2 剩余项）

### 3.1 TypeScript 全量迁移

分批渐进式迁移，优先覆盖 props 复杂的组件：

- Batch 1：`Landing.jsx` → `.tsx`（逻辑少，练手）
- Batch 2：`Quiz.jsx`、`Compare.jsx`、`SeasonInsights.jsx` → `.tsx`
- Batch 3：`Result.jsx`（691 行，最复杂）
- Batch 4：`ChatDrawer.jsx`、`SharePoster.jsx` → `.tsx`

**文件**：`client/src/pages/*.jsx`、`client/src/components/*.jsx`。

**工作量**：6 小时。

---

### 3.2 单元测试

优先覆盖两件事（因为改这两个出 bug 的代价最大）：
- `scoring.ts`：归一化公式、主队检测阈值边界、欧氏距离匹配
- `question-context.ts`：各题在不同 season-context 下的输出

```bash
cd client && npm install -D vitest
```

**文件**：`client/src/__tests__/scoring.test.ts`、`client/src/__tests__/question-context.test.ts`。

**工作量**：3 小时。

---

### 3.3 CI/CD + 日志

- **GitHub Actions**：`push → npm ci → build → test`，防合并挂了的东西
- **Pino 日志**：请求日志 + AI 调用日志（prompt 长度、响应时间、token 用量）——后者是 MiMo 申请的硬数据

**文件**：`.github/workflows/ci.yml`、`server/lib/logger.js`。

**工作量**：2.5 小时。

---

### 3.4 管理后台 MVP

复用 `/admin/export` 鉴权，纯后端渲染简单 HTML：
- 总测试数、今日新增、7 日趋势
- 各类型分布 + 各队分布
- AI Token 消耗统计（累计 + 日均）
- 一键导出 CSV

不引入前端框架，Express 直接渲染 HTML 表格。

**文件**：`server/routes/admin.js`（新增）。

**工作量**：3 小时。

---

## 四、实施优先级总览

### 🔴 P0：已完成（Plan 2.2 安全修复）

| # | 任务 | 状态 |
|---|------|------|
| 1-5 | XSS、helmet、Redis 迁聊天记录、Admin 限频、XSS 全量排查 | ✅ 全部完成 |

### 🟡 P1：申请前/申请后首周

| # | 任务 | 来源 | 工作量 |
|---|------|------|--------|
| 6 | ✅ SSE 断线保护 | Plan 2.3 新增 | 1h |
| 7 | ✅ 自动化赛事情报 Agent | Plan 2.3 新增 | 3h |
| 8 | ✅ 测试历史记录（localStorage 版） | Plan 2.2 P1 | 2h |
| 9 | ⏸️ 类型扩充 14→20+ (暂缓) | Plan 2.2 P1 | 4h |
| 10 | ✅ 首页结果预览卡片 | Plan 2.2 P1 | 1h |
| 11 | ✅ 品牌色轻量强化 | Plan 2.2 P1 | 2h |
| 12 | ✅ PWA 离线支持 | Plan 2.2 P1 | 1h |

### 🟢 P2：拿到 Token 后

| # | 任务 | 来源 | 工作量 |
|---|------|------|--------|
| 13 | 用户账号 + 赛季心电图 | Plan 2.3 新增 | 4h |
| 14 | TypeScript 全量迁移 | Plan 2.2 P2 | 6h |
| 15 | 单元测试 | Plan 2.2 P2 | 3h |
| 16 | GitHub Actions CI | Plan 2.2 P2 | 1h |
| 17 | Pino 日志系统 | Plan 2.2 P2 | 1.5h |
| 18 | 管理后台 MVP | Plan 2.2 P2 | 3h |

---

## 五、MiMo Orbit 申请话术（三句话）

在申请表或答辩中稳住这三条线：

1. **"这不是在给产品贴一个 AI 聊天框，而是让 AI 成为产品的情绪中枢。"**
   → 展示 AI 解读 + 多轮对话 Agent + 海报金句的完整链路

2. **"我们的 Prompt 不在代码里，而在现实世界的计分板上。"**
   → 展示 Event-Driven Prompting：season-context.json → 动态引言 → AI 解读随赛况变化。如果情报 Agent 做完了，加上"AI 每周自己看球更新世界观"

3. **"Token 的每一分钱都花在刀刃上。"**
   → 展示 Redis 缓存（同类型同轮次不重复调 API）+ SSE 断线保护（用户走了立刻掐断请求）。评委审过无数项目，成本控制意识比视觉效果更能证明你认真思考过规模化

---

> **一句话总结**：Plan 2.3 不做任何"为了炫而炫"的功能。砍掉 3D/音效/粒子特效，把精力集中在真正影响产品生命力的事上——不浪费 Token、不让内容过期、不让用户觉得"测过一次就够了"。
