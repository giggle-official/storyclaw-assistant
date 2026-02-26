---
name: tavily-crawl
description: "Crawl entire websites and extract content from multiple pages using Tavily's Crawl API. Use when you need to explore a documentation site, knowledge base, or multi-page resource. Supports path filtering and semantic instructions."
homepage: https://tavily.com
official: false
metadata:
  { "openclaw": { "emoji": "🕷️", "requires": { "envs": ["TAVILY_API_KEY"], "bins": ["curl"] } } }
---

# Tavily Crawl Skill

Traverse entire websites and extract content from multiple pages in one API call. Ideal for ingesting documentation sites, knowledge bases, or any multi-page resource into context.

## Authentication

Set `TAVILY_API_KEY` in `~/.openclaw/.env.local`:

```
TAVILY_API_KEY=tvly-your-api-key-here
```

## When to Use This Skill

- You need to read an entire documentation site (e.g. a library's API docs)
- Building a knowledge base from a website
- Exploring an unknown site structure before targeted extraction
- When `tavily-extract` would require too many individual URLs

Use `tavily-extract` when you already have specific URLs. Use this when you need to discover and read multiple pages from a starting URL.

> **Warning:** `max_depth ≥ 2` can take minutes and return large amounts of data. Always start with `max_depth=1` and `limit=20`.

## API Reference

**Endpoint:** `POST https://api.tavily.com/crawl`

### Request Fields

| Field               | Type    | Default      | Description                                             |
| ------------------- | ------- | ------------ | ------------------------------------------------------- |
| `url`               | string  | **Required** | Root URL to begin crawling                              |
| `max_depth`         | integer | 1            | Levels deep to follow links (1–5)                       |
| `max_breadth`       | integer | 20           | Max links to follow per page                            |
| `limit`             | integer | 50           | Total pages cap                                         |
| `instructions`      | string  | null         | Natural language focus guidance                         |
| `chunks_per_source` | integer | 3            | Relevant chunks per page (1–5, requires `instructions`) |
| `extract_depth`     | string  | `"basic"`    | `basic` or `advanced` (for JS-rendered sites)           |
| `format`            | string  | `"markdown"` | `markdown` or `text`                                    |
| `select_paths`      | array   | null         | Regex patterns to include (e.g. `["/docs/.*"]`)         |
| `exclude_paths`     | array   | null         | Regex patterns to exclude (e.g. `["/blog/.*"]`)         |
| `allow_external`    | boolean | true         | Follow links to external domains                        |
| `timeout`           | float   | 150          | Max wait in seconds (10–150)                            |

### Response Format

```json
{
  "base_url": "https://docs.example.com",
  "results": [
    {
      "url": "https://docs.example.com/getting-started",
      "raw_content": "# Getting Started\n\n..."
    }
  ],
  "response_time": 8.3
}
```

## Examples

### Basic crawl (start conservative)

```bash
curl -s -X POST https://api.tavily.com/crawl \
  -H "Authorization: Bearer $TAVILY_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "url": "https://docs.example.com",
    "max_depth": 1,
    "limit": 20
  }'
```

### Focused crawl for agentic use (recommended pattern)

Always use `instructions` + `chunks_per_source` when feeding results into LLM context — returns only relevant chunks instead of full pages, preventing context overflow:

```bash
curl -s -X POST https://api.tavily.com/crawl \
  -H "Authorization: Bearer $TAVILY_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "url": "https://docs.example.com",
    "max_depth": 2,
    "instructions": "Find authentication guides and API reference",
    "chunks_per_source": 3,
    "select_paths": ["/docs/.*", "/api/.*"],
    "exclude_paths": ["/changelog/.*", "/blog/.*"]
  }'
```

### Crawl only specific sections

```bash
curl -s -X POST https://api.tavily.com/crawl \
  -H "Authorization: Bearer $TAVILY_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "url": "https://example.com",
    "max_depth": 2,
    "select_paths": ["/docs/.*"],
    "exclude_paths": ["/docs/legacy/.*"],
    "limit": 30
  }'
```

## Map API (Discover URLs Without Content)

Use `map` when you only need to discover what pages exist before deciding which to crawl or extract:

```bash
curl -s -X POST https://api.tavily.com/map \
  -H "Authorization: Bearer $TAVILY_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "url": "https://docs.example.com",
    "max_depth": 2,
    "instructions": "Find all API reference and authentication pages"
  }'
```

Response returns a list of URLs only — much faster than crawl.

## Depth vs Performance

| max_depth | Typical Pages | Time         |
| --------- | ------------- | ------------ |
| 1         | 10–50         | Seconds      |
| 2         | 50–500        | Minutes      |
| 3+        | 500–5000+     | Many minutes |

## Tips

- **Always start with `max_depth=1` and `limit=20`**, then increase if needed
- **Always set `limit`** to prevent runaway crawls
- Use `instructions` + `chunks_per_source` for agentic workflows — omit only when saving full page data
- Use `select_paths` to focus on relevant site sections (docs, API, guides)
- Use `map` first to understand the site structure, then `crawl` or `extract` specific sections
- `allow_external: false` prevents leaving the target site
