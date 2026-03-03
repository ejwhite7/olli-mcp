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
