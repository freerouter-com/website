---
title: Your first request
description: Connect a familiar OpenAI SDK call to the local gateway in three steps, and clear up the difference between GATEWAY_API_KEY and a generated gateway key.
publishedAt: 2026-09-04
tags: [Getting started, OpenAI SDK]
---

Free Router does one thing: **point your app's `baseURL` at `http://127.0.0.1:8787/v1`**.

Request shapes, auth headers, and streaming responses all stay the way the OpenAI SDK already expects them. There is no new protocol to learn.

## Step one: start the gateway

Building from source needs Node.js 22.19+ and Rust 1.89+:

```sh
npm install --prefix frontend
npm ci --prefix agent
npm run build --prefix frontend
cargo run --manifest-path backend/Cargo.toml
```

The gateway listens on `127.0.0.1:8787` by default, so the API base URL is `http://127.0.0.1:8787/v1`.

If 8787 is already taken, the desktop app picks the next free port. **Use the base URL shown in the app** rather than hard-coding a port.

> On macOS, closing the desktop window only hides it — the gateway keeps running. Use the quit command in the menu to stop both the gateway and Pi Agent.

## Step two: add upstream keys

Add provider API keys in Settings, then generate a gateway key.

The `OPENROUTER_API_KEY`, `OPENCODE_API_KEY`, and `COMMANDCODE_API_KEY` environment variables seed the initial key pools, but **values saved in Settings win** — including when you clear a key in the UI.

Provider keys live in `settings.local.json` inside the config directory, with Unix permissions of `0600`, and the file is git-ignored.

## Step three: use the right key

Two keys with different jobs, and neither can stand in for the other:

| Key | Used for |
| --- | --- |
| `GATEWAY_API_KEY` | The management key, for endpoints like `/api/settings` |
| A generated `fr_...` key | The application key, scoped to `/v1` |

An application key cannot change configuration, and the management key does not belong in your app's source.

## Then this is all it takes

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

`space-bunny` picks an upstream for you. The default order is OpenCode Zen → OpenRouter → Command Code, changeable in Settings or via `DEFAULT_PROVIDER`.

To pin one provider, prefix the model:

- `openrouter/space-bunny`
- `opencode/space-bunny`
- `commandcode/space-bunny`
- `commandcode/<any other Chat Completions model ID>`

## Ask before you hard-code

```sh
curl http://127.0.0.1:8787/v1/models -H "Authorization: Bearer $GATEWAY_API_KEY"
```

The gateway advertises four model IDs today. Running this once is faster than guessing.

> **Chat Completions only, for now.** `/v1/chat/completions` and `/v1/models` are the only two endpoints. The Responses API and the Anthropic Messages protocol are not translated.