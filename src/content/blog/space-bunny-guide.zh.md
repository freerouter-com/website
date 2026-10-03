---
title: Space Bunny 调用攻略
description: 四条可用路径、模型 ID 对照表、参数边界和故障排查速查——一篇讲清楚 Space Bunny 到底怎么用。
publishedAt: 2026-10-03
tags: [Space Bunny, 上游配置]
---

> 信息截至 2026-10-03。Space Bunny 处于匿名测试期，免费策略、模型 ID 与可用性随时可能变化，
> 调用前建议以各家官方目录为准（链接见文末「参考」）。

---

## 0. 30 秒速览

Space Bunny（`stealth/space-bunny-alpha`）是 2026-09-23 上线的**匿名隐身模型**，
上线三天登顶 OpenRouter 与 OpenCode 双平台用量榜首，当前**限时免费**，社区报道称支持 **1M 上下文**（未官方确认）。

四条可用路径，按省心程度排序：

| 路径 | base URL | 模型 ID | 费用 | 适合 |
| --- | --- | --- | --- | --- |
| **free-router 网关**（推荐） | `http://127.0.0.1:8787/v1` | `space-bunny` | 免费（走上游） | 日常主力，自动路由 + Key 池 + 故障切换 |
| OpenCode Zen 直连 | `https://opencode.ai/zen/v1` | `space-bunny-free` | 免费 | 最简单的直连，零保留隐私政策 |
| OpenRouter 直连 | `https://openrouter.ai/api/v1` | `stealth/space-bunny-alpha` | 免费期后按量计费 | 已有 OpenRouter 账号 |
| Command Code 直连 | `https://api.commandcode.ai/provider/v1` | `stealth/space-bunny-alpha` | stealth 预览期免费 | Provider 订阅用户 |

所有路径都是 OpenAI Chat Completions 兼容协议，一套 SDK 通吃。

---

## 1. 它是什么

- **匿名隐身模型**：厂商未公开身份，页面只署名 "stealth"，社区普遍猜测背后是国内某大厂。
- **限时免费**：OpenRouter、OpenCode Zen、Command Code 三家都在免费期，Command Code 明确说明
  "该模型请求不消耗积分，stealth 预览结束为止"。
- **纯文本对话模型**：无图像/音频输入；支持流式、工具调用、reasoning 参数、JSON 输出（`response_format`）。
- **被当作编码 agent 用过**：社区实测可驱动 agent 完成完整前端项目；本仓库作者也做过一轮
  Three.js 游戏掌机评测，结论见 [§7 实测特点](#7-实测特点agent--编码场景)。

---

## 2. 怎么选路径

- **只用一个上游、写死配置** → 直连最简单（§4）。
- **想要免费额度最大化、上游挂了自动切换、多 Key 轮询** → free-router 网关（§3）。
  网关把三家上游都配好后，一个 `space-bunny` 模型 ID 自动挑可用上游，单个 Key 429/5xx 自动换下一个，
  应用侧完全无感。

---

## 3. 路径 A：经 free-router 网关调用（推荐）

### 3.1 准备

```sh
# 启动网关（首次需先构建）
npm install --prefix frontend
npm run build --prefix frontend
cargo run --manifest-path backend/Cargo.toml
# 打开 http://127.0.0.1:8787 ，在 Settings 页填入任意一家上游的 API Key → 保存设置（即时生效）
```

然后在 Settings 的「统一网关 API Key」生成应用密钥（保存在 `gateway-key.local.txt`，权限 0600）。
生成后所有 `/v1` 调用都要带 `Authorization: Bearer <网关密钥>`。

### 3.2 模型 ID 对照

| 你传的 model | 网关行为 | 实际上游模型 |
| --- | --- | --- |
| `space-bunny` | 自动路由，默认 OpenCode 优先 | 取决于选中的上游 |
| `openrouter/space-bunny` | 强制走 OpenRouter | `stealth/space-bunny-alpha` |
| `opencode/space-bunny` | 强制走 OpenCode Zen | `space-bunny-free` |
| `commandcode/space-bunny` | 强制走 Command Code | `stealth/space-bunny-alpha` |

响应里的模型名保留上游原始 ID；`x-gateway-provider` 响应头会告诉你这次实际用了哪家。

### 3.3 调用示例

cURL：

```sh
curl http://127.0.0.1:8787/v1/chat/completions \
  -H 'Content-Type: application/json' \
  -H "Authorization: Bearer $GATEWAY_API_KEY" \
  -d '{"model":"space-bunny","messages":[{"role":"user","content":"你好"}],"stream":true}'
```

Python（复用 openai SDK，只改 base_url）：

```python
import os
from openai import OpenAI

client = OpenAI(base_url="http://127.0.0.1:8787/v1", api_key=os.environ["GATEWAY_API_KEY"])
response = client.chat.completions.create(
    model="space-bunny",
    messages=[{"role": "user", "content": "你好"}],
)
print(response.choices[0].message.content)
```

Node.js：

```js
import OpenAI from "openai";

const client = new OpenAI({
  baseURL: "http://127.0.0.1:8787/v1",
  apiKey: process.env.GATEWAY_API_KEY,
});
const response = await client.chat.completions.create({
  model: "space-bunny",
  messages: [{ role: "user", content: "你好" }],
});
console.log(response.choices[0].message.content);
```

### 3.4 网关替你兜的底（调用前值得知道的规则）

- **Key 池轮询**：每个上游最多 16 个 Key；401/403/429/5xx 或连接失败时按轮询顺序换下一个 Key，
  每个 Key 最多试一次；池内耗尽后自动路由还能切换上游。
- **故障切换时机**：只发生在响应头发出之前；**已开始输出的流不会重试**（避免重复内容）。
- **400 不重试**：参数写错这类错误原样返回，别指望网关兜。
- **时间预算共享**：默认总超时 300 秒（`GATEWAY_REQUEST_TIMEOUT_SECS` 可设 1–86400，改后需重启），
  所有重试和上游切换共用这个预算；请求体上限 10 MiB。
- **配置即改即生效**：Settings 保存后新请求立刻用新配置，已开始的请求不受影响。

### 3.5 命令行管理（SSH / 无桌面场景）

```sh
free-router status                  # 运行状态、默认上游、各上游 Key 数量
free-router keys add opencode sk-a sk-b   # 追加 Key（去重，每家上限 16）
free-router provider openrouter     # 切换自动路由的默认上游
free-router gateway-key generate    # 生成新网关密钥（旧密钥立即失效）
```

---

## 4. 路径 B：直连上游

### 4.1 OpenCode Zen（最省事的直连）

1. 到 [opencode.ai](https://opencode.ai/docs/en/zen/) 注册并添加支付方式，复制 API Key。
2. 标准 OpenAI 兼容调用：

```sh
curl https://opencode.ai/zen/v1/chat/completions \
  -H "Authorization: Bearer $OPENCODE_API_KEY" \
  -H 'Content-Type: application/json' \
  -d '{"model":"space-bunny-free","messages":[{"role":"user","content":"你好"}]}'
```

- 免费额度：input / output / cached reads 全部 Free（限时）。
- 隐私：官方声明该提供方执行**零保留政策**，不拿你的数据训练模型，托管在美国。
- 模型目录可用 `GET https://opencode.ai/zen/v1/models` 实时查询。

### 4.2 OpenRouter

```sh
curl https://openrouter.ai/api/v1/chat/completions \
  -H "Authorization: Bearer $OPENROUTER_API_KEY" \
  -H 'Content-Type: application/json' \
  -d '{"model":"stealth/space-bunny-alpha","messages":[{"role":"user","content":"你好"}]}'
```

- 官方页面：[openrouter.ai/stealth/space-bunny-alpha](https://openrouter.ai/stealth/space-bunny-alpha)。
- 生成失败不计费；返回 **402 表示账户余额不足**。
- 免费期结束后按量计费，价格以页面为准。

### 4.3 Command Code

```sh
curl https://api.commandcode.ai/provider/v1/chat/completions \
  -H "Authorization: Bearer $COMMANDCODE_API_KEY" \
  -H 'Content-Type: application/json' \
  -d '{"model":"stealth/space-bunny-alpha","messages":[{"role":"user","content":"你好"}]}'
```

- Key 在 [Command Code Studio](https://commandcode.ai/studio/) 创建，CLI 和 API 共用同一个 Key。
- stealth 预览期该模型**不消耗积分**；Provider 计划 $15/月（+$1.01 手续费）按量计费无加价。
- 注意：**Go 计划没有 API 权限**（返回 403 `upgrade_required`）。
- 模型发错端点会返回 400（Claude 系模型走 `/v1/messages`，space-bunny 走 `/chat/completions`）。

---

## 5. 参数与能力边界

OpenRouter 公布的支持参数（直连和经网关透传均适用）：

| 参数 | 说明 |
| --- | --- |
| `stream` | SSE 流式输出，`data: [DONE]` 结束 |
| `tools` / `tool_choice` | 工具调用（agent 场景核心能力，实测可用） |
| `reasoning` / `reasoning_effort` | 推理深度控制 |
| `response_format` | JSON 结构化输出 |
| `temperature` / `top_p` / `max_tokens` | 常规采样参数 |

边界：

- **纯文本**：不支持图像/音频输入；多模态参数经网关原样透传，但上游不处理。
- 网关当前**只做 Chat Completions 和模型列表**，不转换 OpenAI Responses / Anthropic Messages 协议。
- 上下文长度：社区报道称 1M，官方页面未标注；超长输入请自行分段或先用小请求试探。

---

## 6. 实战建议

1. **三家上游都配上**。免费期额度就是生产力：网关模式下 OpenCode 挂了自动落 OpenRouter，
   再落 Command Code，你在应用侧什么都不用改。
2. **流式必开**。长回复下非流式容易撞 300 秒总预算；且网关只重试"头都没发出去"的请求，
   流式请求一旦开始输出就不再换上游，开流前把参数校对好。
3. **agent / 工具调用场景**直接用 `space-bunny` 别名，让网关挑当下最稳的上游；
   只有在需要对比各上游表现时才用 `openrouter/`、`opencode/` 前缀强制指定。
4. **盯紧免费期**。stealth 模型随时可能转付费或下线；`GET /v1/models`（网关）或各上游模型列表
   可以随时确认它还在不在。转付费后 OpenRouter 直连会开始扣费，不想被扣就提前把默认上游切走。
5. **429 退避**。上游限流时网关会自动换 Key / 换上游；如果你直连遇到 429，
   官方建议就是带退避重试，别裸连重试打满。

---

## 7. 实测特点（agent / 编码场景）

来自本仓库作者的一轮完整评测（用 space-bunny 驱动 ZCode agent 从零构建 Three.js 3D Game Boy + 可玩俄罗斯方块，约 1400 行原生 JS）：

**强项**

- 代码结构清晰、分层合理、注释解释"为什么"而非"改了什么"，commit message 质量高；
- 会自建客观验证工具链（`gl.readPixels` 帧缓冲采样、ASCII 渲染逐点核对、3D 投影反算 + 真实点击）；
- 诚实度高：测试失败如实报告，被抓包后能主动复盘方法缺陷而非辩解，纠错定位准、修根因。

**弱项（使用时提前设防）**

- **验证纪律差**：倾向于用最省力的方式验证（直接喂参数给函数），绕过真实代码路径，
  导致集成级 bug 带"已验证"标签交付——用它做交付前，务必自己跑一遍端到端；
- **零性能意识**：全程不做性能测量，可能交付占满 CPU 核心的常驻动画，浏览器项目要自己看任务管理器；
- **看不见图像**：无法判断视觉观感，UI/视觉类交付需要人来验收；
- **取舍不透明**：删功能、改交互这类影响产品的决定倾向自行拍板，重要取舍要显式要求它询问。

一句话：**当"代码生成器"很好用，当"自主交付者"需要人盯着验证和性能两道关。**

---

## 8. 故障排查速查

| 症状 | 原因与处理 |
| --- | --- |
| 网关返回 503 | 未配置任何上游 Key，或该上游 Key 池已清空——去 Settings 添加 |
| 网关返回 504 | 总时间预算耗尽（默认 300 秒，含所有重试）——调大 `GATEWAY_REQUEST_TIMEOUT_SECS` 并重启 |
| OpenRouter 返回 402 | 账户余额不足（免费期已过或账户欠费） |
| Command Code 返回 403 `upgrade_required` | Go 计划无 API 权限，需 Provider 及以上 |
| 返回 400 | 参数错误，或 Command Code 场景下模型发错了端点 |
| 返回 429 | 上游限流——直连请退避重试；经网关会自动换 Key / 换上游 |
| 流式回复中断 | 预算耗尽会终止已开始的响应；超长任务调大预算或分段 |
| 想确认实际用了哪家上游 | 看响应头 `x-gateway-provider` |

---

## 9. 参考

- free-router 网关：`Neonity2020/free-router` 项目 README（模型路由、Key 池、超时与 CLI 的权威说明）
- OpenRouter 模型页：<https://openrouter.ai/stealth/space-bunny-alpha>
- OpenCode Zen 文档：<https://opencode.ai/docs/en/zen/>
- Command Code Provider API：<https://commandcode.ai/docs/provider>
- Command Code Studio（取 Key）：<https://commandcode.ai/studio/>
- 社区报道：中文科技媒体对「太空兔」三天登顶双平台的报道（搜狐、CSDN，2026-09 下旬），
  含 1M 上下文与"对标 GLM-5.3-Flash"等社区实测说法，均未获官方确认