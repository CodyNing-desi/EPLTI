# EPLTI × MiMo — 让英超TI随赛季「呼吸」的 AI 升级方案

> **目标**：将 EPLTI 从"静态人格测试"升级为"AI 驱动、赛事感知的动态球迷心理分析平台"，
> 同时以此申请 **Xiaomi MiMo Orbit 百万亿 Token 创造者激励计划**（截止 2026.5.28）。
>
> **核心理念**：题目骨架不变（保证评分系统稳定），但上下文、解读、对话全部跟随英超赛程动态生成。
> 让产品像英超赛季一样——**每周都有新剧情**。

---

## 一、架构总览

```
┌─────────────────────────────────────────────────────────────────┐
│                        EPLTI 2.0 架构                          │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│   ┌──────────────┐    ┌──────────────┐    ┌──────────────────┐ │
│   │  赛事上下文层  │    │  核心评分引擎  │    │   MiMo AI 层     │ │
│   │  (Season      │    │  (T-E-S-K-R   │    │  (API 调用)      │ │
│   │   Context)    │    │   Scoring)    │    │                  │ │
│   └──────┬───────┘    └──────┬───────┘    └────────┬─────────┘ │
│          │                   │                      │           │
│          ▼                   ▼                      ▼           │
│   ┌─────────────────────────────────────────────────────────┐  │
│   │                    展示与交互层                           │  │
│   │  Landing → Quiz(动态引言) → Result(AI解读) → Agent对话   │  │
│   └─────────────────────────────────────────────────────────┘  │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

**三大新增模块**：
1. **赛事上下文层**：每周更新积分榜/赛果，注入题目场景和 AI prompt
2. **MiMo AI 层**：个性化解读、动态文案、Agent 对话
3. **动态展示层**：结果页/海报/首页随赛季变化

---

## 二、赛事上下文层（Season Context）

### 2.1 数据结构

```
server/
└── data/
    └── season-context.json    ← 每轮英超后更新
```

```json
{
  "gameweek": 35,
  "updated": "2026-05-01",
  "season": "2025-26",
  "standings": [
    { "team": "LFC", "name": "利物浦", "points": 82, "pos": 1 },
    { "team": "ARS", "name": "阿森纳", "points": 79, "pos": 2 },
    { "team": "MCI", "name": "曼城", "points": 75, "pos": 3 },
    { "team": "CHE", "name": "切尔西", "points": 63, "pos": 4 },
    { "team": "MUN", "name": "曼联", "points": 55, "pos": 7 },
    { "team": "TOT", "name": "热刺", "points": 52, "pos": 9 }
  ],
  "recent_results": [
    "阿森纳 0-1 纽卡斯尔 (GW34)",
    "曼城 3-0 狼队 (GW34)",
    "热刺 2-4 利物浦 (GW34)"
  ],
  "narrative": "争冠白热化：利物浦领跑3分，阿森纳关键战掉链子",
  "mood": {
    "ARS": "崩溃",
    "MCI": "稳健追击",
    "LFC": "意气风发",
    "TOT": "麻木",
    "MUN": "迷茫",
    "CHE": "谨慎乐观"
  },
  "hot_topics": [
    "萨卡伤退引发阿森纳球迷恐慌",
    "哈兰德本赛季第30球"
  ]
}
```

### 2.2 更新策略

| 方式 | 说明 | 工作量 |
|------|------|--------|
| **手动更新** | 每轮比赛后花 10 分钟更新 JSON | 最简单，先用这个 |
| **半自动** | 写一个脚本从 football-data.org API 拉取积分榜，手动补 narrative | 中等 |
| **全自动** | 定时任务抓取 + MiMo 自动生成 narrative/mood | 后期优化 |

### 2.3 API 端点

```javascript
// server/routes/season.js
router.get('/season-context', (req, res) => {
  const context = JSON.parse(fs.readFileSync('./data/season-context.json', 'utf8'))
  res.json(context)
})
```

---

## 三、MiMo AI 集成（核心）

### 3.1 AI 个性化解读（P0 — 第一优先级）

**场景**：用户完成测试后，结果页展示一段基于当前赛事的 AI 定制解读。

```javascript
// server/routes/ai-insight.js

router.post('/ai-insight', strictLimit, async (req, res) => {
  const { type_code, normalized, detected_team } = req.body
  const season = JSON.parse(fs.readFileSync('./data/season-context.json', 'utf8'))
  
  // 找到用户主队的当前状态
  const teamStatus = detected_team 
    ? season.standings.find(s => s.team === detected_team) 
    : null
  const teamMood = detected_team ? season.mood[detected_team] : null

  const prompt = `你是一位毒舌但有洞察力的英超球迷心理分析师。

【当前赛事背景】
- 第 ${season.gameweek} 轮，${season.narrative}
- 最近赛果：${season.recent_results.join('；')}
${teamStatus ? `- 该球迷主队 ${teamStatus.name} 目前积分榜第 ${teamStatus.pos} 名，${teamStatus.points} 分，当前情绪：${teamMood}` : '- 未检测到固定主队'}

【用户画像】
- 人格类型：${type_code}
- 五维得分：T(死忠)=${normalized.T}, E(激情)=${normalized.E}, S(社交)=${normalized.S}, K(懂球)=${normalized.K}, R(韧性)=${normalized.R}

请写一段 150-200 字的个性化深度解读：
1. 结合【当前积分形势和最近赛果】分析这位球迷此刻的心理状态
2. 根据极端维度分数给出精准吐槽（比如 R=-4 就是韧性崩塌，要戳痛点）
3. 语气幽默、有梗、像朋友间的互黑，但要有真正的心理洞察
4. 最后给一句专属的"本轮球迷箴言"（要够扎心或够燃）`

  const response = await callMiMoAPI(prompt)
  res.json({ ok: true, insight: response })
})

async function callMiMoAPI(prompt, options = {}) {
  const res = await fetch('https://api.xiaomimimo.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${process.env.MIMO_API_KEY}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      model: options.model || 'mimo-v2.5-pro',
      messages: [{ role: 'user', content: prompt }],
      temperature: options.temperature || 0.85,
      max_tokens: options.maxTokens || 600
    })
  })
  const data = await res.json()
  return data.choices[0].message.content
}
```

**前端集成**：

```jsx
// Result.jsx 结果页新增 AI 解读卡片
const [aiInsight, setAiInsight] = useState(null)
const [loadingAI, setLoadingAI] = useState(false)

useEffect(() => {
  if (!type || !normalized) return
  setLoadingAI(true)
  fetch(`${API_BASE}/api/ai-insight`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ type_code: type.code, normalized, detected_team: detectedTeam })
  })
    .then(r => r.json())
    .then(data => { if (data.ok) setAiInsight(data.insight) })
    .finally(() => setLoadingAI(false))
}, [type, normalized])

// 渲染
{loadingAI ? (
  <AILoadingCard /> // 带打字机效果的骨架屏
) : aiInsight ? (
  <motion.div variants={item} className="p-6 rounded-2xl bg-gradient-to-br from-purple-50 to-pink-50 border ...">
    <h3>🤖 AI 本轮深度解读</h3>
    <p className="text-sm ...">{aiInsight}</p>
    <span className="text-[10px] ...">基于第 {gameweek} 轮赛事 · Powered by MiMo</span>
  </motion.div>
) : null}
```

### 3.2 动态题目引言（P0）

题目评分逻辑完全不变，只在题目前加一句赛事引言增加代入感：

```javascript
// client/src/data/question-context.ts

// 每道题可选的动态引言模板（按赛事情绪匹配）
export const questionContexts: Record<number, (ctx: SeasonContext) => string | null> = {
  // Q5: "85分钟0-1落后"
  5: (ctx) => {
    const upset = ctx.recent_results.find(r => r.includes('0-1') || r.includes('1-2'))
    return upset ? `📺 上轮刚发生：${upset}\n——现在想象你的主队也遇到了这种情况：` : null
  },
  // Q9: "主队降级你还看吗"
  9: (ctx) => {
    const bottom = ctx.standings.filter(s => s.pos >= 18)
    return bottom.length > 0 
      ? `⚠️ 本赛季降级区：${bottom.map(s => s.name).join('、')}\n——如果你的主队也在这个位置：` 
      : null
  },
  // Q1: "死敌赢球的反应"
  1: (ctx) => {
    return ctx.narrative ? `📰 ${ctx.narrative}\n——在这个节骨眼上，回答下面的问题：` : null
  },
}
```

```jsx
// Quiz.jsx 渲染时
const seasonCtx = useSeasonContext() // 从 /api/season-context 获取
const dynamicIntro = questionContexts[currentQ.id]?.(seasonCtx)

<div className="mb-8">
  {dynamicIntro && (
    <p className="text-xs text-amber-600 bg-amber-50 px-4 py-2 rounded-xl mb-4 ...">
      {dynamicIntro}
    </p>
  )}
  <h2 className="text-2xl font-bold">{currentQ.text}</h2>
</div>
```

### 3.3 AI 球迷对话 Agent（P1）

结果页底部新增"和你的球迷人格聊聊"入口，打开聊天界面：

```javascript
// server/routes/ai-chat.js

const conversationStore = new Map() // 生产环境用 Redis

router.post('/ai-chat', strictLimit, async (req, res) => {
  const { session_id, message, type_code, normalized, detected_team } = req.body
  const season = loadSeasonContext()
  const type = TYPES[type_code]
  
  // 获取或初始化对话历史
  let history = conversationStore.get(session_id) || []
  
  if (history.length === 0) {
    // 首次对话，注入 System Prompt
    history.push({
      role: 'system',
      content: `你是一位资深英超球迷，同时也是球迷心理分析师。

你正在和一位「${type.name}」(${type_code}) 类型的球迷聊天。
他的五维画像：T=${normalized.T}, E=${normalized.E}, S=${normalized.S}, K=${normalized.K}, R=${normalized.R}
${detected_team ? `他的主队是 ${season.standings.find(s => s.team === detected_team)?.name || detected_team}` : '他没有固定主队'}

当前赛事背景：第${season.gameweek}轮，${season.narrative}

你的人设：
- 说话风格：像一个混迹虎扑十年的老哥，幽默毒舌但有真知灼见
- 会根据他的人格类型调整话风（对冠压抑温柔点，对乐子人可以互喷）
- 聊天要自然，不要像客服，不要每次都提他的测试结果
- 可以主动聊最近的比赛、转会、争议事件
- 每次回复控制在 80-150 字`
    })
  }
  
  history.push({ role: 'user', content: message })
  
  const response = await callMiMoAPI(null, {
    messages: history,
    temperature: 0.9,
    maxTokens: 300
  })
  
  history.push({ role: 'assistant', content: response })
  
  // 只保留最近 20 轮对话 (控制 token)
  if (history.length > 41) history = [history[0], ...history.slice(-40)]
  conversationStore.set(session_id, history)
  
  res.json({ ok: true, reply: response })
})
```

### 3.4 AI 动态海报文案（P1）

海报的 tagline 从静态改为 AI 生成：

```javascript
// server/routes/ai-insight.js 新增
router.post('/ai-poster-line', strictLimit, async (req, res) => {
  const { type_code, detected_team } = req.body
  const season = loadSeasonContext()
  
  const prompt = `为一位「${type_code}」类型的英超球迷写一句海报金句（15-25字）。
当前第${season.gameweek}轮，${season.narrative}。
${detected_team ? `主队：${season.standings.find(s => s.team === detected_team)?.name}` : ''}
要求：扎心/燃/自嘲三选一，适合发朋友圈。只输出金句本身，不要引号。`

  const line = await callMiMoAPI(prompt, { maxTokens: 100, temperature: 0.95 })
  res.json({ ok: true, line: line.trim() })
})
```

### 3.5 AI PK 对比分析（P2）

两个用户测完后的趣味对比：

```javascript
router.post('/ai-compare', strictLimit, async (req, res) => {
  const { userA, userB } = req.body // 各含 type_code, normalized, detected_team
  const season = loadSeasonContext()
  
  const prompt = `两位英超球迷做完人格测试，帮他们写一段 150 字的趣味对比分析：

球迷A：${userA.type_code}（${TYPES[userA.type_code].name}），主队 ${userA.detected_team || '无'}
球迷B：${userB.type_code}（${TYPES[userB.type_code].name}），主队 ${userB.detected_team || '无'}
当前赛事：${season.narrative}

要求：
1. 找出他们最大的分歧维度
2. 用一个英超场景比喻他们的差异
3. 最后给一个"友谊指数"（0-100%）和一句话评价`

  const analysis = await callMiMoAPI(prompt)
  res.json({ ok: true, analysis })
})
```

---

## 四、动态展示层改动

### 4.1 首页动态文案

```jsx
// Landing.jsx — 根据赛事上下文动态调整首页文案
const seasonCtx = useSeasonContext()

// 替换静态的 "18道题，看透你的看球底色"
const dynamicTagline = seasonCtx ? (
  <>
    {seasonCtx.narrative}<br/>
    你的心态是哪种？来确诊一下。<br/>
    <span className="font-bold text-gray-900">
      {seasonCtx.gameweek >= 30 ? '9道题。争冠倒计时，撕开你的球迷面具。' : '9道题，看透你的看球底色。'}
    </span>
  </>
) : defaultTagline
```

### 4.2 结果页赛事关联卡片

```jsx
// Result.jsx — 新增"你的主队本轮"卡片
{seasonCtx && detectedTeam && (
  <motion.div variants={item} className="p-5 rounded-2xl bg-gradient-to-r from-gray-900 to-gray-800 text-white mb-6">
    <div className="flex justify-between items-center mb-2">
      <span className="text-xs font-bold uppercase tracking-wider text-gray-400">
        第 {seasonCtx.gameweek} 轮 · 你的主队
      </span>
      <span className="text-xs px-2 py-0.5 rounded-full" 
        style={{ backgroundColor: teamColor }}>
        {teamNames[detectedTeam]}
      </span>
    </div>
    <p className="text-2xl font-black">
      积分榜第 {seasonCtx.standings.find(s => s.team === detectedTeam)?.pos} 名
    </p>
    <p className="text-sm text-gray-400 mt-1">
      {seasonCtx.mood[detectedTeam]} · {seasonCtx.standings.find(s => s.team === detectedTeam)?.points} 分
    </p>
  </motion.div>
)}
```

### 4.3 "赛季情绪指数"可视化（P2 加分项）

在结果页或独立页面展示全网球迷情绪趋势：

```
   全网「冠压抑」韧性(R)均值随赛季变化
   
   R值
    2 ┤                              
    0 ┤──────╮         ╭──           
   -2 ┤      ╰───╮   ╭╯             
   -4 ┤          ╰───╯  ← GW34 阿森纳崩盘
      └──────────────────────── 赛周
       GW28  GW30  GW32  GW34
```

后端每轮统计各类型的平均维度分数并存入 `season_stats` 表。

---

## 五、Token 消耗预估（申请表关键数据）

| 功能 | 每次调用 Token | 每日调用次数(预估) | 日消耗 |
|------|---------------|-------------------|--------|
| AI 个性化解读 | ~800 tokens | 300-500 次 | 24-40 万 |
| AI 对话 Agent | ~1200 tokens/轮 | 200 次 × 3 轮 | 72 万 |
| AI 海报文案 | ~200 tokens | 200 次 | 4 万 |
| AI PK 对比 | ~600 tokens | 50 次 | 3 万 |
| **日均总计** | | | **~100-120 万 tokens** |
| **月均总计** | | | **~3000-3600 万 tokens** |

> 赛季关键节点（争冠决战、德比周）流量可能翻 3-5 倍 → 峰值日消耗 300-500 万 tokens。

---

## 六、文件改动清单

### 新增文件

| 文件 | 说明 |
|------|------|
| `server/data/season-context.json` | 赛事上下文数据（每周更新） |
| `server/routes/ai-insight.js` | AI 解读 + 海报文案 API |
| `server/routes/ai-chat.js` | AI 对话 Agent API |
| `server/routes/ai-compare.js` | AI PK 对比 API |
| `server/lib/mimo.js` | MiMo API 调用封装 |
| `client/src/data/question-context.ts` | 题目动态引言映射 |
| `client/src/hooks/useSeasonContext.js` | 获取赛事上下文 Hook |
| `client/src/components/AIInsightCard.jsx` | AI 解读展示组件 |
| `client/src/components/ChatDrawer.jsx` | Agent 对话抽屉组件 |
| `client/src/pages/ComparePage.jsx` | PK 对比页（P2） |

### 修改文件

| 文件 | 改动 |
|------|------|
| `server/index.js` | 注册新路由，加载 season-context |
| `client/src/pages/Landing.jsx` | 动态首页文案 + 赛事上下文 |
| `client/src/pages/Quiz.jsx` | 题目动态引言 |
| `client/src/pages/Result.jsx` | AI 解读卡片 + 赛事关联卡片 + Agent 入口 |
| `client/src/components/SharePoster.jsx` | 动态海报文案 |
| `server/.env` | 新增 `MIMO_API_KEY` |

---

## 七、执行计划

### Phase 1：AI 核心接入（Day 1-2）🔴 必做

```
Day 1 上午  ── [x] 创建 season-context.json，填入当前赛事数据
Day 1 上午  ── [x] 封装 MiMo API 调用库 (server/lib/mimo.js)
Day 1 下午  ── [x] 实现 /api/ai/insight 接口
Day 1 下午  ── [x] 前端 Result.jsx 集成 AI 解读卡片
Day 2 上午  ── [x] 实现题目动态引言 (question-context.ts + Quiz.jsx)
Day 2 下午  ── [x] 首页动态文案 + 结果页赛事关联卡片
Day 2 晚上  ── [x] 端到端测试，确保 MiMo API 调用正常
```

### Phase 2：Agent 对话（Day 3）🔴 必做

```
Day 3 上午  ── [x] 实现 /api/ai/chat 多轮对话接口 + 对话状态管理
Day 3 下午  ── [x] 前端 ChatDrawer 组件 + 结果页集成
Day 3 晚上  ── [x] 测试多轮对话，调优 System Prompt (英超黑梗注入)
```

### Phase 3：提交申请（Day 4）🔴 必做

```
Day 4 上午  ── 部署到腾讯云，确认线上 MiMo API 可用
Day 4 上午  ── 截图：AI 解读效果、Agent 对话效果、API 调用日志
Day 4 下午  ── 填写 MiMo Orbit 申请表单（见下方模板）
```

### Phase 4：增强功能（Day 5-7）🟡 可选

```
Day 5  ── AI 动态海报文案
Day 6  ── PK 对比页 + AI 对比分析
Day 7  ── 赛季情绪指数可视化
```

---

## 八、MiMo Orbit 申请表单模板

### 开发场景描述

```
我正在开发 EPLTI（英超球迷人格分析平台），一个 AI 驱动的、随英超赛季
动态变化的球迷心理测试产品。已有线上用户和真实数据。

核心 AI 使用场景：
1. 个性化人格解读 Agent：基于 MiMo-V2.5-Pro，结合用户五维心理画像 + 
   实时英超积分榜/赛果，为每位用户生成独一无二的深度心理分析
2. 球迷陪聊 Agent（多轮对话）：以用户人格类型为 System Prompt，构建
   赛事感知的个性化对话机器人，可讨论战术、赛事、转会等话题
3. 动态内容生成：AI 生成海报金句、PK 对比分析文案等社交传播内容
4. 赛事上下文推理：每轮英超结束后，AI 结合最新积分形势重新解读用户画像

技术特色：
- 静态评分骨架 + 动态 AI 上下文的混合架构，兼顾测试信度和内容新鲜度
- 每周英超赛事数据驱动 prompt 更新，产品内容随赛季呼吸
- 完整的前后端 + 数据库 + 社交分享链路

预估 Token 消耗：
- 日均 100-120 万 tokens（解读 + 对话 + 文案生成）
- 赛季关键节点峰值可达 300-500 万 tokens/天
- 月均消耗约 3000-3600 万 tokens
```

### 证明材料准备

- [x] GitHub 仓库（完整代码，含 AI 集成）
- [x] 线上部署地址
- [x] API 调用截图（终端显示 MiMo 调用日志 + Thought 过程）
- [x] 产品截图（AI 解读卡片、Agent 对话界面）
- [x] 用户数据截图（/api/stats 真实统计）
- [ ] 过往 AI 平台消费账单（如有）

---

## 九、风险与备案

| 风险 | 影响 | 应对 |
|------|------|------|
| MiMo API 响应慢 | 用户等待体验差 | AI 解读异步加载 + 骨架屏，静态描述先展示 |
| API 额度耗尽 | AI 功能不可用 | 优雅降级到静态文案，前端判断 AI 不可用时隐藏 AI 卡片 |
| season-context 忘记更新 | 内容过期 | 加 `updated` 字段检测，超过 7 天在首页显示"数据更新中" |
| MiMo API 格式变更 | 接口报错 | mimo.js 统一封装，一处修改全局生效 |
| 审核未通过 | 拿不到 Token | 可替换为 DeepSeek/其他模型 API，架构不绑定单一供应商 |

---

## 十、一句话总结

> **EPLTI + MiMo = 一个会随英超赛季呼吸的 AI 球迷心理分析平台。**
> **题目骨架不动、评分系统不变，但每一个用户、每一轮英超，看到的解读都是独一无二的。**
> **这不是给产品贴一个 AI 标签，而是让 AI 成为产品的心跳。**
