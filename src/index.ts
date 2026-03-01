#!/usr/bin/env node
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js'
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js'
import { OlliClient } from './client.js'
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

const server = new McpServer({
  name: 'olli',
  version: '0.1.0',
})

const client = new OlliClient()

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

const transport = new StdioServerTransport()
server.connect(transport).catch((err) => {
  console.error('Fatal MCP error:', err)
  process.exit(1)
})
