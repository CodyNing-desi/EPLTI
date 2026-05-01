# EPLTI (英超 TI) - 球迷人格测试平台

![EPLTI Banner](https://img.shields.io/badge/Status-Live-success?style=for-the-badge)
![React](https://img.shields.io/badge/React-20232A?style=for-the-badge&logo=react&logoColor=61DAFB)
![TypeScript](https://img.shields.io/badge/TypeScript-007ACC?style=for-the-badge&logo=typescript&logoColor=white)
![Tailwind](https://img.shields.io/badge/Tailwind_CSS-38B2AC?style=for-the-badge&logo=tailwind-css&logoColor=white)
![Express](https://img.shields.io/badge/Express.js-000000?style=for-the-badge&logo=express&logoColor=white)
![MySQL](https://img.shields.io/badge/MySQL-4479A1?style=for-the-badge&logo=mysql&logoColor=white)

EPLTI (Premier League Type Indicator) 是一个专为足球迷（特别是英超球迷）设计的深度心理画像测试平台。它通过 18 道精心设计的测试题，基于独创的 **T-E-S-K-R**（死忠、激情、社交、懂球、韧性）五大维度模型，将球迷划分为 14 种独特的人格类型。

## ✨ 核心特性

- **⚽ 沉浸式答题体验**：丝滑的页面过渡与交互动画（基于 Framer Motion），支持自由回退修改答案。
- **📊 专业的多维度分析**：基于用户答卷生成专属的人格雷达图、维度得分以及全网统计百分比。
- **📸 移动端极致海报生成**：
  - 点击即可**自动生成 PNG 高清海报**，无需二次点击。
  - **长按保存图片**：完美适配手机端社交分享逻辑，支持长按保存或直接发送。
  - **中英并重排版**：融合中文名称与大号英文代号水印，视觉质感对标高端杂志。
- **🔗 智能分享与防窥探**：分享链接由冗长的 Base64 升级为**数据库短 ID 映射**（如 `?id=123`），缩短链接长度的同时保护用户答题隐私。
- **💬 社交平台 SEO 与定制卡片**：
  - 服务端动态注入 **OpenGraph (OG)** 标签，社交平台分享自动显示结果卡片。
  - 深度集成 **微信 JSSDK**，实现微信内精美图文链接分享。
- **📱 移动端优先设计**：UI 完美适配各尺寸屏幕，首页实时展示“人已测”统计，增强社交参与感。

---

## 🛠️ 技术栈

### 前端 (Client)
- **核心框架**: React 18, Vite, React Router DOM
- **语言**: TypeScript (核心算法与数据模型), JavaScript (UI 层)
- **样式与动画**: Tailwind CSS, Framer Motion, Lucide React
- **功能库**: weixin-js-sdk, html2canvas, qrcode

### 后端 (Server)
- **运行时环境**: Node.js (v18+)
- **框架**: Express 5.0, CORS
- **数据库**: MySQL 8.0 (TDSQL-C)
- **SEO 优化**: 动态注入 OG 标签以支持社交分享预览。

---

## 🚀 部署说明

1. **前端打包**: `npm run build` 生成 `dist/`。
2. **后端挂载**: 使用 Express 托管 `dist/` 静态文件，拦截非 API 请求实现 SPA Fallback。
3. **PM2 管理**: `pm2 start index.js --name "eplti"` 确保服务 7x24 小时在线。

---

## 📝 版权与设计

本项目由独立开发者设计，包含原创算法模型及视觉排版方案。
> **Powered by Premier League Insight Engine**
