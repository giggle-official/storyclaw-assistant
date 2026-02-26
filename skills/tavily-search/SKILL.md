---
name: tavily-search
description: "Search the web using Tavily's LLM-optimized API. Returns relevant results with content snippets, relevance scores, and metadata. Use when you need current web information, recent news, documentation, or any data beyond your knowledge cutoff."
homepage: https://tavily.com
official: false
metadata:
  { "openclaw": { "emoji": "🔍", "requires": { "envs": ["TAVILY_API_KEY"], "bins": ["curl"] } } }
---

# Tavily Search Skill

Search the web and get LLM-optimized results. Preferred over `web-search` when you need structured relevance scoring, domain filtering, or time-range filtering without spinning up a local browser.

## Authentication

Set `TAVILY_API_KEY` in `~/.openclaw/.env.local`:

```
TAVILY_API_KEY=tvly-your-api-key-here
```

Get a key at https://tavily.com (1,000 free credits/month).

## When to Use This Skill

- Finding current news, events, or information beyond your knowledge cutoff
- Researching a topic from trusted/specific domains
- Time-scoped queries (e.g. "past week", "past month")
- When you need relevance scores to rank and filter results
- Quick factual lookups where browser automation would be overkill

Prefer `tavily-research` for deep multi-source synthesis or market analysis.

## Quick Start

```bash
# Basic search
curl -s -X POST https://api.tavily.com/search \
  -H "Authorization: Bearer $TAVILY_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"query": "latest Claude model releases 2025", "max_results": 5}'
```

## API Reference

**Endpoint:** `POST https://api.tavily.com/search`

### Request Fields

| Field                 | Type    | Default      | Description                                    |
| --------------------- | ------- | ------------ | ---------------------------------------------- |
| `query`               | string  | **Required** | Search query (keep under 400 chars)            |
| `max_results`         | integer | 10           | Max results returned (1–20)                    |
| `search_depth`        | string  | `"basic"`    | `ultra-fast` / `fast` / `basic` / `advanced`   |
| `topic`               | string  | `"general"`  | Search topic category                          |
| `time_range`          | string  | null         | `day` / `week` / `month` / `year`              |
| `start_date`          | string  | null         | Return results after this date (`YYYY-MM-DD`)  |
| `end_date`            | string  | null         | Return results before this date (`YYYY-MM-DD`) |
| `include_domains`     | array   | `[]`         | Restrict to these domains (max 300)            |
| `exclude_domains`     | array   | `[]`         | Exclude these domains (max 150)                |
| `country`             | string  | null         | Boost results from a specific country          |
| `include_raw_content` | boolean | false        | Include full page content in results           |
| `include_images`      | boolean | false        | Include image results                          |

### Response Format

```json
{
  "query": "latest Claude model releases 2025",
  "results": [
    {
      "title": "Page Title",
      "url": "https://example.com/page",
      "content": "Extracted text snippet...",
      "score": 0.91
    }
  ],
  "response_time": 1.2
}
```

## Search Depth Guide

| Depth        | Latency | Use When                           |
| ------------ | ------- | ---------------------------------- |
| `ultra-fast` | Lowest  | Real-time chat, quick lookups      |
| `fast`       | Low     | Latency matters but need chunks    |
| `basic`      | Medium  | General-purpose (default)          |
| `advanced`   | Higher  | Precision critical, best relevance |

## Examples

### Recent news with time filter

```bash
curl -s -X POST https://api.tavily.com/search \
  -H "Authorization: Bearer $TAVILY_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "query": "AI agent frameworks news",
    "time_range": "week",
    "max_results": 10
  }'
```

### Domain-restricted search

```bash
curl -s -X POST https://api.tavily.com/search \
  -H "Authorization: Bearer $TAVILY_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "query": "Python async patterns",
    "include_domains": ["docs.python.org", "realpython.com", "github.com"],
    "search_depth": "advanced"
  }'
```

### With full page content

```bash
curl -s -X POST https://api.tavily.com/search \
  -H "Authorization: Bearer $TAVILY_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "query": "openclaw agent config format",
    "max_results": 3,
    "include_raw_content": true
  }'
```

## Tips

- Keep queries under 400 characters — think search terms, not prompts
- Break complex topics into multiple targeted sub-queries
- Use `include_domains` to focus on authoritative sources
- Use `score` field (0–1) to filter low-relevance results; discard below 0.5
- Use `time_range` when the user asks about recent events or news
- `advanced` depth is recommended when result quality matters more than speed
