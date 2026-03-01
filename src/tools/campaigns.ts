import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js'
import { z } from 'zod'
import type { OlliClient } from '../client.js'

const base = (workspaceId: string) => `/workspaces/${workspaceId}/campaigns`

export function registerCampaignTools(server: McpServer, client: OlliClient) {
  server.tool(
    'list_campaigns',
    'List all campaigns in a workspace',
    {
      workspace_id: z.string().describe('Workspace slug or UUID'),
      q: z.string().optional().describe('Search query'),
      status: z.enum(['draft', 'active', 'paused', 'completed']).optional(),
      team_id: z.string().optional().describe('Filter by team UUID'),
    },
    async ({ workspace_id, ...filters }) => {
      const params = new URLSearchParams()
      if (filters.q) params.set('q', filters.q)
      if (filters.status) params.set('status', filters.status)
      if (filters.team_id) params.set('team_id', filters.team_id)
      const query = params.toString()
      const data = await client.get(`${base(workspace_id)}${query ? `?${query}` : ''}`)
      return { content: [{ type: 'text', text: JSON.stringify(data, null, 2) }] }
    },
  )

  server.tool(
    'get_campaign',
    'Get a single campaign',
    {
      workspace_id: z.string().describe('Workspace slug or UUID'),
      id: z.string().describe('Campaign UUID'),
    },
    async ({ workspace_id, id }) => {
      const data = await client.get(`${base(workspace_id)}/${id}`)
      return { content: [{ type: 'text', text: JSON.stringify(data, null, 2) }] }
    },
  )

  server.tool(
    'create_campaign',
    'Create a new campaign',
    {
      workspace_id: z.string().describe('Workspace slug or UUID'),
      title: z.string().describe('Campaign title'),
      description: z.string().optional(),
      purpose: z.enum(['awareness', 'conversion', 'engagement', 'nurture']).optional(),
      status: z.enum(['draft', 'active', 'paused', 'completed']).optional(),
      campaign_length_type: z.enum(['evergreen', 'custom', 'end_of_week', 'end_of_month', 'end_of_quarter', 'end_of_year', 'days']).optional(),
      campaign_duration_days: z.number().int().optional(),
      start_date: z.string().optional().describe('ISO 8601 date'),
      end_date: z.string().optional().describe('ISO 8601 date'),
      platforms: z.array(z.string()).optional().describe('Target platforms'),
      tags: z.array(z.string()).optional(),
      team_ids: z.array(z.string()).optional().describe('Team UUIDs to assign'),
      product_ids: z.array(z.string()).optional().describe('Product UUIDs to associate'),
      assigned_user_ids: z.array(z.string()).optional().describe('User UUIDs to assign'),
      icp_ids: z.array(z.string()).optional().describe('ICP UUIDs to associate'),
      industry_ids: z.array(z.string()).optional().describe('Industry UUIDs to associate'),
      messaging_snippets: z.array(z.object({ text: z.string() })).optional().describe('Key messages for this campaign'),
    },
    async ({ workspace_id, ...params }) => {
      const data = await client.post(base(workspace_id), { campaign: params })
      return { content: [{ type: 'text', text: JSON.stringify(data, null, 2) }] }
    },
  )

  server.tool(
    'update_campaign',
    'Update an existing campaign',
    {
      workspace_id: z.string().describe('Workspace slug or UUID'),
      id: z.string().describe('Campaign UUID'),
      title: z.string().optional(),
      description: z.string().optional(),
      purpose: z.enum(['awareness', 'conversion', 'engagement', 'nurture']).optional(),
      status: z.enum(['draft', 'active', 'paused', 'completed']).optional(),
      campaign_length_type: z.enum(['evergreen', 'custom', 'end_of_week', 'end_of_month', 'end_of_quarter', 'end_of_year', 'days']).optional(),
      campaign_duration_days: z.number().int().optional(),
      start_date: z.string().optional().describe('ISO 8601 date'),
      end_date: z.string().optional().describe('ISO 8601 date'),
      platforms: z.array(z.string()).optional().describe('Target platforms'),
      tags: z.array(z.string()).optional(),
      team_ids: z.array(z.string()).optional().describe('Team UUIDs to assign'),
      product_ids: z.array(z.string()).optional().describe('Product UUIDs to associate'),
      assigned_user_ids: z.array(z.string()).optional().describe('User UUIDs to assign'),
      icp_ids: z.array(z.string()).optional().describe('ICP UUIDs to associate'),
      industry_ids: z.array(z.string()).optional().describe('Industry UUIDs to associate'),
      messaging_snippets: z.array(z.object({ text: z.string() })).optional().describe('Key messages for this campaign'),
    },
    async ({ workspace_id, id, ...params }) => {
      const data = await client.patch(`${base(workspace_id)}/${id}`, { campaign: params })
      return { content: [{ type: 'text', text: JSON.stringify(data, null, 2) }] }
    },
  )

  server.tool(
    'delete_campaign',
    'Delete a campaign',
    {
      workspace_id: z.string().describe('Workspace slug or UUID'),
      id: z.string().describe('Campaign UUID'),
    },
    async ({ workspace_id, id }) => {
      await client.delete(`${base(workspace_id)}/${id}`)
      return { content: [{ type: 'text', text: 'Campaign deleted.' }] }
    },
  )
}
