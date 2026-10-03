---
title: "Assistants that keep working: from one request to sustained execution"
description: OpenAI introduced dots, an assistant that continues complex tasks on its own, while Anthropic and OpenAI enterprise stories point the same way. Request/response is giving way to agents that carry on without you.
publishedAt: 2026-10-01
source: OpenAI
sourceUrl: https://openai.com/news/
tags: [Agents, Product trends]
---

On September 29, OpenAI introduced dots, described as proactive assistants capable of continuing complex and everyday tasks. The same day's DevDay recap uses "proactive" repeatedly.

The enterprise cases landed alongside it. On October 1, Anthropic detailed Barclays scaling Claude to transform operations and client experience; OpenAI, the same day, described The Den freeing 10–15 hours a week with ChatGPT Work.

## What actually changed

The old integration model was unambiguous: your code sends a request, the model returns a response, the turn ends. Proactive assistants break that boundary — a task is no longer one call but stateful work that continues.

Three engineering consequences follow:

- **State matters.** A task spans many turns, and a failure should resume from where it stopped rather than start over.
- **Failure is more expensive.** An agent that ran for ten minutes and then lost everything to one upstream 429 costs orders of magnitude more than a single question-and-answer turn.
- **Predictable cost is the prerequisite.** Agent loops burn tokens; you will not switch on unattended execution if you cannot tell what it costs.

## What this means if you run your own gateway

Free Router retries only before response headers are sent and never replays a stream that has started. That rule exists to stop duplicated content — in an agent loop it also stops duplicated *work*.

Paired with per-key rotation and error-type-based cooldown, a long agent task can fail over to another key on a rate limit and keep going instead of dying wholesale. It is also a concrete argument for keeping the gateway on your own machine: how an upstream schedules your traffic is opaque to you, but the retry boundary, the cooldown length, and the moment of switching are settings you control.

Sources: [OpenAI News](https://openai.com/news/), [Anthropic News](https://www.anthropic.com/news).
