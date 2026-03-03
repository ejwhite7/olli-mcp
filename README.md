# @olli/mcp-server

MCP server for [olli.social](https://olli.social) — lets LLMs manage your social presence via API key.

## Installation

Add to your Claude Desktop (or other MCP client) config:

```json
{
  "mcpServers": {
    "olli": {
      "command": "npx",
      "args": ["-y", "@olli/mcp-server"],
      "env": {
        "OLLI_API_KEY": "olli_sk_your_key_here"
      }
    }
  }
}
```

Generate an API key in your olli.social profile settings under **API Keys**.

## Configuration

| Variable | Required | Default |
|---|---|---|
| `OLLI_API_KEY` | Yes | — |
| `OLLI_BASE_URL` | No | `https://api.olli.social/v1` |

## Tools (43)

| Category | Tools |
|---|---|
| Campaigns | `list_campaigns`, `get_campaign`, `create_campaign`, `update_campaign`, `delete_campaign` |
| Drafts | `list_drafts`, `get_draft`, `create_draft`, `update_draft`, `delete_draft`, `publish_draft`, `schedule_draft` |
| Calendar | `list_calendar_events`, `get_calendar_event`, `create_calendar_event`, `update_calendar_event`, `delete_calendar_event` |
| Assets | `list_assets`, `get_asset`, `create_asset`, `delete_asset` |
| ICPs | `list_icps`, `create_icp`, `update_icp`, `delete_icp` |
| Industries | `list_industries`, `create_industry`, `update_industry`, `delete_industry` |
| Products | `list_products`, `create_product`, `update_product`, `delete_product` |
| Teams | `list_teams`, `get_team` |
| Analytics | `get_analytics` |
| Amplification | `list_amplification_posts`, `create_amplification_post` |
| Leaderboard | `get_leaderboard` |
| AI | `generate_post`, `improve_content`, `create_variations`, `suggest_hashtags` |

All workspace-scoped tools require a `workspace_id` (slug or UUID, e.g. `"olli-demo"`).

## Development

```bash
npm install
OLLI_API_KEY=olli_sk_... npm run dev
npm run build
```
