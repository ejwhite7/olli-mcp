import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js'
import { z } from 'zod'
import type { OlliClient } from '../client.js'

export function registerLeaderboardTools(server: McpServer, client: OlliClient) {
  server.tool(
    'get_leaderboard',
    'Get the workspace member leaderboard ranked by content performance',
    {
      workspace_id: z.string().describe('Workspace slug or UUID'),
    },
    async ({ workspace_id }) => {
      const data = await client.get(`/workspaces/${workspace_id}/leaderboard`)
      return { content: [{ type: 'text', text: JSON.stringify(data, null, 2) }] }
    },
  )
}
