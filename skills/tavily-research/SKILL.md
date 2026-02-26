---
name: tavily-research
description: "Deep multi-source research with automatic citations via Tavily's Research API. Use when you need comprehensive analysis, comparisons, market research, or structured reports grounded in live web data. Takes 30–120 seconds."
homepage: https://tavily.com
official: false
metadata:
  { "openclaw": { "emoji": "📚", "requires": { "envs": ["TAVILY_API_KEY"], "bins": ["curl"] } } }
---

# Tavily Research Skill

Conduct comprehensive, citation-backed research on any topic. Tavily performs multiple iterative web searches, synthesizes sources, and returns a structured report — no manual source gathering required.

## Authentication

Set `TAVILY_API_KEY` in `~/.openclaw/.env.local`:

```
TAVILY_API_KEY=tvly-your-api-key-here
```

## When to Use This Skill

- Multi-source comparisons ("LangGraph vs CrewAI vs AutoGen")
- Market analysis or competitive landscape reports
- Current events synthesis with citations
- Technical deep-dives that need multiple authoritative sources
- Any question where a single search result is insufficient

Prefer `tavily-search` for quick single-topic lookups where you just need a list of results.

> **Note:** Research takes 30–120 seconds. Set user expectations accordingly before starting.

## API Overview

The Research API is **asynchronous**: you submit a task, then poll for results.

**Step 1 — Submit research task:**

```
POST https://api.tavily.com/research
```

**Step 2 — Poll for status/results:**

```
GET https://api.tavily.com/research/{task_id}
```

## Step 1: Submit Task

```bash
curl -s -X POST https://api.tavily.com/research \
  -H "Authorization: Bearer $TAVILY_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "input": "Compare LangGraph vs CrewAI for multi-agent systems in 2025",
    "model": "pro"
  }'
```

**Response:**

```json
{
  "task_id": "res_abc123xyz",
  "status": "pending"
}
```

### Request Fields

| Field   | Type   | Default      | Description                |
| ------- | ------ | ------------ | -------------------------- |
| `input` | string | **Required** | Research topic or question |
| `model` | string | `"mini"`     | `mini` / `pro` / `auto`    |

### Model Selection

| Model  | Best For                                   | Typical Time |
| ------ | ------------------------------------------ | ------------ |
| `mini` | Single topic, targeted question            | ~30s         |
| `pro`  | Multi-angle analysis, comparisons, reports | 60–120s      |
| `auto` | Let Tavily decide based on complexity      | Varies       |

**Rule of thumb:** "What does X do?" → `mini`. "X vs Y vs Z" or "best way to..." → `pro`.

## Step 2: Poll for Results

```bash
curl -s -X GET https://api.tavily.com/research/res_abc123xyz \
  -H "Authorization: Bearer $TAVILY_API_KEY"
```

**Response when complete:**

```json
{
  "task_id": "res_abc123xyz",
  "status": "completed",
  "report": "## LangGraph vs CrewAI\n\n...",
  "sources": [
    {
      "title": "LangGraph Documentation",
      "url": "https://langchain-ai.github.io/langgraph/",
      "content": "..."
    }
  ]
}
```

Poll every 5–10 seconds until `status` is `"completed"` or `"failed"`.

## Examples

### Quick targeted research (mini)

```bash
# Submit
curl -s -X POST https://api.tavily.com/research \
  -H "Authorization: Bearer $TAVILY_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"input": "What is retrieval augmented generation?", "model": "mini"}'

# Poll with task_id from response
curl -s https://api.tavily.com/research/{task_id} \
  -H "Authorization: Bearer $TAVILY_API_KEY"
```

### Comprehensive market research (pro)

```bash
curl -s -X POST https://api.tavily.com/research \
  -H "Authorization: Bearer $TAVILY_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"input": "Fintech startup landscape 2025 key players funding trends", "model": "pro"}'
```

## Tips

- Always tell the user research is in progress — it takes time
- Use `mini` for "explain X" style questions, `pro` for analysis/comparison
- The returned `report` is already synthesized markdown with inline citations
- Check `sources` array to verify and share references with the user
- If `status` is `"failed"`, retry once with a simpler or more specific `input`
