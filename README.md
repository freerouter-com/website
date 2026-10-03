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

## 博客

博客基于 Astro 内容集合（`src/content.config.ts`），文章放在 `src/content/blog/`，纯 Markdown，无运行时依赖。

文件名格式固定为 `<slug>.<lang>.md`，语言写在文件名里，两种语言的文章共用同一个 slug —— 这就是翻译配对的依据。中英文各一篇即可自动互相链接。

```text
src/content/blog/
  first-request.zh.md      → /blog/first-request/
  first-request.en.md      → /en/blog/first-request/
```

Frontmatter 字段：

| 字段 | 必填 | 说明 |
| --- | --- | --- |
| `title` | 是 | 标题，含 ASCII 冒号时需要加引号 |
| `description` | 是 | 列表摘要与 SEO 描述 |
| `publishedAt` | 是 | 发布日期，决定排序（新的在前） |
| `updatedAt` | 否 | 更新日期，会写入 `article:modified_time` |
| `tags` | 否 | 标签，默认空数组 |
| `draft` | 否 | 设为 `true` 时不生成页面，也不进入 RSS 和站点地图 |

新增文章只需放入 Markdown 文件，路由、RSS、站点地图和语言切换都会自动生成。`/blog/` 与 `/en/blog/` 各有一份 RSS 订阅源。文章目录支持子目录，此时 slug 为 `子目录/文件名`。

## 内容与设计

- 本地优先的产品介绍与 SVG 路由图
- 统一 API、多 Key 轮询、失败 Key 冷却、Pi Agent 功能介绍
- 三步接入流程
- Python、cURL、Node.js 代码切换、键盘操作与复制反馈
- 原生折叠 FAQ、移动端菜单、减弱动画偏好支持
- 亮色 / 暗色 / 跟随系统外观切换，默认跟随系统，首次渲染前恢复选择，跨页面和标签页同步偏好
- 页面元数据、canonical、语言链接、站点地图和独立 favicon
- 博客：Markdown 内容集合、中英文文章配对、阅读时长、翻译互链、暗色适配、RSS 订阅

内容来自相邻 `free-router` 项目的 README 和源码，GitHub 链接指向真实仓库 `Neonity2020/free-router`。图示是说明性示例，不查询或展示实时网关状态。上游定价和额度由提供方决定。

## 修改

- `src/components/Marketing.astro`：首页内容、中英文文案、代码示例和交互
- `src/components/SiteHeader.astro`、`src/components/SiteFooter.astro`：页头与页尾，首页和博客共用
- `src/content/blog/`：博客文章，命名与 frontmatter 见上文
- `src/content.config.ts`：内容集合定义与 frontmatter 校验
- `src/lib/blog.ts`：语言、slug、URL、日期与阅读时长的公共逻辑
- `src/layouts/BlogLayout.astro`、`BlogPostLayout.astro`：博客外壳与文章排版
- `src/styles/blog.css`：博客排版，跨页面的暗色覆盖写在 `theme.css`
- `src/styles/global.css`：排版、色彩和响应式布局
- `src/styles/theme.css`、`src/scripts/theme.ts`：暗色配色、系统外观响应和主题偏好
- `src/layouts/Layout.astro`：SEO 元数据与语言设置
- `astro.config.mjs`：站点域名与 Astro 配置

变更部署域名时同步修改 `astro.config.mjs` 和 `public/robots.txt`。Sites 的静态托管配置位于 `.openai/hosting.json`，不包含凭据。

## 依赖审计

本次 npm 审计报告 Astro 间接依赖 `http-cache-semantics@4.2.0` 的 GHSA-ch52-4w7c-c8xp；npm 上目前没有更高修复版本。保留最新 Astro，不使用审计建议的旧版降级。本项目仅发布静态 HTML、CSS、字体和 JavaScript，不部署 Astro 服务端或跨用户响应缓存。
