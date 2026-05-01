# EPLTI (英超 TI) - 球迷人格测试平台

![EPLTI Banner](https://img.shields.io/badge/Status-Live-success?style=for-the-badge)
![React](https://img.shields.io/badge/React-20232A?style=for-the-badge&logo=react&logoColor=61DAFB)
![TypeScript](https://img.shields.io/badge/TypeScript-007ACC?style=for-the-badge&logo=typescript&logoColor=white)
![Tailwind](https://img.shields.io/badge/Tailwind_CSS-38B2AC?style=for-the-badge&logo=tailwind-css&logoColor=white)
![Express](https://img.shields.io/badge/Express.js-000000?style=for-the-badge&logo=express&logoColor=white)
![MySQL](https://img.shields.io/badge/MySQL-4479A1?style=for-the-badge&logo=mysql&logoColor=white)

EPLTI (Premier League Type Indicator) 是一个专为足球迷（特别是英超球迷）设计的深度心理画像测试平台。它通过 18 道精心设计的测试题，基于独创的 **T-E-S-K-R**（死忠、激情、社交、懂球、韧性）五大维度模型，将球迷划分为 14 种独特的人格类型（如：SAF 曼联型、WENGER 阿森纳型、ZERO 冠军粉等）。

## ✨ 核心特性

- **⚽ 沉浸式答题体验**：丝滑的页面过渡与交互动画（基于 Framer Motion），支持自由回退修改答案。
- **📊 专业的多维度分析**：基于用户答卷生成专属的人格雷达图、维度得分以及全网统计百分比。
- **📸 动态海报生成**：支持一键将测试结果、雷达图及专属二维码生成为高清长图并保存。
- **🔗 智能分享与防窥探**：分享链接由冗长的 Base64 升级为**数据库短 ID 映射**（如 `?id=123`），缩短链接长度的同时保护用户答题隐私（保留 Base64 作为断网容灾 Fallback）。
- **💬 社交平台 SEO 与定制卡片**：
  - 服务端动态注入 **OpenGraph (OG)** 和 **Twitter Cards** 标签，在各大社交平台分享时自动抓取专属结果图片、标题与简介。
  - 深度集成 **微信 JSSDK**，在微信内直接分享可呈现定制化的精美图文链接卡片。
- **📱 移动端优先**：UI 完美适配各种尺寸的手机屏幕，拥有永远悬浮的快捷操作栏，极简白底搭配英超标志性紫红/荧光粉高对比度设计。

---

## 🛠️ 技术栈

### 前端 (Client)
- **核心框架**: React 18, Vite, React Router DOM
- **语言**: TypeScript (核心算法与数据模型), JavaScript (UI 层)
- **样式与动画**: Tailwind CSS, Framer Motion, Lucide React (图标)
- **社交与生态**: weixin-js-sdk (微信分享定制), html2canvas (海报生成), qrcode (二维码)

### 后端 (Server)
- **运行时环境**: Node.js (v18+)
- **框架**: Express 5.0, CORS, dotenv
- **数据库**: MySQL 8.0 (TDSQL-C), mysql2
- **SEO/分享优化**: Node 侧拦截 HTML 响应，根据不同 Result ID 动态插入对应的 `og:image` 与 `og:title`。

---

## 🚀 本地开发指南

### 前置条件
确保你已安装了 [Node.js](https://nodejs.org/) (v18 或更高) 和 [MySQL](https://www.mysql.com/)。

### 1. 启动后端
后端默认运行在 `3001` 端口。

```bash
cd server
npm install
```

在 `server/` 目录下创建一个 `.env` 文件，并填入你的本地数据库及微信 API（如果需要测试微信分享）信息：
```env
DB_HOST=localhost
DB_PORT=3306
DB_USER=root
DB_PASSWORD=你的数据库密码
DB_NAME=eplti
PORT=3001

# 微信分享相关 (可选)
WECHAT_APP_ID=你的AppID
WECHAT_APP_SECRET=你的AppSecret
```

启动后端服务（首次启动会自动连接 MySQL 并创建所需的表结构）：
```bash
npm run dev
```

### 2. 启动前端
前端默认运行在 `5173` 端口。

```bash
cd client
npm install
npm run dev
```

浏览器打开 `http://localhost:5173` 即可预览项目。

---

## ☁️ 部署说明 (腾讯云轻量服务器示例)

本项目支持将前端打包后交由 Node.js 后端统一托管，方便单机全栈部署。

1. **配置环境变量**
   在服务器的 `server/` 目录下创建 `.env` 文件，填入生产环境的云数据库内网或外网地址。
   ```env
   DB_HOST=你的云数据库地址
   DB_PORT=3306
   DB_USER=root
   DB_PASSWORD=云数据库密码
   DB_NAME=eplti
   PORT=80
   NODE_ENV=production
   ```

2. **前端打包**
   由于配置了前后端同源，打包前确保 `VITE_API_URL` 未设置或指向当前域名。
   ```bash
   cd client
   npm install
   npm run build
   ```
   打包后的文件会生成在 `client/dist/` 目录，Express 后端会自动拦截非 API 请求并返回注入过 OG 标签的静态页面。

3. **后端守护运行**
   安装 PM2 并启动服务：
   ```bash
   cd server
   npm install
   sudo npm install -g pm2
   sudo pm2 start index.js --name "eplti"
   sudo pm2 save
   ```

---

## 📝 版权与设计

本项目作为独立开发者产品，题目设计、人格模型及视觉资源均由作者原创设计。
> **Powered by Premier League Insight Engine**
