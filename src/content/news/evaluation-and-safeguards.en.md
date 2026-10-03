---
title: Evaluation is moving inside the system
description: "Anthropic and Accenture are collaborating on evaluation embedded into AI systems, alongside a life-sciences verification programme and enterprise frontier safeguards. The shared signal: whether a model works is settled on deployment, not on a leaderboard."
publishedAt: 2026-09-17
source: Anthropic
sourceUrl: https://www.anthropic.com/news
tags: [Evaluation, Enterprise]
---

On September 18, Anthropic announced a collaboration with Accenture on evaluation methods embedded into AI systems. Two earlier moves point the same way: the Life Sciences Verification Program on September 17, verifying AI-related claims and supporting reliability in life-sciences applications, and Enterprise Frontier Safeguards on September 1, developed with customers for advanced enterprise systems.

## Why "embedded" is the interesting word

Conventional evaluation is bolted on: run a fixed test set, get a score, ship. The problem is the layer of assumption between the test set and production.

Evaluation embedded in the system puts the judgement back where it actually runs — against specific business data, specific prompt templates, specific users. The verification programme goes further and targets the question "are these AI-derived claims reliable?" rather than "how does this model average?"

## One thing worth copying

If that direction is real, then **measuring your own system** is worth more than watching vendor leaderboards. For an application running on a local gateway, several metrics are available directly:

- **Failover rate** — what share of requests ends up served by a non-preferred upstream. Higher than expected means your routing and cooldown need tuning.
- **Error mix per key** — mostly 429s or mostly 5xx? The backoff strategies are not interchangeable.
- **Time-to-first-byte and total duration, as distributions** — averages hide the long tail, and the tail is what users feel.
- **Explicit prefix versus auto-routing** — for the same task, how much worse is it when the gateway picks the model?

## What this means if you run your own gateway

All of these live at the gateway layer, because the requests, the keys, the switches, and the timings all happened on your own machine. Keeping the data local is, here, not only a privacy property but an observability one.

Source: [Anthropic News](https://www.anthropic.com/news).
