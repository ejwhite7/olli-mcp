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
    },
    async ({ workspace_id }) => {
      const data = await client.get(base(workspace_id))
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
      name: z.string().describe('Campaign name'),
      description: z.string().optional(),
      start_date: z.string().optional().describe('ISO 8601 date'),
      end_date: z.string().optional().describe('ISO 8601 date'),
      status: z.enum(['draft', 'active', 'paused', 'completed']).optional(),
      campaign_type: z.string().optional(),
      target_audience: z.string().optional(),
      budget: z.number().optional(),
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
      name: z.string().optional(),
      description: z.string().optional(),
      start_date: z.string().optional().describe('ISO 8601 date'),
      end_date: z.string().optional().describe('ISO 8601 date'),
      status: z.enum(['draft', 'active', 'paused', 'completed']).optional(),
      campaign_type: z.string().optional(),
      target_audience: z.string().optional(),
      budget: z.number().optional(),
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
