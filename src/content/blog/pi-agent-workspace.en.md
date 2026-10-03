---
title: "Pi Agent: what it can and cannot do"
description: Which tools the built-in coding agent ships with, where its limits sit, and what "the working directory is not a sandbox" actually means.
publishedAt: 2026-10-02
tags: [Pi Agent, Security]
---

Free Router ships with Pi, a coding agent, built in. It reuses the gateway configuration you already have — there is no second set of model keys to set up.

## Its tools

The agent's tools are:

`read` · `write` · `edit` · `bash` · `grep` · `find` · `ls` · `web_search`

The first seven are built in. `web_search` is a custom tool powered by Exa and needs `EXA_API_KEY`. The built-in set covers the whole "read code → edit files → run tests" loop on its own.

The default thinking level is `high`. It registers the same four gateway model IDs under the provider name `free-router` using the OpenAI Chat Completions API — meaning the agent and your application enter through the same door.

## Hard limits

These are in the code, not soft suggestions you can talk your way around:

| Limit | Value |
| --- | --- |
| Maximum sessions | 12 |
| Concurrent tasks | 1 |
| Session storage | Memory only |
| Assistant message cap | 80,000 characters |
| Default tool output truncation | 24,000 characters |

Only one task runs at a time; a second one gets a `409`. Sessions live in memory: refreshing the web UI keeps them, restarting the service clears them, but **files the agent already edited stay edited**.

The working directory defaults to the project root and can be changed with `PI_AGENT_WORKSPACE`.

## The working directory is not a sandbox

This one deserves expanding, because it is the most commonly misread detail.

**The agent's tools run with your local user permissions.** The working directory only resolves relative paths; it is not a security boundary.

In practice: whatever your user can read, the agent can read. Whatever your user can write, it can write. Whatever commands your user can run, it can run. There is no additional permission narrowing and no path allow-list.

The conclusion is simple: **use it in a local environment you trust.** If you need real isolation, a container or a restricted user account is the right tool. Pi Agent is not.

## How it is invoked

On the first agent open, the Rust backend spawns Node on a random port bound to loopback only, authenticating with a one-time 32-byte hex token (`PI_BRIDGE_TOKEN`, regenerated per bridge instance).

The Node side exposes a fixed allow-list: `GET /status`, `GET|POST /sessions`, `GET|DELETE /sessions/:id`, `POST /sessions/:id/prompt`, and `POST /sessions/:id/abort`. Everything else is rejected, and Rust validates the allow-list a second time. Shutdown happens when Rust closes Node's stdin.

Without `GATEWAY_API_KEY` set, `/api/agent/*` accepts loopback peers only. Cross-origin form posts cannot trigger it either, because the endpoints require a custom header.

## It uses your keys

The agent needs no separate model credentials — it reuses your existing upstream keys, rotation, and failover. If a management key exists, the agent uses the **management** key; an ordinary model key cannot authorize the coding endpoints.