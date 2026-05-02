# EPLTI (英超 TI) — AI 驱动的球迷人格分析平台

![Status](https://img.shields.io/badge/Status-Live-success?style=for-the-badge)
![React](https://img.shields.io/badge/React-20232A?style=for-the-badge&logo=react&logoColor=61DAFB)
![TypeScript](https://img.shields.io/badge/TypeScript-007ACC?style=for-the-badge&logo=typescript&logoColor=white)
![Express](https://img.shields.io/badge/Express.js-000000?style=for-the-badge&logo=express&logoColor=white)
![Redis](https://img.shields.io/badge/Redis-DC382D?style=for-the-badge&logo=redis&logoColor=white)
![AI](https://img.shields.io/badge/AI-DeepSeek_V4_%2F_MiMo-671ddf?style=for-the-badge)

**EPLTI** (Premier League Type Indicator) 是一个 **AI 驱动的、随英超赛季动态变化** 的球迷心理画像测试平台。通过 18 道原创测试题，基于独创的 **T-E-S-K-R** 五大维度模型（死忠·激情·社交·懂球·韧性），将球迷划分为 14 种独特人格类型，并结合大模型生成 **千人千面的赛季感知深度解读**。

> **题目骨架不变，评分系统不动——但每一个用户、每一轮英超，看到的解读都是独一无二的。**

---

## ✨ 核心特性

### 🧠 AI 原生架构
- **个性化 AI 洞察**：结合五维画像 + 实时赛事数据，自动生成毒舌且有深度的人格解读
- **AI 球迷 Agent**：多轮对话，AI 根据人格类型与主队表现调整语气和话题
- **AI 海报金句 / PK 对比**：社交传播内容由 AI 实时生成
- **全链路 SSE 流式输出**：打字机效果 + `AbortController` 断线保护，用户走了立刻掐断请求
- **Redis 多级缓存**：`insight:{gameweek}:{type}:{team}` 同类型同轮次不重复调 API
- **优雅降级**：无 API Key / 无 Redis → 自动切换本地预设文案，UI 不中断

### 📡 Event-Driven Prompting — 赛季动态感知
- **赛季上下文引擎**：`season-context.json` 管理轮次、积分榜、赛果、各队情绪
- **自动化情报 Agent**：`cron/update-season.js` 拉取 football-data.org → AI 生成叙事与情绪 → 覆写 JSON
- **答题动态引言**：关键题目根据实时积分形势自动注入赛事上下文
- **赛季情绪指数**：聚合全网球迷的 T-E-S-K-R 维度表现

### ⚽ 沉浸式体验
- 18 道原创题目 · Framer Motion 方向感应滑动 · SVG 雷达图 + 维度条形图
- 14 种球迷人格（8 绑定 Big6 + 6 通用）· 测试历史追踪（localStorage）

### 🤝 社交裂变
- PNG 高清海报（AI 金句 + 二维码）· PK 对比页 · 微信 JSSDK · 动态 OG 标签 · ID 短链

### 🔐 安全与运维
- 全量 XSS 防护 · helmet 安全头 · API 双层限频 · 对话历史 Redis 持久化 · PWA 离线支持

---

## 🏗️ 项目架构

```
EPLTI/
├── client/                      # React SPA (Vite + Tailwind + Framer Motion)
│   └── src/
│       ├── pages/               # Landing, Quiz, Result, Compare, SeasonInsights, ExportAll
│       ├── components/          # ChatDrawer, SharePoster, ErrorBoundary
│       ├── data/                # questions.ts, types.ts, question-context.ts
│       ├── engine/              # scoring.ts (T-E-S-K-R 核心算法)
│       └── hooks/               # useTestHistory, useWechatShare
├── server/                      # Node.js/Express
│   ├── routes/                  # ai.js(SSE+缓存+断线保护), result.js, wechat.js
│   ├── lib/                     # mimo.js(LLM统一封装), redis.js(优雅降级)
│   ├── cron/                    # update-season.js(自动化情报Agent)
│   ├── data/                    # season-context.json
│   └── middleware/              # rateLimit.js
├── MIMOPLAN.md                  # MiMo Orbit 方案文档
├── PLAN2.1.md ~ PLAN2.3.md     # 迭代计划（AI核心/安全加固/工程深度）
└── EPLTI_competitor_analysis.md # 竞品分析报告
```

---

## 🛠️ 技术栈

| 层级 | 技术 |
|------|------|
| **前端** | React 18 + Vite · TypeScript（data/engine）· Tailwind CSS · Framer Motion · vite-plugin-pwa |
| **后端** | Node.js 18+ · Express 5 · MySQL 8.0 · Redis · helmet |
| **AI** | DeepSeek V4 / MiMo（vendor-agnostic）· SSE 流式输出 · Few-shot Prompting · Event-Driven Context |

---

## 🚀 快速开始

```bash
git clone <repo-url> && cd EPLTI
cd client && npm install && cd ../server && npm install
cp server/.env.example server/.env  # 编辑填入配置
# 终端1: cd client && npm run dev
# 终端2: cd server && node index.js
```

### 环境变量

| 变量 | 必填 | 说明 |
|------|------|------|
| `DB_HOST/USER/PASSWORD/NAME` | ✅ | MySQL 连接信息 |
| `MIMO_API_KEY` | ❌ | LLM API Key（缺失则降级到本地文案）|
| `MIMO_API_URL` | ❌ | API 端点（默认 DeepSeek，可切 MiMo）|
| `MIMO_MODEL` | ❌ | 模型名（默认 deepseek-chat）|
| `USE_REDIS` / `REDIS_URL` | ❌ | Redis 配置（缺失则降级到内存）|
| `ADMIN_KEY` | ❌ | 管理导出接口鉴权 |

### 切换 AI 供应商（仅改 .env）
```bash
# Xiaomi MiMo
MIMO_API_URL=https://api.xiaomimimo.com/v1/chat/completions
MIMO_MODEL=mimo-v2.5-pro
```

---

## 📡 API 接口

| 方法 | 路径 | 说明 | 特性 |
|------|------|------|------|
| `POST` | `/api/ai/insight` | AI 人格解读 | SSE + Redis 缓存 + 断线保护 |
| `POST` | `/api/ai/chat` | AI 多轮对话 | SSE + Redis 历史 + 断线保护 |
| `POST` | `/api/ai/poster-line` | AI 海报金句 | 限频 |
| `POST` | `/api/ai/compare` | AI PK 分析 | SSE + 断线保护 |
| `POST` | `/api/result` | 提交结果 | 限频 |
| `GET` | `/api/result/:id` | 查询结果 | - |
| `GET` | `/api/stats` | 全网统计 | - |
| `GET` | `/api/season-context` | 赛季上下文 | - |
| `GET` | `/api/admin/export` | 数据导出 | ADMIN_KEY + 限频 |

---

## 📊 Token 消耗预估

| 功能 | 每次 Token | 日均调用 | 日消耗 |
|------|-----------|---------|--------|
| AI 解读 | ~800 | 300-500 | 24-40 万 |
| AI 对话 | ~1200/轮 | 200×3 轮 | 72 万 |
| AI 海报/PK | ~200-600 | 250 | 7 万 |
| **日均总计** | | | **~100-120 万** |

> 德比/争冠节点峰值 300-500 万/天。Redis 缓存可减少约 60% 重复调用。

---

## 📝 版权

独立开发，包含原创 T-E-S-K-R 五维模型、14 种球迷人格定义及完整视觉方案。

> **Powered by Premier League Insight Engine × AI**
