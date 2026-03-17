import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js'
import { z } from 'zod'
import type { OlliClient } from '../client.js'

const base = (workspaceId: string) => `/workspaces/${workspaceId}/amplification_posts`

export function registerAmplificationTools(server: McpServer, client: OlliClient) {
  server.tool(
    'list_amplification_posts',
    'List amplification posts (posts queued for team amplification). Supports pagination.',
    {
      workspace_id: z.string().describe('Workspace slug or UUID'),
      platform: z.enum(['linkedin', 'twitter']).optional().describe('Filter by platform'),
      user_id: z.string().optional().describe('Filter by submitting user UUID'),
      page: z.number().optional().describe('Page number (default: 1)'),
      per_page: z.number().optional().describe('Results per page (default: 25, max: 100)'),
    },
    async ({ workspace_id, page, per_page, ...filters }) => {
      const params = new URLSearchParams(
        Object.entries(filters).filter(([, v]) => v !== undefined) as [string, string][],
      )
      if (page !== undefined) params.set('page', String(page))
      if (per_page !== undefined) params.set('per_page', String(Math.min(per_page, 100)))
      const qs = params.size ? `?${params}` : ''
      const data = await client.get(`${base(workspace_id)}${qs}`)
      return { content: [{ type: 'text', text: JSON.stringify(data, null, 2) }] }
    },
  )

  server.tool(
    'get_amplification_post',
    'Get details of an amplification post',
    {
      workspace_id: z.string().describe('Workspace slug or UUID'),
      id: z.string().describe('Amplification post UUID'),
    },
    async ({ workspace_id, id }) => {
      const data = await client.get(`${base(workspace_id)}/${id}`)
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

  server.tool(
    'delete_amplification_post',
    'Remove a post from the amplification queue',
    {
      workspace_id: z.string().describe('Workspace slug or UUID'),
      id: z.string().describe('Amplification post UUID'),
    },
    async ({ workspace_id, id }) => {
      await client.delete(`${base(workspace_id)}/${id}`)
      return { content: [{ type: 'text', text: 'Amplification post deleted.' }] }
    },
  )
}
