# VF-News

虚拟新闻阅读应用，基于uni-app开发的跨平台新闻阅读器，提供虚拟生成的新闻内容浏览体验。


## 项目简介

VF-News（Virtual Fake News）是一个专注于虚拟新闻内容的阅读应用，所有新闻内容均为虚构创作，旨在提供多样化的阅读体验。应用支持多平台部署（H5、微信小程序、支付宝小程序等），并通过后端服务提供新闻数据管理与接口支持。


## 功能特点

- **跨平台支持**：基于uni-app开发，可运行于H5、微信小程序、支付宝小程序等多个平台
- **新闻分类浏览**：支持按标签分类查看不同领域的虚拟新闻
- **多种排序方式**：提供综合、最新、热门三种排序方式，满足不同阅读需求
- **响应式设计**：适配不同尺寸的设备屏幕，提供良好的移动端阅读体验
- **虚拟新闻内容**：所有新闻均为虚构内容，涵盖科技、娱乐等多个领域


## 技术栈

### 前端
- 框架：uni-app（基于Vue 3）
- 组件库：Vant
- 构建工具：Vite
- 路由：vue-router
- 国际化：vue-i18n

### 后端
- 服务框架：Express
- 开发语言：Node.js
- 数据存储：文件系统（JSON/Markdown）
- 依赖管理：pnpm/npm


## 快速开始

### 环境要求
- Node.js ≥ 14.x
- pnpm ≥ 7.x 或 npm ≥ 6.x


### 安装步骤

1. 克隆仓库
```bash
git clone https://github.com/kgwater/vf-news.git
cd vf-news
```

2. 安装依赖
```bash
pnpm install
# 或使用 npm
npm install
```

3. 启动前端开发服务（H5）
```bash
pnpm dev:h5
# 应用将运行在 http://localhost:5173
```

4. 启动后端服务
```bash
pnpm server:dev
# 后端服务将运行在 http://localhost:5175
```


### 多平台运行

- 微信小程序
```bash
pnpm dev:mp-weixin
# 然后在微信开发者工具中导入 dist/dev/mp-weixin 目录
```

- 支付宝小程序
```bash
pnpm dev:mp-alipay
```

- 构建生产版本（H5）
```bash
pnpm build:h5
```


## 项目结构

```
vf-news/
├── server/                 # 后端服务
│   ├── index.js            # 入口文件
│   ├── services/           # 业务服务
│   ├── data/               # 数据存储
│   └── newslog/            # 新闻存档（JSON/Markdown）
├── src/                    # 前端源码
│   ├── pages/              # 页面组件
│   ├── components/         # 通用组件
│   ├── App.vue             # 应用入口
│   └── main.js             # 入口脚本
├── package.json            # 依赖配置
└── vite.config.js          # Vite配置
```


## API 接口说明

后端服务提供以下主要接口：

- `GET /api/health` - 服务健康检查
- `GET /api/news` - 获取新闻列表（支持分类、排序、分页）
- `GET /api/tags` - 获取新闻标签及数量统计
- `GET /api/worldsetting` - 获取虚拟世界设置
- `GET /api/stats` - 获取新闻统计数据


## 免责声明

本应用中的所有新闻内容均为虚拟创作，不涉及现实中的任何真实事件、人物或组织。所有内容仅供娱乐和阅读体验，请勿将其与现实情况混淆。


## 版本信息

- 当前版本：2.9.20
- 最后更新：2025年9月
- 开发者：Water
