# Free Router Marketing

Free Router 的中英文营销网站，使用 npm 确认的最新稳定版 **Astro 7.3.5**，静态输出，无需后端服务。

## 开发

要求 Node.js 22.12+、npm 9.6.5+。

```sh
npm ci
npm run dev
```

默认预览地址为 `http://127.0.0.1:4321`。Astro 7 的开发服务器在后台运行，使用 `npx astro dev stop` 停止。

```sh
npm run check
npm run build
npm run preview
```

构建产物位于 `dist/`，可部署到任何静态网站托管平台。`/` 为中文页面，`/en/` 为英文页面。

## 内容与设计

- 本地优先的产品介绍与 SVG 路由图
- 统一 API、多 Key 轮询、失败 Key 冷却、Pi Agent 功能介绍
- 三步接入流程
- Python、cURL、Node.js 代码切换、键盘操作与复制反馈
- 原生折叠 FAQ、移动端菜单、减弱动画偏好支持
- 页面元数据、canonical、语言链接、站点地图和独立 favicon

内容来自相邻 `free-router` 项目的 README，GitHub 链接指向真实仓库 `Neonity2020/free-router`。图示是说明性示例，不查询或展示实时网关状态。上游定价和额度由提供方决定。

## 修改

- `src/components/Marketing.astro`：页面内容、中英文文案、代码示例和交互
- `src/styles/global.css`：排版、色彩和响应式布局
- `src/layouts/Layout.astro`：SEO 元数据与语言设置
- `astro.config.mjs`：站点域名与 Astro 配置

变更部署域名时同步修改 `astro.config.mjs` 和 `public/robots.txt`。Sites 的静态托管配置位于 `.openai/hosting.json`，不包含凭据。

## 依赖审计

本次 npm 审计报告 Astro 间接依赖 `http-cache-semantics@4.2.0` 的 GHSA-ch52-4w7c-c8xp；npm 上目前没有更高修复版本。保留最新 Astro，不使用审计建议的旧版降级。本项目仅发布静态 HTML、CSS、字体和 JavaScript，不部署 Astro 服务端或跨用户响应缓存。
