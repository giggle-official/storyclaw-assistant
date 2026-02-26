---
name: tavily-extract
description: "Extract clean content from specific URLs using Tavily's Extract API. Returns markdown or plain text from up to 20 URLs per call. Use when you already know which pages you want content from."
homepage: https://tavily.com
official: false
metadata:
  { "openclaw": { "emoji": "📄", "requires": { "envs": ["TAVILY_API_KEY"], "bins": ["curl"] } } }
---

# Tavily Extract Skill

Extract clean, readable content from one or more specific URLs. Returns markdown-formatted text, stripping navigation, ads, and boilerplate. Handles JavaScript-rendered pages with `advanced` mode.

## Authentication

Set `TAVILY_API_KEY` in `~/.openclaw/.env.local`:

```
TAVILY_API_KEY=tvly-your-api-key-here
```

## When to Use This Skill

- You have specific URLs and need their content (e.g. from a previous search result)
- Reading documentation pages, blog posts, or articles at known URLs
- Extracting content from JavaScript-rendered pages (SPAs, React apps)
- Getting only the relevant portion of a page (via `query` + `chunks_per_source`)

Use `tavily-search` first to find URLs, then this skill to get the full content.

## Quick Start

```bash
# Extract single URL
curl -s -X POST https://api.tavily.com/extract \
  -H "Authorization: Bearer $TAVILY_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "urls": ["https://docs.python.org/3/library/asyncio.html"]
  }'
```

## API Reference

**Endpoint:** `POST https://api.tavily.com/extract`

### Request Fields

| Field               | Type    | Default      | Description                                     |
| ------------------- | ------- | ------------ | ----------------------------------------------- |
| `urls`              | array   | **Required** | URLs to extract (max 20)                        |
| `query`             | string  | null         | Topic query for relevance-based chunking        |
| `chunks_per_source` | integer | null         | Relevant chunks per URL (1–5, requires `query`) |
| `extract_depth`     | string  | `"basic"`    | `basic` or `advanced` (for JS-rendered pages)   |
| `format`            | string  | `"markdown"` | `markdown` or `text`                            |
| `include_images`    | boolean | false        | Include image URLs in results                   |
| `timeout`           | integer | 30           | Request timeout in seconds (1–60)               |

### Response Format

```json
{
  "results": [
    {
      "url": "https://docs.python.org/3/library/asyncio.html",
      "raw_content": "# asyncio — Asynchronous I/O\n\n..."
    }
  ],
  "failed_results": [],
  "response_time": 2.1
}
```

## Examples

### Extract multiple URLs at once

```bash
curl -s -X POST https://api.tavily.com/extract \
  -H "Authorization: Bearer $TAVILY_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "urls": [
      "https://docs.anthropic.com/en/docs/about-claude/models",
      "https://docs.anthropic.com/en/api/getting-started"
    ],
    "format": "markdown"
  }'
```

### Extract only relevant portions (with query)

```bash
curl -s -X POST https://api.tavily.com/extract \
  -H "Authorization: Bearer $TAVILY_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "urls": ["https://react.dev/reference/react/hooks"],
    "query": "useEffect lifecycle cleanup",
    "chunks_per_source": 3
  }'
```

### Extract JavaScript-rendered page

```bash
curl -s -X POST https://api.tavily.com/extract \
  -H "Authorization: Bearer $TAVILY_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "urls": ["https://example-spa.com/docs"],
    "extract_depth": "advanced"
  }'
```

## Tips

- Start with `extract_depth: "basic"` — only use `"advanced"` if content is missing or incomplete
- Use `query` + `chunks_per_source` to get only the relevant sections of long pages, preventing context overflow
- Check `failed_results` in the response — some URLs may fail (paywalls, bot protection)
- Batch up to 20 URLs per call to minimize API usage
- For very large documentation sites, prefer `tavily-crawl` instead
