---
title: A model guide for the GPT-6 family
description: OpenAI published a selection guide for the GPT-6 family and a DevDay recap in the same week, alongside a lower-cost model aimed at coding and computer interaction. A catalogue that keeps multiplying is a problem your gateway has to absorb.
publishedAt: 2026-10-02
source: OpenAI
sourceUrl: https://openai.com/news/
tags: [Model selection, OpenAI]
---

On October 2, OpenAI published "A model guide for the GPT-6 family": practical guidance on selecting, tuning, prompting, and productionizing the models. Three days earlier, its DevDay 2026 recap listed more than 20 announcements spanning models, Codex, APIs, security, and developer tooling.

In between came GPT-6.1 Sol on September 29 — a lower-cost model focused on coding, computer interaction, and professional work.

## Three things worth noticing

**Model IDs are forking fast.** The same week produced a general family model, a cheaper sibling, and a product-shaped assistant. Longer names are not necessarily worse, but hardcoding one model name in your application gets more brittle every month.

**The documentation is shifting from capability to deployment.** A model guide spends most of its length on staying reliable in production — latency, retries, gradual rollout — rather than on benchmark tables.

**Price tiers are now explicit.** When a cheap model and a flagship model ship together, sending every request to one model is rarely the right cost structure.

## What this means if you run your own gateway

Free Router passes requests through an OpenAI-compatible surface: the body goes upstream unchanged, nothing is retried once response headers are out, and a stream that has started is never replayed. Those semantics line up neatly with a world of tiered models:

- Reach for a `<provider>/<model>` prefix to pin a cheaper model to batch work and save the flagship for genuinely hard requests — or let `space-bunny` auto-route and let the gateway decide.
- Run a new model through your own gateway before switching to it. An identical interface does not mean identical behaviour: tool calling, multimodal parameters, and size limits all vary.
- Per-key rotation matters more here. Cheaper models also hit rate limits more readily, so cooldown and failover are defaults rather than extras.

Source: [OpenAI News](https://openai.com/news/).
