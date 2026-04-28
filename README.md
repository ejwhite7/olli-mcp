# @b2b-saas-inc/olli-mcp-server

MCP server for [olli.social](https://olli.social) — lets LLMs manage your social presence via API key.

## Installation

Add to your Claude Desktop (or other MCP client) config:

```json
{
  "mcpServers": {
    "olli": {
      "command": "npx",
      "args": ["-y", "@b2b-saas-inc/olli-mcp-server"],
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

## Tools (68)

| Category | Tools |
|---|---|
| Workspaces | `list_workspaces`, `get_workspace`, `update_workspace`, `list_memberships`, `update_membership`, `remove_membership`, `list_invitations`, `create_invitation`, `delete_invitation`, `get_feature_flags`, `get_plan_features` |
| Campaigns | `list_campaigns`, `get_campaign`, `create_campaign`, `update_campaign`, `delete_campaign` |
| Drafts | `list_drafts`, `get_draft`, `create_draft`, `update_draft`, `delete_draft`, `publish_draft`, `schedule_draft` |
| Calendar | `list_calendar_events`, `get_calendar_event`, `create_calendar_event`, `update_calendar_event`, `delete_calendar_event` |
| Assets | `list_assets`, `get_asset`, `create_asset`, `delete_asset` |
| ICPs | `list_icps`, `create_icp`, `update_icp`, `delete_icp` |
| Industries | `list_industries`, `create_industry`, `update_industry`, `delete_industry` |
| Products | `list_products`, `create_product`, `update_product`, `delete_product` |
| Teams | `list_teams`, `get_team`, `create_team`, `update_team`, `delete_team`, `list_team_members`, `add_team_member`, `remove_team_member` |
| AI | `generate_post`, `improve_content`, `create_variations`, `suggest_hashtags`, `analyze_content`, `get_ai_usage`, `campaign_generate`, `avatar_chat`, `list_avatar_conversations`, `get_avatar_conversation` |
| Analytics | `get_analytics` |
| Amplification | `list_amplification_posts`, `get_amplification_post`, `create_amplification_post`, `delete_amplification_post` |
| Leaderboard | `get_leaderboard` |
| Integrations | `list_integrations`, `get_linkedin_organizations`, `select_linkedin_organization`, `sync_linkedin`, `get_linkedin_analytics`, `disconnect_integration` |
| Notifications | `list_notifications`, `mark_notification_read`, `mark_all_notifications_read`, `delete_notification` |
| Support | `list_support_tickets`, `get_support_ticket`, `create_support_ticket`, `list_ticket_messages`, `reply_to_ticket` |
| Billing | `get_billing`, `list_invoices` |

All workspace-scoped tools require a `workspace_id` (slug or UUID, e.g. `"olli-demo"`).

## Development

```bash
npm install
OLLI_API_KEY=olli_sk_... npm run dev
npm run build
```

## License

MIT

## Schema Sync

Avatar tool schemas are sourced from `olli-social-app`'s `AvatarToolRegistry` — the single source of truth for all 34 avatar AI tool definitions. Instead of maintaining duplicate schemas in TypeScript, this MCP server imports them as JSON.

### How it works

1. The Rails app exposes `GET /api/v1/ai/avatar_schemas` (protected by shared secret)
2. Running `npm run sync-schemas` fetches the schemas and writes them to `src/generated/avatar-schemas.json`
3. At startup, the MCP server reads this JSON file and dynamically registers avatar tools
4. Each avatar tool proxies execution back to the Rails avatar endpoint

### Setup

Add these variables to your `.env` file:

```env
MCP_RAILS_URL=https://api.olli.social
MCP_SHARED_SECRET=your_shared_secret_here
```

`MCP_RAILS_URL` is the base URL of your olli-social-app Rails server.  
`MCP_SHARED_SECRET` must match the `MCP_SHARED_SECRET` environment variable on the Rails side.

### Syncing schemas

```bash
# Pull latest avatar tool schemas from Rails
npm run sync-schemas
```

The output file `src/generated/avatar-schemas.json` is committed to the repo for reproducible builds. Re-run the sync whenever avatar tool definitions change in the Rails app (i.e., when `AvatarToolRegistry::SCHEMA_VERSION` is bumped).

### Adding new avatar tools

New avatar tools should be added to `AvatarToolRegistry` in `olli-social-app` — never directly in this MCP server. After adding tools in Rails:

1. Bump `SCHEMA_VERSION` in `avatar_tool_registry.rb`
2. Run `npm run sync-schemas` in this repo
3. Commit the updated `avatar-schemas.json`
