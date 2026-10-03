---
title: Key rotation and cooldown
description: Up to 16 keys per provider, rotated per request, with failures putting a key into a typed cooldown instead of simply staying in rotation.
publishedAt: 2026-09-11
tags: [Configuration, Routing]
---

If you configure several keys for one provider, Free Router does not hand them all to the same request. It rotates per request, and a failure takes that key out of rotation for a while.

## Rotation

Up to 16 keys per provider. The gateway keeps one concurrency-safe cursor per provider and reads a starting point once per request:

```text
start = (cursor += 1) % key_count
```

It then works forward from there. **Each key is tried at most once per request** — a single request never retries the same key repeatedly.

The direct consequence: when an upstream rate-limits per key, configuring more keys spreads the load across them.

## Cooldown

A failure does more than skip a single turn. The gateway sets a cooldown based on the error type:

| Error | Cooldown |
| --- | --- |
| `401` / `403` | 300 seconds |
| `429` / `5xx` | 30 seconds |
| Connection failure | 5 seconds |

When an upstream sends a whole-second `Retry-After` alongside a `429`, that value wins.

A few details worth knowing:

- **Cooldown only ever extends.** A new failure pushes the remaining time further out; a faster response never releases a key early.
- **Success clears it.** The next time the key comes around, it participates normally.
- **Cooling keys are skipped outright**, so no request is spent on them.
- If every key for a provider is cooling, the gateway returns `503` with the earliest `Retry-After`. It **does not block and wait**.

`GATEWAY_KEY_COOLDOWN_SECS` overrides the durations uniformly (capped at 86400 seconds; `0` disables cooldown). The defaults suit most setups — change them when you have a reason to.

## Edits apply without a restart

Adding, removing, or reordering keys in Settings takes effect immediately. The CLI behaves the same way:

```sh
free-router keys list
free-router keys add
free-router keys remove
```

## Secrets are never echoed

Neither the UI nor `GET /api/status` returns key material. They return an irreversible identifier (`key_<sha256 prefix>`), a `Key N` label, and the remaining cooldown in seconds.

Stored keys live in `settings.local.json` in the config directory with permissions `0600`. The frontend never echoes saved provider keys and never writes them to browser storage.

## Environment variables are only a seed

Variables like `OPENROUTER_API_KEY` seed the initial key pools. Once you save settings in the UI, the Settings values win — **including when you clear a key**. After clearing it, that key will not quietly reappear from the environment.