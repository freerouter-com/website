---
title: "Distillation under attack: OpenAI discloses a coordinated extraction effort"
description: OpenAI published details of an organised model-distillation campaign and the anti-distillation work that followed it. For local-first users the interesting part is not the cat-and-mouse, but where your prompts travel.
publishedAt: 2026-09-30
source: OpenAI
sourceUrl: https://openai.com/news/
tags: [Security, Model ecosystem]
---

On September 30, OpenAI published "Disrupting a coordinated model-distillation campaign," describing an organised attempt to extract its models and the strengthened anti-distillation defences that came out of it.

The mechanics of distillation are not mysterious: query a strong model at volume, train a cheaper one to imitate its behaviour. The hard part is organisational — sustained, high-volume, consistent calling, which is exactly what makes it detectable at the source.

## Why an ordinary user should care

Incidents like this rarely break your day-to-day calls. But they mark a real boundary: **where your prompts go depends on who you send the request to.**

A few questions you can answer against your own setup:

- Do your prompts carry anything meant to stay private — internal code, customer data, unreleased plans?
- Do those prompts go straight to a provider, or through an entry point you control?
- If a model's behaviour, quota, or price changes tomorrow, does your application have another path?

## What this means if you run your own gateway

Free Router is local-first: keys are managed by the local backend, upstream requests leave from your own machine, and the gateway does not retain prompts of its own. That is not zero exposure to providers — a request has to reach *some* model — but it turns "send it out" from an SDK default into a decision you can see, change, and switch off.

`space-bunny` auto-routing makes the same trade in the other direction: it picks between upstreams, so an identical prompt may reach one provider today and another tomorrow. If a prompt should not travel that far, swap auto-routing for an explicit `<provider>/<model>` prefix and tighten that one variable.

Source: [OpenAI News](https://openai.com/news/).
