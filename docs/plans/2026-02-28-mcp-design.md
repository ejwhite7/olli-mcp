# Olli MCP Server — Design

**Date:** 2026-02-28
**Status:** Approved

## Overview

A standalone TypeScript MCP server (`@olli/mcp-server`) that wraps the olli.social REST API, allowing LLMs (Claude Desktop, Cursor, etc.) to manage a user's social presence using an olli.social API key.

## Repo

`~/Documents/coding/olli-mcp` — separate git repo, published as npm package `@olli/mcp-server`.

## Technology

- TypeScript + `@modelcontextprotocol/sdk`
- stdio transport (standard MCP pattern)
- `fetch` for HTTP calls (no additional HTTP library)
- Invoked via `npx @olli/mcp-server`

## Project Structure

```
olli-mcp/
├── package.json           (name: "@olli/mcp-server", bin: "olli-mcp")
├── tsconfig.json
├── src/
│   ├── index.ts           (entry: creates server, registers all tools, connects stdio)
│   ├── client.ts          (fetch wrapper: OLLI_API_KEY + OLLI_BASE_URL)
│   └── tools/
│       ├── campaigns.ts
│       ├── drafts.ts
│       ├── calendar.ts
│       ├── assets.ts
│       ├── icps.ts
│       ├── industries.ts
│       ├── products.ts
│       ├── teams.ts
│       ├── analytics.ts
│       ├── amplification.ts
│       ├── leaderboard.ts
│       └── ai.ts
└── README.md
```

## Configuration

| Env var | Required | Default |
|---|---|---|
| `OLLI_API_KEY` | Yes | — |
| `OLLI_BASE_URL` | No | `https://api.olli.social/api/v1` |

Startup fails with a clear error if `OLLI_API_KEY` is missing.

## Tool Inventory (30 tools)

| File | Tools |
|---|---|
| `campaigns.ts` | `list_campaigns`, `get_campaign`, `create_campaign`, `update_campaign`, `delete_campaign` |
| `drafts.ts` | `list_drafts`, `get_draft`, `create_draft`, `update_draft`, `delete_draft`, `publish_draft`, `schedule_draft` |
| `calendar.ts` | `list_calendar_events`, `get_calendar_event`, `create_calendar_event`, `update_calendar_event`, `delete_calendar_event` |
| `assets.ts` | `list_assets`, `get_asset`, `create_asset`, `delete_asset` |
| `icps.ts` | `list_icps`, `create_icp`, `update_icp`, `delete_icp` |
| `industries.ts` | `list_industries`, `create_industry`, `update_industry`, `delete_industry` |
| `products.ts` | `list_products`, `create_product`, `update_product`, `delete_product` |
| `teams.ts` | `list_teams`, `get_team` |
| `analytics.ts` | `get_analytics` |
| `amplification.ts` | `list_amplification_posts`, `create_amplification_post` |
| `leaderboard.ts` | `get_leaderboard` |
| `ai.ts` | `generate_post`, `improve_content`, `suggest_hashtags`, `create_variations` |

All workspace-scoped tools require a `workspace_id` string parameter (workspace slug, e.g. `"olli-demo"`).

## API Client Pattern

`client.ts` exports an `OlliClient` class:
- Constructor reads `OLLI_API_KEY` and `OLLI_BASE_URL` from env
- `get(path)`, `post(path, body)`, `patch(path, body)`, `delete(path)` methods
- Throws `McpError` with `ErrorCode.InternalError` on non-2xx responses, including the API's `error.message`

## Error Handling

- API 4xx/5xx → `throw new McpError(ErrorCode.InternalError, apiError.message)`
- Network errors → `throw new McpError(ErrorCode.InternalError, "Network error: ...")`
- Missing `OLLI_API_KEY` at startup → `process.exit(1)` with message

## Claude Desktop Config (README example)

```json
{
  "mcpServers": {
    "olli": {
      "command": "npx",
      "args": ["-y", "@olli/mcp-server"],
      "env": {
        "OLLI_API_KEY": "olli_sk_your_key_here",
        "OLLI_BASE_URL": "http://localhost:3000/api/v1"
      }
    }
  }
}
```
