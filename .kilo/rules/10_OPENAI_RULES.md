# 10 - OpenAI Rules

## Purpose

These rules apply when SummonerWorld uses OpenAI or other LLM APIs for tooling, development automation, content generation, NPC dialogue, moderation, or future live features.

## Current Project Rule

Do not add OpenAI API usage unless the current task explicitly requires it.

SummonerWorld is currently a browser-based offline-first game prototype. Core gameplay must not depend on external AI services.

## Secret Handling

Never commit API keys.

Forbidden:

```text
OPENAI_API_KEY=...
sk-...
project tokens
organization tokens
```

Use `.env.example` for variable names only.

## Client Exposure Rule

Do not expose private API keys in React client code.

If future OpenAI features require secrets, route calls through a backend service.

## Offline-First Rule

Any OpenAI-powered feature must have an offline-safe fallback or be clearly marked as an online-only feature.

Core progression, save/load, combat, dungeon, economy, and world generation must continue to work without external API access.

## Cost Awareness

If adding OpenAI calls, document:

- Which model is used
- When the call happens
- Expected frequency
- Expected token usage
- Whether the call is optional
- Whether the result is cached

## Privacy Rule

Do not send player private data, saves, account details, or unpublished content to external APIs without an explicit feature requirement and documentation.

Future online features must clearly document what data is sent outside the game server.

## Determinism Rule

LLM output is not deterministic enough for authoritative gameplay simulation.

Do not use LLM output as the source of truth for:

- Combat results
- Economy transactions
- PvP outcomes
- Dungeon generation
- Save migrations
- Account progression
- Marketplace trades

LLM output may assist with flavor text, suggestions, admin tooling, or draft content when validated by deterministic systems.

## PR Requirements for OpenAI Work

A PR that adds or changes OpenAI usage must include:

```text
## OpenAI Impact
- Model used:
- API key handling:
- Offline fallback:
- Privacy impact:
- Cost impact:
- Determinism impact:
```

## Forbidden

- No API keys in source.
- No direct browser calls with private keys.
- No LLM-authoritative gameplay state.
- No hidden network dependency in offline prototype systems.
