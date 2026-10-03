---
title: "Space Bunny Calling Guide"
description: "Four access paths, a model ID map, capability limits, and a troubleshooting table — how to actually use Space Bunny."
publishedAt: 2026-10-03
tags: [Space Bunny, Providers]
---

> Information current as of 2026-10-03. Space Bunny is in an anonymous testing period;
> its free tier, model IDs, and availability can change at any time. Check each
> provider's official catalog before calling (links in the "References" section at the end).

---

## 0. 30-Second Summary

Space Bunny (`stealth/space-bunny-alpha`) is an **anonymous stealth model** that launched on
2026-09-23 and topped the usage charts on both OpenRouter and OpenCode within three days.
It is currently **free for a limited time**, and community reports put its context window at
**1M tokens** (unconfirmed).

Four available paths, ordered by how much they do for you:

| Path | Base URL | Model ID | Cost | Best for |
| --- | --- | --- | --- | --- |
| **free-router gateway** (recommended) | `http://127.0.0.1:8787/v1` | `space-bunny` | Free (rides upstream) | Daily driver: auto-routing, key pools, failover |
| OpenCode Zen direct | `https://opencode.ai/zen/v1` | `space-bunny-free` | Free | Simplest direct connection; zero-retention privacy |
| OpenRouter direct | `https://openrouter.ai/api/v1` | `stealth/space-bunny-alpha` | Free for now, then pay-as-you-go | Existing OpenRouter accounts |
| Command Code direct | `https://api.commandcode.ai/provider/v1` | `stealth/space-bunny-alpha` | Free during stealth preview | Provider-plan subscribers |

Every path speaks the OpenAI Chat Completions protocol — one SDK covers them all.

---

## 1. What It Is

- **Anonymous stealth model**: the vendor is undisclosed; pages are signed only "stealth."
  Community speculation points to a major Chinese lab, but nothing is confirmed.
- **Free for a limited time**: all three providers currently offer it free; Command Code
  states explicitly that requests on this model cost no credits "while the stealth preview lasts."
- **Text-only chat model**: no image or audio input; supports streaming, tool calls,
  reasoning parameters, and structured JSON output (`response_format`).
- **Battle-tested as a coding agent**: community users have driven full frontend projects with it,
  and the author of this repo ran a full evaluation (a Three.js handheld console built from scratch).
  See [§7 Field Notes](#7-field-notes-agent--coding-use).

---

## 2. Choosing a Path

- **One provider, static config** → connect directly (§4); it's the simplest.
- **Maximum free quota, automatic failover, multi-key rotation** → the free-router gateway (§3).
  Configure all three providers once, and a single `space-bunny` model ID automatically picks a
  healthy upstream; if one key hits 429/5xx, the gateway rotates to the next without your app noticing.

---

## 3. Path A: Through the free-router Gateway (Recommended)

### 3.1 Setup

```sh
# Start the gateway (build first on a fresh clone)
npm install --prefix frontend
npm run build --prefix frontend
cargo run --manifest-path backend/Cargo.toml
# Open http://127.0.0.1:8787 , paste any provider's API key on the Settings page → Save (takes effect immediately)
```

Then generate an app key under "Gateway API Key" in Settings (stored in `gateway-key.local.txt`,
permissions 0600). Once generated, every `/v1` call needs `Authorization: Bearer <gateway key>`.

### 3.2 Model ID Mapping

| Model you send | Gateway behavior | Actual upstream model |
| --- | --- | --- |
| `space-bunny` | Auto-routing, OpenCode first by default | Depends on the selected upstream |
| `openrouter/space-bunny` | Pin to OpenRouter | `stealth/space-bunny-alpha` |
| `opencode/space-bunny` | Pin to OpenCode Zen | `space-bunny-free` |
| `commandcode/space-bunny` | Pin to Command Code | `stealth/space-bunny-alpha` |

The model name in the response keeps the upstream's original ID, and the
`x-gateway-provider` response header tells you which provider actually served the request.

### 3.3 Calling Examples

cURL:

```sh
curl http://127.0.0.1:8787/v1/chat/completions \
  -H 'Content-Type: application/json' \
  -H "Authorization: Bearer $GATEWAY_API_KEY" \
  -d '{"model":"space-bunny","messages":[{"role":"user","content":"Hello"}],"stream":true}'
```

Python (reuse the openai SDK — only the base_url changes):

```python
import os
from openai import OpenAI

client = OpenAI(base_url="http://127.0.0.1:8787/v1", api_key=os.environ["GATEWAY_API_KEY"])
response = client.chat.completions.create(
    model="space-bunny",
    messages=[{"role": "user", "content": "Hello"}],
)
print(response.choices[0].message.content)
```

Node.js:

```js
import OpenAI from "openai";

const client = new OpenAI({
  baseURL: "http://127.0.0.1:8787/v1",
  apiKey: process.env.GATEWAY_API_KEY,
});
const response = await client.chat.completions.create({
  model: "space-bunny",
  messages: [{ role: "user", content: "Hello" }],
});
console.log(response.choices[0].message.content);
```

### 3.4 What the Gateway Absorbs for You (worth knowing before you call)

- **Key pool rotation**: up to 16 keys per provider. On 401/403/429/5xx or connection failure the
  gateway tries the next key in rotation (each key at most once); when a pool is exhausted,
  auto-routing can still switch providers.
- **Failover timing**: only before response headers are sent. **A stream that has already started
  is never retried** (to avoid duplicated content).
- **400s are not retried**: malformed requests come straight back — don't expect the gateway to save you.
- **Shared time budget**: 300-second total timeout by default (`GATEWAY_REQUEST_TIMEOUT_SECS`,
  1–86400, requires restart); every retry and provider switch shares this budget.
  Request body cap: 10 MiB.
- **Config changes take effect immediately**: saved Settings apply to new requests right away;
  in-flight requests keep the config they started with.

### 3.5 Command-Line Management (headless / SSH)

```sh
free-router status                  # run state, default provider, key counts per provider
free-router keys add opencode sk-a sk-b   # append keys (deduped, max 16 per provider)
free-router provider openrouter     # switch the auto-routing default provider
free-router gateway-key generate    # issue a new gateway key (old key invalidated immediately)
```

---

## 4. Path B: Direct to the Providers

### 4.1 OpenCode Zen (easiest direct connection)

1. Register at [opencode.ai](https://opencode.ai/docs/en/zen/), add billing details, copy your API key.
2. Standard OpenAI-compatible call:

```sh
curl https://opencode.ai/zen/v1/chat/completions \
  -H "Authorization: Bearer $OPENCODE_API_KEY" \
  -H 'Content-Type: application/json' \
  -d '{"model":"space-bunny-free","messages":[{"role":"user","content":"Hello"}]}'
```

- Free tier: input / output / cached reads are all listed as Free (limited time).
- Privacy: the docs state the provider follows a **zero-retention policy** and does not train
  on your data; models are hosted in the US.
- Query the live catalog with `GET https://opencode.ai/zen/v1/models`.

### 4.2 OpenRouter

```sh
curl https://openrouter.ai/api/v1/chat/completions \
  -H "Authorization: Bearer $OPENROUTER_API_KEY" \
  -H 'Content-Type: application/json' \
  -d '{"model":"stealth/space-bunny-alpha","messages":[{"role":"user","content":"Hello"}]}'
```

- Official page: [openrouter.ai/stealth/space-bunny-alpha](https://openrouter.ai/stealth/space-bunny-alpha).
- Failed generations are not billed; **402 means insufficient credits**.
- After the free period ends it bills per token — check the page for current pricing.

### 4.3 Command Code

```sh
curl https://api.commandcode.ai/provider/v1/chat/completions \
  -H "Authorization: Bearer $COMMANDCODE_API_KEY" \
  -H 'Content-Type: application/json' \
  -d '{"model":"stealth/space-bunny-alpha","messages":[{"role":"user","content":"Hello"}]}'
```

- Keys are created in [Command Code Studio](https://commandcode.ai/studio/); the same key
  authenticates both the CLI and the API.
- During the stealth preview this model **costs no credits**; the Provider plan is
  $15/month (+$1.01 processing fee) with pay-as-you-go at no markup.
- Note: the **Go plan has no API access** (403 `upgrade_required`).
- Sending a model to the wrong endpoint returns 400 (Claude-family models go to `/v1/messages`;
  space-bunny goes to `/chat/completions`).

---

## 5. Parameters and Capability Limits

Parameters advertised by OpenRouter (apply to direct calls and pass through the gateway):

| Parameter | Notes |
| --- | --- |
| `stream` | SSE streaming, terminated by `data: [DONE]` |
| `tools` / `tool_choice` | Tool calling (the core agent capability; verified in testing) |
| `reasoning` / `reasoning_effort` | Reasoning depth control |
| `response_format` | Structured JSON output |
| `temperature` / `top_p` / `max_tokens` | Standard sampling parameters |

Limits:

- **Text only**: no image or audio input; multimodal parameters pass through the gateway
  untouched, but the upstream ignores them.
- The gateway currently implements **Chat Completions and model listing only** — no conversion
  for the OpenAI Responses or Anthropic Messages protocols.
- Context length: community reports say 1M; the official page doesn't state it. For very long
  inputs, chunk first or probe with a small request.

---

## 6. Practical Tips

1. **Configure all three providers.** During the free period, quota is productivity: with the
   gateway, if OpenCode goes down it falls over to OpenRouter, then Command Code —
   zero changes on the application side.
2. **Always stream.** Long non-streaming replies are the easiest way to hit the 300-second
   budget; and since the gateway never swaps providers mid-stream, double-check parameters
   before opening the stream.
3. **For agent / tool-calling workloads**, just use the `space-bunny` alias and let the gateway
   pick the healthiest upstream. Pin with the `openrouter/` / `opencode/` prefixes only when
   comparing providers.
4. **Watch the free period.** Stealth models can turn paid or disappear without notice.
   `GET /v1/models` (gateway) or each provider's catalog confirms it's still there. Once it
   turns paid, OpenRouter direct calls start charging — switch the default provider first
   if you don't want that.
5. **Back off on 429.** The gateway rotates keys/providers automatically; if you're calling
   directly, the official guidance is retry with backoff — don't hammer.

---

## 7. Field Notes (Agent / Coding Use)

From a full evaluation by this repo's author (space-bunny driving a ZCode agent to build a
Three.js 3D Game Boy with playable Tetris from scratch, ~1,400 lines of vanilla JS):

**Strengths**

- Clean code structure, sensible layering, comments that explain "why" instead of "what changed,"
  high-quality commit messages;
- Builds its own objective verification tooling (`gl.readPixels` framebuffer sampling,
  ASCII rendering checked point by point, 3D projection back-calculation plus real clicks);
- Honest: reports test failures as failures, and when called out it audits its own methodology
  instead of arguing — accurate root-cause fixes, fixes the cause not the symptom.

**Weaknesses (defend in advance)**

- **Poor verification discipline**: tends to verify the cheapest way possible (calling functions
  with hand-fed arguments), bypassing the real code path — shipping integration bugs labeled
  "verified." Run your own end-to-end pass before accepting delivery;
- **Zero performance awareness**: never measures performance; may ship always-on animations that
  pin a CPU core. For browser projects, check Activity Monitor yourself;
- **Cannot see images**: cannot judge visual quality — human review required for UI/visual work;
- **Opaque trade-offs**: tends to decide product-affecting changes (removing features, changing
  interactions) unilaterally — explicitly require it to ask before such calls.

One line: **great as a code generator; as an autonomous deliverer, keep human eyes on
verification and performance.**

---

## 8. Troubleshooting Quick Reference

| Symptom | Cause and fix |
| --- | --- |
| Gateway returns 503 | No upstream key configured, or that provider's key pool is empty — add keys in Settings |
| Gateway returns 504 | Total time budget exhausted (default 300 s, including all retries) — raise `GATEWAY_REQUEST_TIMEOUT_SECS` and restart |
| OpenRouter returns 402 | Insufficient credits (free period over, or account in arrears) |
| Command Code returns 403 `upgrade_required` | Go plan has no API access; Provider plan or above required |
| Returns 400 | Bad parameters, or — on Command Code — the model was sent to the wrong endpoint |
| Returns 429 | Upstream rate limit — back off and retry when direct; the gateway rotates keys/providers automatically |
| Streaming reply cut off | Budget exhaustion terminates an in-flight response; raise the budget or chunk the task |
| Want to know which provider served a request | Check the `x-gateway-provider` response header |

---

## 9. References

- free-router gateway: README of the `Neonity2020/free-router` project (authoritative source for
  model routing, key pools, timeouts, and the CLI)
- OpenRouter model page: <https://openrouter.ai/stealth/space-bunny-alpha>
- OpenCode Zen docs: <https://opencode.ai/docs/en/zen/>
- Command Code Provider API: <https://commandcode.ai/docs/provider>
- Command Code Studio (key issuance): <https://commandcode.ai/studio/>
- Community coverage: Chinese tech media reports on "Space Bunny" topping both platforms within
  three days (Sohu, CSDN, late September 2026), including the 1M-context claim and community
  comparisons to GLM-5.3-Flash — none officially confirmed
