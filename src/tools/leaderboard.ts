import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js'
import { z } from 'zod'
import type { OlliClient } from '../client.js'

export function registerLeaderboardTools(server: McpServer, client: OlliClient) {
  server.tool(
    'get_leaderboard',
    'Get the workspace member leaderboard ranked by content performance',
    {
      workspace_id: z.string().describe('Workspace slug or UUID'),
      period: z.enum(['current_month', 'last_month', 'current_week', 'last_7_days', 'last_30_days', 'last_90_days', 'all_time']).optional().describe('Time period for leaderboard calculation (default: current_month)'),
      team_id: z.string().optional().describe('Filter leaderboard to members of a specific team UUID'),
    },
    async ({ workspace_id, period, team_id }) => {
      const params = new URLSearchParams()
      if (period !== undefined) params.set('period', period)
      if (team_id !== undefined) params.set('team_id', team_id)
      const qs = params.size ? `?${params}` : ''
      const data = await client.get(`/workspaces/${workspace_id}/leaderboard${qs}`)
      return { content: [{ type: 'text', text: JSON.stringify(data, null, 2) }] }
    },
  )
}
