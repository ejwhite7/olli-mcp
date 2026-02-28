import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js'
import { z } from 'zod'
import type { OlliClient } from '../client.js'

const PERIODS = [
  'current_month',
  'last_month',
  'last_7_days',
  'last_30_days',
  'last_90_days',
  'all_time',
] as const

export function registerAnalyticsTools(server: McpServer, client: OlliClient) {
  server.tool(
    'get_analytics',
    'Get workspace analytics (impressions, engagement, follower growth)',
    {
      workspace_id: z.string().describe('Workspace slug or UUID'),
      period: z.enum(PERIODS).default('last_30_days').describe('Time period for analytics'),
    },
    async ({ workspace_id, period }) => {
      const data = await client.get(
        `/workspaces/${workspace_id}/analytics?period=${period}`,
      )
      return { content: [{ type: 'text', text: JSON.stringify(data, null, 2) }] }
    },
  )
}
