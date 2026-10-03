---
title: "Using OpenRouter's Free Models in ZCode"
description: "Connect ZCode to an LLM at zero cost: register, grab an API Key, add the provider in Settings, and set a `:free` model as the default."
publishedAt: 2026-10-04
tags: [ZCode, Model Configuration, Free Models]
---

ZCode doesn't ship its own models — it just calls upstream providers. If you want to go for free, OpenRouter is a ready-made option: register an account, get an API Key, and use whatever is on the free tier. The interface is fully OpenAI-compatible, so ZCode needs no extra setup.

> **Free is not unlimited.** Free tier models have rate limits, no P99 SLA, and quotas that can change at any time. They're fine for casual chat, writing docs, and tweaking small bits of code — not for long-running autonomous agent tasks.

## What free models look like

OpenRouter marks free models with a `:free` suffix. In ZCode's model picker they appear as:

- `apodex/apodex-1.1-mini:free`
- `openai/gpt-6-astra`
- `anthropic/claude-fable-5.1`

The naming convention is `provider/model-name:free` — so `qwen/qwen3.8-max` is paid, while `qwen/qwen3.8-max:free` is free.

## Step 1: Get your OpenRouter API Key

1. Go to [openrouter.ai](https://openrouter.ai) and sign up
2. Open **Settings → API Keys**
3. Click **New Key**, name it (e.g. `ZCode`), and copy it

The key looks like this:

```text
sk-or-v1-xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
```

Store it in a password manager, not in your code repo.

## Step 2: Add the provider in ZCode

In the desktop app, open **Settings → Providers**, click **Add provider**, then fill in:

- **Name**: anything, e.g. `OpenRouter`
- **API Type**: `OpenAI Chat Completions`
- **Base URL**: `https://openrouter.ai/api/v1`
- **API Key**: paste the key you just copied

After saving, ZCode probes `https://openrouter.ai/api/v1/models`. If you see a long model list, the network path works. If it spins forever, that's usually a network issue (in mainland China you may need to be able to reach the domain).

## Step 3: Add the free model to the list

Once the provider is added, the dropdown shows OpenRouter's full catalog. Free models need to be enabled manually — select the provider, expand the model list, find the one with `:free` in the name, and flip the switch on the right.

Under the hood, flipping the switch writes a rule to the config file's `providerConfigRules.providerModelRules`:

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

If you prefer editing config directly, the target file is `~/.zcode/v2/provider_config.json` — edit it and restart the app.

## Step 4: Set it as the default

On startup, ZCode uses whichever model is picked in **Settings → General → Default Model**. Set the OpenRouter free model there, and new chats will use it.

If you want ZCode to prefer the free model whenever you haven't hand-picked one, drag it to the very top of the model order in Providers. ZCode's `modelOrder` is tried sequentially — being first means it's hit on first load and on automatic fallback.

## Verify the connection

Start a new chat and type "Hello, reply with one sentence."

- **Success**: instant reply; response headers contain `openrouter-ai` fields
- **Failure (401)**: bad key, over quota, or that model isn't enabled for your account
- **Failure (5xx / spinning)**: network unreachable — ZCode can't contact `openrouter.ai`

## A few common pitfalls

**1. The free quota is global, not per-provider.** All models share one free allowance under a single OpenRouter Key.

**2. Free models don't support every tool.** Some reject vision, function calling, or structured output — when you get a `400`, try a different model before changing code.

**3. Don't expect free models to survive long tasks.** Timeouts, rate limiting, and mid-stream drops are common on the free tier. Confirm an upstream can sustain itself before wiring it into an agent loop.

**4. Don't commit your key.** That `provider_config.json` is per-machine local config, but if you sync it across devices, rotate the key regularly.

## What's next

Free models are a low-cost way to validate ideas, write documentation, and tune small logic. When your needs move up a level — automated workflows, bigger context windows, a stable SLA — consider upgrading to paid, or going back to Free Router: run a local gateway and keep retry boundaries, key cooling, and multi-key rotation in your own hands.

> Free models are the threshold; a local gateway is the ceiling.
