# 英超TI 项目执行计划 (Consolidated Review)

## 1. 项目概览与当前进度
「英超TI」是一个模仿 MBTI 的球迷人格测试网站，旨在通过 18 道题挖掘英超球迷的深层人格。

### 已完成 (Done)
- [x] **内容策划**: 18 道题 (T-E-S-K-R 维度映射) 及 14 种人格深度文案。
- [x] **前端框架**: Vite + React + Tailwind v3 + Framer Motion。
- [x] **页面基础**: Landing, Quiz, Result 基础功能及海报生成组件。
- [x] **Phase 2 UX 升级**: 进度条修复、雷达图、runnerUp 卡片、海报渲染优化。
- [x] **Phase 3 海报**: SharePoster 组件完成（含 html2canvas 导出）。
- [x] **Phase 1 算法**: scoring.js 优化（0.8 修正系数、fanType 动态阈值、runnerUp）。
- [x] **Phase 1 测试**: 14 种人格模拟验证（精确 71.4%，Top-2 100%）。

---

## 2. 核心算法设计 (T-E-S-K-R)

### 2.1 维度定义
| 维度 | 全称 | 说明 |
|------|------|------|
| T | Team Loyalty | 死忠程度：+5 死忠 / -5 泛球迷 |
| E | Emotion | 激情：+5 狂热感性 / -5 冷静理性 |
| S | Social | 社交：+5 社区活跃 / -5 独自观赛 |
| K | Knowledge | 懂球：+5 战术数据 / -5 直觉氛围 |
| R | Resilience | 韧性：+5 乐观 / -5 悲观防御 |

### 2.2 算法流程
1. **分值累加**: 用户每题选择对应维度加减分
2. **归一化**: `(raw / maxPossible) * 5 / 0.8`，撑开分数分布对抗均值回归
3. **主队探测**: teamHint (Q4/Q10) + fanType (Q17/Q18) 双重信号，动态阈值
4. **欧氏距离匹配**: 在候选类型中找距离最近的 + 次优匹配

### 2.3 主队分流逻辑
- Big6 主队 → 只在对应球队专属类型中匹配（如 ARS → ZERO, WENGER）
- 通用类型 → 在 6 个通用类型中匹配（CAPS, REF, LOL, XXXX, CLOUD, FREE）

---

## 3. 待修复问题 (Critical Issues)

### 🔴 P0 - URL 状态丢失（分享链接失效）

**问题描述**:
直接访问 `/result/:code` 或刷新结果页，雷达图、分数字条、次优匹配卡片全部消失。

**根本原因**:
- Result 页依赖 `sessionStorage` 中的 `quizResult`
- 刷新后 `sessionStorage` 还在，但 `normalized`/`runnerUp` 等数据读取流程存在 undefined 风险
- 分享链接 `http://xxx/result/ZERO` 自包含信息不足，无法恢复完整结果

**影响范围**:
- 用户分享结果给朋友 → 朋友看到残缺页面
- 微信/朋友圈分享 → 落地页不完整

**修复方案 (三选一)**:

| 方案 | 优点 | 缺点 |
|------|------|------|
| A. URL Query Param | 最简单，分享即传播 | URL 变长，敏感数据暴露 |
| B. URL Hash + 编码答案 | 短链友好，可还原 | 需编解码逻辑，答案暴露 |
| C. 服务端存储 + 短 ID | 安全，可做统计 | 需要后端 |

**推荐方案 B**: 将用户答案编码到 URL hash 中（如 `#/result/ZERO?ans=base64`），Result 页从 hash 解码恢复 `normalized` 和 `runnerUp`。评分在客户端完成，不需要后端。

**实现要点**:
```js
// Quiz.jsx 结算时
const encoded = btoa(JSON.stringify(answers))
navigate(`/result/${result.type.code}?ans=${encoded}`)

// Result.jsx 初始化时
const params = new URLSearchParams(location.search)
const answers = params.get('ans') ? JSON.parse(atob(params.get('ans'))) : null
if (answers) {
  const result = calculateResult(answers)
  // 用 result 覆盖 sessionStorage
}
```

---

### 🔴 P0 - 移动端适配缺失

**问题**:
- 进度条 fixed 定位未考虑 iOS safe area（刘海屏底部被切）
- 选项按钮在小屏上偏小，4 个选项间距局促
- 字体大小在极窄屏上溢出

**修复**:
- 进度条 container 加 `pb-safe` 或手动 `padding-bottom: env(safe-area-inset-bottom)`
- 选项按钮加 `min-h-[3rem]` 或响应式调整 padding
- 标题加 `break-words` 或 `text-wrap` 防止溢出

---

### 🟡 P1 - 海报导出稳定性

**问题**:
`html2canvas` 在部分设备上克隆 DOM 时 `backdrop-filter` 样式随机丢失，`onclone: none` 不是万全之策。

**改进方案**:
将海报组件彻底解耦为独立渲染层：
1. 创建 `<PosterRenderer>` 组件，接收纯数据 props
2. 在 `SharePoster` 内部构建一个与 DOM 完全隔离的 `<div>` 结构
3. 使用 `scale` 而非 `backdrop-filter` 模拟模糊效果（CSS filter 不依赖 backdrop）

---

## 4. 后续开发任务清单

### Phase 1: 算法与数据加固 ✅
- [x] `scoring.js` fanType 动态阈值 + 0.8 修正 + runnerUp
- [x] `questions.js` Q17/Q18 fanType 字段
- [x] 测试验证（14 种人格 71.4% 精确 / 100% Top-2）

### Phase 2: 交互体验升级 ✅
- [x] 进度条回退修复（highestIndex state）
- [x] runnerUp 存储与展示
- [x] 原生 SVG 五维雷达图
- [x] 海报 html2canvas onclone 优化
- [ ] 400ms 选中停顿（已实现 setTimeout 400ms，但无"切换选项"能力）
- [ ] 人格稀有度 UI 骨架（等 Phase 4 后端）

### Phase 3: 海报与分享兼容性 ⚠️
- [x] SharePoster 组件完成
- [ ] 海报静态渲染层（脱离 DOM 依赖）
- [ ] Web Font 加载优化
- [ ] URL 状态恢复（见 Section 3 P0）

### Phase 4: 后端与统计 (Tencent Cloud)
- [ ] `server/` 文件夹初始化 (Node.js/Express)
- [ ] MySQL 建表 (`quiz_results`)
- [ ] 接口：`POST /api/result`
- [ ] 接口：`GET /api/stats`
- [ ] 前端对接：人格稀有度统计

### Phase 5: 部署与上线打磨
- [ ] 前端 `vite build` 部署
- [ ] 后端部署 + 数据库连通性验证
- [ ] 全流程回归测试（PC + 移动端 H5）
- [ ] SEO 优化（title, meta, OG 标签已基础添加 ✅）
- [ ] 微信 JSSDK 配置（实现自定义分享文案与图标，需后端配合）

### Phase 6: 前端视觉重构 (Minimalist Redesign) ✅
- [x] 全局浅色主题切换
- [x] Result/Landing/Quiz 极简风格适配
- [ ] Route A: 抽卡插图集成 (To-be handled by CC-Haha)
    - [ ] 将 14 张插图存入 `client/public/images/`，文件名为 `TYPE_CODE.png` (如 `ZERO.png`)
    - [ ] 检查 `Result.jsx` 中的 `img` 标签加载逻辑，确保 `onError` 占位状态正常
    - [ ] 联调 `SharePoster.jsx` 海报合成，确保插图能正确渲染到海报中

---

## 5. 改进建议 (Recommended Improvements)

### 5.1 架构层面

**加 TypeScript**
- 这个项目数据类型简单（Question, Option, Type, Score），迁移成本低
- `scoring.js` 的输入输出加类型约束后调试效率大幅提升

**统一数据流**
- 当前 `sessionStorage` 承载了 `type`, `runnerUp`, `normalized`, `rawScores`, `detectedTeam`
- 建议封装为单一 `QuizResult` 对象，Result 页按需解构
- 避免 `stored?.xxx || null` 三连重复

```ts
interface QuizResult {
  type: Type
  runnerUp: Type | null
  normalized: Scores
  rawScores: Scores
  detectedTeam: Team | null
  answers: Answer[]  // 用于 URL 状态恢复
}
```

**路由层面**
- React Router v7 配置需显式声明 `/quiz` 和 `/result/:code` 路由
- ~~当前 App.jsx 只有 `/`~~ ✅ 已确认 App.jsx 三个路由均已正确注册

### 5.2 产品层面

**人格稀有度展示**
- "全网 X% 的人和你一样" 是很强的社交货币
- Phase 4 后端未完成前，可先用 mock 数据 + "真实数据待上线" 的空状态占位

**微信分享优化**
- 当前 OG 标签缺失，分享到微信/朋友圈只有链接没有预览图
- 建议每个 Result 页生成静态 OG 图片（或利用海报底图）

**答题过程数据**
- 可记录每道题的答题时间（ms），用于分析题目难度/区分度
- 作为未来"人格侧写"功能的原始数据积累

### 5.3 工程化

| 建议 | 优先级 | 说明 |
|------|--------|------|
| ESLint + Prettier | 🟡 中 | 防止多人协作代码风格冲突 |
| Vitest 单元测试 | 🟡 中 | scoring.js 已有 mjs 测试，继续扩覆盖 |
| Pre-commit Hook | 🟢 低 | lint-staged + husky |
| 环境变量管理 | 🟢 低 | `.env.example` 模板 |

---

## 6. Bug 修复记录

| 日期 | 问题 | 修复文件 | 状态 |
|------|------|----------|------|
| 2026-04-27 | maxPossibleScores 计算偏差 | questions.js | ✅ |
| 2026-04-27 | Q10 teamHint 全部赋值导致信号稀释 | questions.js | ✅ |
| 2026-04-27 | 进度条回退问题 | Quiz.jsx | ✅ |
| 2026-04-27 | runnerUp 未存储 | Quiz.jsx | ✅ |
| 2026-04-27 | Result 页无雷达图 | Result.jsx | ✅ |
| 2026-04-27 | 海报 backdrop-filter 模糊 | SharePoster.jsx | ✅ |
| 2026-04-28 | URL 分享状态丢失 | Quiz.jsx, Result.jsx | ✅ |
| 2026-04-28 | 移动端 safe area | - | ✅ |
| 2026-04-28 | 微信/社交预览 (OG Tags) | index.html | ✅ |

### 实现细节（2026-04-28 URL 状态恢复）
- **Quiz.jsx**: 结算时将答案数组 `btoa(JSON.stringify(answers))` 编码后写入 URL query param `?ans=...`
- **Result.jsx**: 优先读 sessionStorage，若 `normalized`/`runnerUp` 缺失且 URL 有答案，则 `atob` 解码后调用 `calculateResult()` 重新计算，并回填 sessionStorage

---

## 7. 文件结构 (当前)

```
client/src/
├── App.jsx           # 路由配置（需确认 /quiz /result 路由是否注册）
├── main.jsx
├── index.css         # 玻璃拟态 + 渐变文字 + .glass
├── tailwind.config.js
├── data/
│   ├── questions.js  # 18 题 + maxPossibleScores + fanType
│   └── types.js      # 14 种人格 + ideal 坐标 + CP 关系
├── engine/
│   └── scoring.js    # 评分引擎（核心算法）
├── pages/
│   ├── Landing.jsx   # 首页
│   ├── Quiz.jsx      # 答题页
│   └── Result.jsx    # 结果页（含雷达图 + runnerUp）
└── components/
    └── SharePoster.jsx  # 海报生成
```

---

## 8. 核心矛盾与权衡

1. **分享深度 vs 隐私**: 答案编码进 URL 可实现无后端分享，但用户答案对 URL 接收者可见。权衡：球迷人格测试答案无敏感隐私，可接受。

2. **海报保真度 vs 渲染兼容性**: `backdrop-filter` 视觉效果佳但 `html2canvas` 支持不稳定。权衡：保持现有 onclone 方案，上线后监控反馈，必要时切纯 CSS 方案。

3. **功能完整度 vs 上线节奏**: Phase 4 后端完成前"稀有度统计"为空，但 Phase 2 UX 功能已基本可用。权衡：先上线 MVP，Phase 4 后端并行开发。
