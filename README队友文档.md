# 英超TI 项目完整文档

> 供队友阅读，快速了解项目全貌

---

## 一、项目是什么

**英超TI**（Premier League Type Indicator）是一个模仿 MBTI 的球迷人格测试网站。用户回答 18 道题，系统通过五维评分模型计算球迷人格类型，并生成带有人格分析、CP 推荐、雷达图的可视化结果页。

**核心卖点**：
- 14 种深度定制的人格类型，不是套模板
- 五维人格雷达图，视觉化呈现
- 一键生成分享海报，便于朋友圈传播

---

## 二、项目进度总览

### 已完成 ✅

| 模块 | 状态 | 说明 |
|------|------|------|
| 内容策划 | ✅ | 18 道题（T-E-S-K-R 维度映射）+ 14 种人格文案 |
| 评分算法 | ✅ | scoring.js（0.8 归一化修正、fanType 动态阈值、runnerUp 次优匹配） |
| 首页 | ✅ | Landing.jsx，高保真动效 |
| 答题页 | ✅ | Quiz.jsx（进度条、滑动动画、400ms 自动跳转） |
| 结果页 | ✅ | Result.jsx（五维雷达图、CP 关系、runnerUp 卡片） |
| 海报生成 | ✅ | SharePoster.jsx（html2canvas 导出） |
| URL 状态恢复 | ✅ | 分享链接可完整还原结果 |
| 移动端 safe area | ✅ | 已处理 |

### 进行中 🔄

| 模块 | 状态 |
|------|------|
| 海报渲染层解耦 | P1，建议优化 |
| 后端统计接口 | P4，Phase 4 阶段 |
| 部署上线 | P5，Phase 5 阶段 |
| 极简视觉重构 | P6，Phase 6 阶段（单独的设计计划，不影响当前） |

---

## 三、数据结构

### 题目（questions.js）

```js
{
  id: 1,
  text: '题目文本',
  category: 'team',  // 题目分类（team/social/knowledge/emotion/resilience/identity）
  options: [
    {
      text: '选项文本',
      scores: { T: 1, E: -1 },  // 维度分值（+2/+1/-1/-2）
      teamHint: { ARS: 2 },     // 主队探测信号（可选）
      fanType: 'core'           // 球迷类型标记（core/neutral/casual，可选）
    }
  ]
}
```

**重要字段说明**：
- `scores`：每个选项对 5 个维度的加减分影响
- `teamHint`：主队探测信号，仅 Q4/Q10 使用。分数高者倾向对应主队
- `fanType`：球迷类型标记（Q17/Q18），影响主队探测的动态阈值

### 人格类型（types.js）

```js
{
  code: 'ZERO',           // 类型代号
  name: '冠压抑',         // 类型名称
  team: 'ARS',           // 所属球队（ARS/MUN/LFC/MCI/CHE/TOT/GEN）
  teamName: '阿森纳',
  tagline: '你不是不相信奇迹...',  // 一句话 slogan
  description: '...',     // 详细描述（100-150 字）
  tags: ['防御性乐观', 'PTSD 晚期', ...],  // 标签（4 个）
  bestCP: 'RIDE',         // 最佳 CP 类型代号
  worstCP: 'CTRL',        // 最对立类型代号
  ideal: { T: 4, E: 1, S: -1, K: 3, R: -4 }  // 理想五维坐标（用于欧氏距离匹配）
}
```

**14 种人格分布**：
- **Big6 专属（8 种）**：阿森纳 2 种、曼城 1 种、曼联 2 种、热刺 1 种、切尔西 1 种、利物浦 1 种
- **跨队通用（6 种）**：冠军粉、中立执法官、乐子人、喷子、云球迷、化外之民

---

## 四、核心算法

### 评分流程

```
用户答题
    ↓
[1] 分值累加：每题选项分值 → 5 维原始分数 {T, E, S, K, R}
    ↓
[2] 归一化：raw / maxPossible * 5 / 0.8 → [-5, 5] 区间
    ↓
[3] 主队探测：teamHint (Q4/Q10) + fanType (Q17/Q18) → 动态阈值判断主队
    ↓
[4] 候选集过滤：Big6 主队 → 该队专属类型 / 无主队 → 通用类型
    ↓
[5] 欧氏距离匹配：计算与各候选类型 ideal 坐标的距离 → 最小距离者为结果
    ↓
[6] 返回：最优匹配 + 次优匹配 (runnerUp) + 五维分值 + 主队检测结果
```

### 归一化公式

```js
normalized = (rawScore / maxPossible) * 5 / 0.8
```

**为什么除以 0.8？**
理论最大分做分母时，大多数用户得分会聚集在原点附近（均值回归），导致欧氏距离区分度低。乘以 `1/0.8 = 1.25` 可以"撑开"分数分布，让不同人格的坐标差异更明显。

### 主队探测阈值（动态）

| fanType 分数 | 阈值策略 | 效果 |
|-------------|----------|------|
| coreFanScore ≥ 2 | minScore=2, minMargin=0 | 核心球迷，更容易命中 Big6 |
| coreFanScore ≤ -2 | minScore=4, minMargin=2 | 泛球迷，提高阈值倾向走通用 |
| 中间值 | minScore=3, minMargin=1 | 默认策略 |

### maxPossibleScores（归一化分母）

```js
{ T: 16, E: 13, S: 20, K: 19, R: 17 }
```

计算方式：逐题统计该维度所有选项分值的绝对值最大者，累加得出。已修正，之前的值有偏差。

---

## 五、数据流与状态管理

### sessionStorage 结构

```js
quizResult: {
  type,          // 最优匹配类型对象
  runnerUp,      // 次优匹配类型对象
  normalized,    // 归一化后的五维分值
  rawScores,     // 原始分值
  detectedTeam,  // 检测到的主队（ARS/MUN/LFC/MCI/CHE/TOT/null）
  answers,       // 用户答案数组 [{questionId, optionIndex}, ...]
}
```

### URL 状态恢复

分享链接格式：`/result/{code}?ans={base64}`

**Quiz.jsx 结算时**：
```js
const encoded = btoa(JSON.stringify(answers))
navigate(`/result/${result.type.code}?ans=${encoded}`)
```

**Result.jsx 初始化时**：
```js
// 优先读 sessionStorage（正常答题流程）
// 若 sessionStorage 中 normalized/runnerUp 缺失（刷新/分享链接场景）
// 则从 URL ?ans= 解码答案，重新调用 calculateResult() 计算
// 结果回填 sessionStorage 供后续使用
```

---

## 六、文件结构

```
client/
├── src/
│   ├── App.jsx              # 路由配置：/  /quiz  /result/:code
│   ├── main.jsx             # React 入口
│   ├── index.css            # 全局样式（.glass 玻璃拟态、gradient-text 渐变文字）
│   ├── tailwind.config.js   # Tailwind 配置（英超配色、各队主色）
│   │
│   ├── data/
│   │   ├── questions.js     # 18 道题目数据 + maxPossibleScores
│   │   └── types.js         # 14 种人格类型定义 + 辅助映射
│   │
│   ├── engine/
│   │   └── scoring.js       # 核心评分引擎（导出 calculateResult 函数）
│   │
│   ├── pages/
│   │   ├── Landing.jsx      # 首页（动效设计完整）
│   │   ├── Quiz.jsx         # 答题页（带进度条、滑动动画）
│   │   └── Result.jsx       # 结果页（五维雷达图、CP 卡片、runnerUp、次优匹配）
│   │
│   └── components/
│       └── SharePoster.jsx   # 海报弹窗（html2canvas 导出 PNG）
│
├── public/                   # 静态资源
├── package.json             # 依赖：react, react-router-dom, framer-motion, html2canvas, lucide-react
└── vite.config.js            # Vite 配置
```

**不需要 Chart.js**：雷达图使用原生 SVG 实现，无额外依赖。

---

## 七、技术栈

| 层级 | 技术 | 版本 |
|------|------|------|
| 构建工具 | Vite | ^8.0 |
| 前端框架 | React | ^19.2 |
| 路由 | React Router DOM | ^7.14 |
| 样式 | Tailwind CSS | ^3.4 |
| 动画 | Framer Motion | ^12.38 |
| 图标 | Lucide React | ^1.11 |
| 海报导出 | html2canvas | ^1.4 |

---

## 八、已修复的 Bug（供排查参考）

| 日期 | 问题 | 修复方案 |
|------|------|----------|
| 2026-04-27 | maxPossibleScores 计算偏差 | 重新统计各维度实际最大分值 |
| 2026-04-27 | Q10 teamHint 给所有 Big6 都投了 1 分 | 移除该选项的 teamHint 字段 |
| 2026-04-27 | 答题返回时进度条倒流 | 引入 highestIndex state 追踪最高进度 |
| 2026-04-27 | runnerUp 未写入 sessionStorage | 结算时补全 runnerUp 字段 |
| 2026-04-27 | Result 页无雷达图 | 新增原生 SVG RadarChart 组件 |
| 2026-04-27 | 海报导出 backdrop-filter 模糊 | html2canvas onclone 时移除 backdrop-filter |
| 2026-04-28 | 分享链接状态丢失 | URL ?ans= base64 编码 + 重新计算逻辑 |

---

## 九、后续开发任务

### Phase 3（海报与分享）
- [ ] 海报静态渲染层（脱离 DOM 依赖，更稳定）
- [ ] Web Font 加载优化

### Phase 4（后端）
- [ ] server/ 目录初始化（Node.js/Express）
- [ ] MySQL 表：`quiz_results`（type_code, runner_up, detected_team, answers, created_at）
- [ ] `POST /api/result` 提交结果
- [ ] `GET /api/stats` 获取各类型占比
- [ ] 前端对接：结果页展示"全网 X% 的人和你一样"

### Phase 5（部署）
- [ ] 前端 vite build → 腾讯云 / Vercel
- [ ] 后端部署 + 数据库连通性验证
- [ ] 全流程回归测试（PC + 移动端 H5）
- [ ] SEO（title, meta description, OG 标签）

### Phase 6（视觉重构）— 独立计划，不影响当前
- [ ] 暗黑玻璃风 → 浅色极简风切换（设计师主导）

---

## 十、给新队友的建议

### 需要注意的点

1. **评分逻辑集中在 `scoring.js`**，不要在页面组件里修改评分相关逻辑
2. **sessionStorage 是主要状态传递媒介**，Quiz → Result 通过它传递结果数据
3. **URL 答案编码是可回溯的**，但答案本身以 base64 明文存在 URL 中，无隐私保护需求可以接受
4. **海报导出现在依赖 html2canvas**，如果遇到 Safari/微信内核的兼容性问题，优先查 onclone 是否生效

### 快速验证方法

```bash
cd client
npm run dev     # 开发服务器 http://localhost:5173
npm run build   # 生产构建
```

### 推荐改进方向（可认领）

1. **TypeScript 迁移**：数据类型简单，收益高
2. **Vitest 单元测试**：scoring.js 已有人格模拟测试，可扩覆盖
3. **人格稀有度 mock**：Phase 4 后端完成前先用 mock 数据占位
4. **微信 OG 标签**：每个 Result 页对应的社交分享预览图

---

*文档版本：2026-04-28*
*维护者：CodyNing-desi*
