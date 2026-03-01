import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js'
import { z } from 'zod'
import type { OlliClient } from '../client.js'

const base = (workspaceId: string) => `/workspaces/${workspaceId}/amplification_posts`

export function registerAmplificationTools(server: McpServer, client: OlliClient) {
  server.tool(
    'list_amplification_posts',
    'List amplification posts (posts queued for team amplification)',
    {
      workspace_id: z.string().describe('Workspace slug or UUID'),
      platform: z.enum(['linkedin', 'twitter']).optional().describe('Filter by platform'),
      user_id: z.string().optional().describe('Filter by submitting user UUID'),
    },
    async ({ workspace_id, ...filters }) => {
      const params = new URLSearchParams(
        Object.entries(filters).filter(([, v]) => v !== undefined) as [string, string][],
      )
      const qs = params.size ? `?${params}` : ''
      const data = await client.get(`${base(workspace_id)}${qs}`)
      return { content: [{ type: 'text', text: JSON.stringify(data, null, 2) }] }
    },
  )

  server.tool(
    'create_amplification_post',
    'Add a post to the amplification queue for team sharing',
    {
      workspace_id: z.string().describe('Workspace slug or UUID'),
      original_post_id: z.string().describe('UUID of the original post/draft'),
      platform: z.enum(['linkedin', 'twitter']),
      content_preview: z.string().describe('Preview text for team members to see'),
      target_audience: z.string().optional().describe('Who this post is targeting'),
      post_url: z.string().url().optional().describe('Public URL of the live post'),
    },
    async ({ workspace_id, ...params }) => {
      const data = await client.post(base(workspace_id), { amplification_post: params })
      return { content: [{ type: 'text', text: JSON.stringify(data, null, 2) }] }
    },
  )
}
