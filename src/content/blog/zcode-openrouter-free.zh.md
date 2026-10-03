---
title: 在 ZCode 里用上 OpenRouter 的免费模型
description: 零成本让 ZCode 接通 LLM：注册账号、拿到 API Key、在 Settings 里添加上游，并把带 :free 后缀的模型设为默认。
publishedAt: 2026-10-04
tags: [ZCode, 模型配置, 免费模型]
---

ZCode 本身不提供模型，它只是调用上游的网关。如果你想白嫖，OpenRouter 是一个现成的选择：注册一个账号，拿一把 API Key，就能用它免费 tier 里的模型，而且接口完全兼容 OpenAI，ZCode 不需要任何额外配置。

> **免费不是免费无限**。免费 tier 的模型有速率限制、没有 P99 SLA、随时可能调整额度，适合日常闲聊、写文档、改小段代码，不适合跑长时间的自动代理任务。

## 免费模型长什么样

OpenRouter 把免费模型统一标记为 `:free` 后缀。在 ZCode 的模型选择下拉里，它们看起来像：

- `apodex/apodex-1.1-mini:free`
- `openai/gpt-6-astra`
- `anthropic/claude-fable-5.1`

命名规则是 `提供方/模型名:free`，比如 `qwen/qwen3.8-max` 是付费的，`qwen/qwen3.8-max:free` 才是免费的。

## 第一步：拿到 OpenRouter API Key

1. 访问 [openrouter.ai](https://openrouter.ai) 并注册账号
2. 进入 **Settings → API Keys**
3. 点 **New Key**，给密钥起个名字（比如 `ZCode`），复制它

生成的密钥长这样：

```text
sk-or-v1-xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
```

把它存进密码管理器，别写进代码仓库。

## 第二步：在 ZCode 里添加上游

桌面应用打开 **Settings → Providers**，点 **Add provider**，然后：

- **Name**: 随便填，比如 `OpenRouter`
- **API Type**: 选 `OpenAI Chat Completions`
- **Base URL**: `https://openrouter.ai/api/v1`
- **API Key**: 填入刚才复制的密钥

点 **Save** 后，ZCode 会向 `https://openrouter.ai/api/v1/models` 发一次探测请求。如果看到一长串模型列表，说明网络连通；如果一直转圈，通常是网络问题（国内环境可能需要能访问该域名）。

## 第三步：把免费模型放进列表

添加上游后，下拉框里是 OpenRouter 的全量模型。免费模型需要手动启用——在 Providers 里点这个上游，展开模型列表，找到带 `:free` 的那个，把右侧的开关打开。

打开开关的本质是给配置文件的 `providerConfigRules.providerModelRules` 写一条规则：

```json
{
  "modelId": "apodex/apodex-1.1-mini:free",
  "config": {
    "enabled": true,
    "properties": {
      "inputFormat": {
        "supportsImage": true
      }
    }
  },
  "providerId": "openrouter"
}
```

如果你习惯直接改配置，目标文件是 `~/.zcode/v2/provider_config.json`，编辑后重启应用即可。

## 第四步：把它设成默认

ZCode 启动时会用 **Settings → General → Default Model** 里选的那个模型。把 OpenRouter 的免费模型设成默认，之后新建对话就用它。

如果你希望 ZCode 在你没手选的时候优先用免费模型，也可以在 Providers 里把免费模型拖到模型排序列表的**最前面**。ZCode 的 `modelOrder` 就是按这个顺序尝试的——排第一，首次加载和自动回退都会先碰到它。

## 验证连接

新建一个对话，输入 "你好，请说一句话"。

- 成功：模型秒回，响应头里能看到 `openrouter-ai` 相关字段
- 失败（401）：密钥填错、已欠费，或密钥没开通该模型
- 失败（5xx / 一直转圈）：网络不通，ZCode 连不到 `openrouter.ai`

## 几个常见的坑

**1. 免费模型的配额是全局的，不是按上游分开算的。** 同一把 OpenRouter Key 下，所有上游、所有模型共用免费额度。

**2. 免费模型不支持全部工具。** 有些模型会拒绝 vision、function calling 或结构化输出——遇到 `400` 时先换模型试试，别急着改代码。

**3. 不要指望免费模型跑长任务。** 超时、限流、中途掉线在免费 tier 很常见，跑代理循环前先确认这个上游能稳定撑住。

**4. 密钥进 git 是大忌。** 上面那个 `provider_config.json` 是应用级的本地配置，但如果你把它同步到多台机器，记得定期轮换密钥。

## 然后呢

免费模型适合用来验证想法、写文档、调小段逻辑。等你的需求上了一个台阶——比如要跑自动化工作流、要更大的上下文窗口、要更稳定的 SLA——再考虑付费，或者回到 Free Router：本地部署网关，自己握着重试、冷却、多 Key 轮询这些开关。

> 免费模型是门槛，本地网关是上限。
