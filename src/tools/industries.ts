import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js'
import { z } from 'zod'
import type { OlliClient } from '../client.js'

const base = (workspaceId: string) => `/workspaces/${workspaceId}/industries`

export function registerIndustryTools(server: McpServer, client: OlliClient) {
  server.tool(
    'list_industries',
    'List target industries for a workspace. Supports pagination.',
    {
      workspace_id: z.string().describe('Workspace slug or UUID'),
      q: z.string().optional().describe('Search query'),
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
    'create_industry',
    'Create a target industry',
    {
      workspace_id: z.string().describe('Workspace slug or UUID'),
      name: z.string().describe('Industry name'),
      description: z.string().optional(),
      criteria: z.record(z.unknown()).optional(),
    },
    async ({ workspace_id, ...params }) => {
      const data = await client.post(base(workspace_id), { industry: params })
      return { content: [{ type: 'text', text: JSON.stringify(data, null, 2) }] }
    },
  )

  server.tool(
    'update_industry',
    'Update a target industry',
    {
      workspace_id: z.string().describe('Workspace slug or UUID'),
      id: z.string().describe('Industry UUID'),
      name: z.string().optional(),
      description: z.string().optional(),
      criteria: z.record(z.unknown()).optional(),
    },
    async ({ workspace_id, id, ...params }) => {
      const data = await client.patch(`${base(workspace_id)}/${id}`, { industry: params })
      return { content: [{ type: 'text', text: JSON.stringify(data, null, 2) }] }
    },
  )

  server.tool(
    'delete_industry',
    'Delete a target industry',
    {
      workspace_id: z.string().describe('Workspace slug or UUID'),
      id: z.string().describe('Industry UUID'),
    },
    async ({ workspace_id, id }) => {
      await client.delete(`${base(workspace_id)}/${id}`)
      return { content: [{ type: 'text', text: 'Industry deleted.' }] }
    },
  )
}
