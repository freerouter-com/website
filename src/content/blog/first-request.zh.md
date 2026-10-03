---
title: 你的第一个请求
description: 三步把一个熟悉的 OpenAI SDK 请求接到本地网关上，顺便讲清 GATEWAY_API_KEY 和网关密钥的区别。
publishedAt: 2026-09-04
tags: [快速开始, OpenAI SDK]
---

Free Router 做的事可以压缩成一句话：**把应用里的 `baseURL` 换成 `http://127.0.0.1:8787/v1`**。

请求格式、鉴权头、流式响应都和 OpenAI 官方 SDK 一致。不需要学新的协议。

## 第一步：启动网关

从源码启动需要 Node.js 22.19+ 和 Rust 1.89+：

```sh
npm install --prefix frontend
npm ci --prefix agent
npm run build --prefix frontend
cargo run --manifest-path backend/Cargo.toml
```

网关默认监听 `127.0.0.1:8787`，API Base URL 是 `http://127.0.0.1:8787/v1`。

桌面应用如果发现 8787 已经被占用，会自动挑选下一个空闲端口。**以应用界面里显示的 Base URL 为准**，别把端口硬编码进代码。

> 在 macOS 上关闭桌面应用的窗口只是隐藏窗口，网关仍在后台运行。要真正停掉，需要从菜单里选择退出。

## 第二步：填入上游密钥

在 Settings 里为要使用的上游添加 API Key，再生成一个网关密钥。

`OPENROUTER_API_KEY`、`OPENCODE_API_KEY`、`COMMANDCODE_API_KEY` 这三个环境变量会作为初始密钥池写入配置，但 **Settings 里保存的值优先级更高**，包括你在界面上主动清空的情况。

上游密钥保存在配置目录下的 `settings.local.json`，Unix 权限是 `0600`，并且已经在 `.gitignore` 里。

## 第三步：用对密钥

这里有两个用途不同、不能互相替代的密钥：

| 密钥 | 用途 |
| --- | --- |
| `GATEWAY_API_KEY` | 管理密钥，用于 `/api/settings` 这类管理接口 |
| 界面生成的 `fr_...` 密钥 | 应用密钥，只够调用 `/v1` |

应用密钥不能改动配置，管理密钥也不该放进你的应用代码里。

## 然后就是这样

```python
import os
from openai import OpenAI

client = OpenAI(
    base_url="http://127.0.0.1:8787/v1",
    api_key=os.environ["GATEWAY_API_KEY"],
)

response = client.chat.completions.create(
    model="space-bunny",
    messages=[{"role": "user", "content": "Hello!"}],
)

print(response.choices[0].message.content)
```

`space-bunny` 会自动在上游之间挑选，默认顺序是 OpenCode Zen → OpenRouter → Command Code，可以在 Settings 或 `.env` 的 `DEFAULT_PROVIDER` 里改。

想固定某一家，就加前缀：

- `openrouter/space-bunny`
- `opencode/space-bunny`
- `commandcode/space-bunny`
- `commandcode/<其他 Chat Completions 模型 ID>`

## 写代码之前，先问一句

```sh
curl http://127.0.0.1:8787/v1/models -H "Authorization: Bearer $GATEWAY_API_KEY"
```

网关目前只公布四个模型 ID。先跑一次，比猜要快。

> **目前只有 Chat Completions。** `/v1/chat/completions` 和 `/v1/models` 是仅有的两个端点，Responses API 与 Anthropic Messages 协议不会被转换。