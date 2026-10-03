---
title: Failover boundaries inside a streaming response
description: When the gateway retries, when it refuses to, and why a started stream can never be replayed.
publishedAt: 2026-09-25
tags: [Routing, Streaming]
---

"Failover" sounds like it means "switch automatically when something fails." That is half right — **where the line falls is the whole point.**

## What does retry: transport and transient upstream errors

The gateway moves to another key or another provider for:

- `401` / `403`
- `429`
- `5xx`
- Connection-level errors

All of those mean "this key or this provider is unavailable right now."

## What does not retry: a problem with your request

A `400` is **returned to you unchanged**. The gateway will not forward it to the next provider.

The reasoning is straightforward: the same request against a different upstream is very likely to fail the same way. Retrying only turns one failure into several and spends more quota.

## The one `400` that looks like an exception

OpenRouter and OpenCode Zen require the model to reason. If you send parameters that disable reasoning — `reasoning_effort: "none"`, `reasoning: { enabled: false }`, `thinking: { type: "disabled" }`, or `enable_thinking: false` — the gateway returns a `400` telling you to use `low`, `medium`, `high`, `xhigh`, or `max`.

But here is what matters: **that decision happens while choosing upstreams, not while retrying.** An incompatible provider never receives the request. So with `space-bunny` auto-routing, such a request lands on Command Code directly instead of failing once against OpenRouter first.

## After a stream starts, there is no retry

This is the most important boundary.

Streaming responses are **pure pass-through**: upstream SSE frames are forwarded unmodified, with no re-chunking and no re-encoding. Tool calls, multimodal parameters, and SSE events all arrive exactly as the upstream sent them.

Once response headers are out and the first bytes reach your client, the gateway **will not replay the request**. The reason is practical: if an upstream fails after emitting half a reply, a replay produces the same content again from the start. A duplicated half-sentence is worse than an outright failure.

Failover therefore happens **before the response begins**. Once your client has received content, failure is the only remaining outcome.

## One shared time budget

All key retries, all provider switches, and the final response body and SSE stream share a single budget. It defaults to 300 seconds:

```sh
GATEWAY_REQUEST_TIMEOUT_SECS=300
```

The valid range is 1 to 86400 seconds, and changes require a gateway restart.

When the budget runs out there are two outcomes:

- **Headers not yet sent** → `504`
- **Headers already sent** → the stream is cut

This is the other face of the no-replay policy: the budget covers the whole request, not one retry.

## Finding out who answered

Every response carries an `x-gateway-provider` header naming the upstream that actually served it. When debugging routing, read that header first, then the `requests`, `fallbacks`, and `key_retries` counters on `GET /api/status`.

> Those counters and the cooldown state live in memory and reset on restart.