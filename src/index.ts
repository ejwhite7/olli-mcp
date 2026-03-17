#!/usr/bin/env node
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js'
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js'
import { OlliClient } from './client.js'
import { registerWorkspaceTools } from './tools/workspaces.js'
import { registerCampaignTools } from './tools/campaigns.js'
import { registerDraftTools } from './tools/drafts.js'
import { registerCalendarTools } from './tools/calendar.js'
import { registerAssetTools } from './tools/assets.js'
import { registerIcpTools } from './tools/icps.js'
import { registerIndustryTools } from './tools/industries.js'
import { registerProductTools } from './tools/products.js'
import { registerTeamTools } from './tools/teams.js'
import { registerAnalyticsTools } from './tools/analytics.js'
import { registerAmplificationTools } from './tools/amplification.js'
import { registerLeaderboardTools } from './tools/leaderboard.js'
import { registerAiTools } from './tools/ai.js'
import { registerNotificationTools } from './tools/notifications.js'
import { registerIntegrationTools } from './tools/integrations.js'
import { registerSupportTools } from './tools/support.js'
import { registerBillingTools } from './tools/billing.js'
import { registerPixelTools } from './tools/pixel.js'
import { registerRssTools } from './tools/rss.js'
import { registerTrackedProfileTools } from './tools/tracked_profiles.js'
import { registerSettingsTools } from './tools/settings.js'
import { registerGamificationTools } from './tools/gamification.js'
import { registerContentConfigTools } from './tools/content_config.js'

const server = new McpServer({
  name: 'olli',
  version: '0.3.0',
})

const client = new OlliClient()

registerWorkspaceTools(server, client)
registerCampaignTools(server, client)
registerDraftTools(server, client)
registerCalendarTools(server, client)
registerAssetTools(server, client)
registerIcpTools(server, client)
registerIndustryTools(server, client)
registerProductTools(server, client)
registerTeamTools(server, client)
registerAnalyticsTools(server, client)
registerAmplificationTools(server, client)
registerLeaderboardTools(server, client)
registerAiTools(server, client)
registerNotificationTools(server, client)
registerIntegrationTools(server, client)
registerSupportTools(server, client)
registerBillingTools(server, client)
registerPixelTools(server, client)
registerRssTools(server, client)
registerTrackedProfileTools(server, client)
registerSettingsTools(server, client)
registerGamificationTools(server, client)
registerContentConfigTools(server, client)

const transport = new StdioServerTransport()
server.connect(transport).catch((err) => {
  console.error('Fatal MCP error:', err)
  process.exit(1)
})
