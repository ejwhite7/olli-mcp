import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js'
import { z } from 'zod'
import type { OlliClient } from '../client.js'
import { PLATFORMS } from '../constants.js'

const base = (workspaceId: string) => `/workspaces/${workspaceId}/drafts`

export function registerDraftTools(server: McpServer, client: OlliClient) {
  server.tool(
    'list_drafts',
    'List drafts in a workspace',
    {
      workspace_id: z.string().describe('Workspace slug or UUID'),
      platform: z.enum(PLATFORMS).optional(),
      q: z.string().optional().describe('Search query'),
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
    'get_draft',
    'Get a single draft',
    {
      workspace_id: z.string().describe('Workspace slug or UUID'),
      id: z.string().describe('Draft UUID'),
    },
    async ({ workspace_id, id }) => {
      const data = await client.get(`${base(workspace_id)}/${id}`)
      return { content: [{ type: 'text', text: JSON.stringify(data, null, 2) }] }
    },
  )

  server.tool(
    'create_draft',
    'Create a new draft',
    {
      workspace_id: z.string().describe('Workspace slug or UUID'),
      title: z.string().optional(),
      content: z.string().describe('Post content'),
      platform: z.enum(PLATFORMS).optional(),
      campaign_id: z.string().optional().describe('Campaign UUID'),
      status: z.enum(['draft', 'ready', 'scheduled', 'published']).optional(),
      notes: z.string().optional(),
      media_url: z.string().url().optional(),
    },
    async ({ workspace_id, ...params }) => {
      const data = await client.post(base(workspace_id), { draft: params })
      return { content: [{ type: 'text', text: JSON.stringify(data, null, 2) }] }
    },
  )

  server.tool(
    'update_draft',
    'Update a draft',
    {
      workspace_id: z.string().describe('Workspace slug or UUID'),
      id: z.string().describe('Draft UUID'),
      title: z.string().optional(),
      content: z.string().optional(),
      platform: z.enum(PLATFORMS).optional(),
      campaign_id: z.string().optional(),
      status: z.enum(['draft', 'ready', 'scheduled', 'published']).optional(),
      notes: z.string().optional(),
      media_url: z.string().url().optional(),
    },
    async ({ workspace_id, id, ...params }) => {
      const data = await client.patch(`${base(workspace_id)}/${id}`, { draft: params })
      return { content: [{ type: 'text', text: JSON.stringify(data, null, 2) }] }
    },
  )

  server.tool(
    'delete_draft',
    'Delete a draft',
    {
      workspace_id: z.string().describe('Workspace slug or UUID'),
      id: z.string().describe('Draft UUID'),
    },
    async ({ workspace_id, id }) => {
      await client.delete(`${base(workspace_id)}/${id}`)
      return { content: [{ type: 'text', text: 'Draft deleted.' }] }
    },
  )

  server.tool(
    'publish_draft',
    'Publish a draft immediately to a connected social account',
    {
      workspace_id: z.string().describe('Workspace slug or UUID'),
      id: z.string().describe('Draft UUID'),
      integration_id: z.string().describe('LinkedIn integration UUID'),
      author_type: z.enum(['member', 'organization']).default('member'),
    },
    async ({ workspace_id, id, integration_id, author_type }) => {
      const data = await client.post(
        `${base(workspace_id)}/${id}/publish_now`,
        { integration_id, author_type },
      )
      return { content: [{ type: 'text', text: JSON.stringify(data, null, 2) }] }
    },
  )

  server.tool(
    'schedule_draft',
    'Schedule a draft for future publishing',
    {
      workspace_id: z.string().describe('Workspace slug or UUID'),
      id: z.string().describe('Draft UUID'),
      integration_id: z.string().describe('LinkedIn integration UUID'),
      scheduled_for: z.string().describe('ISO 8601 datetime to publish at'),
      author_type: z.enum(['member', 'organization']).default('member'),
    },
    async ({ workspace_id, id, integration_id, scheduled_for, author_type }) => {
      const data = await client.post(
        `${base(workspace_id)}/${id}/schedule`,
        { integration_id, scheduled_for, author_type },
      )
      return { content: [{ type: 'text', text: JSON.stringify(data, null, 2) }] }
    },
  )
}
