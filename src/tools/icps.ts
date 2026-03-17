import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js'
import { z } from 'zod'
import type { OlliClient } from '../client.js'

const base = (workspaceId: string) => `/workspaces/${workspaceId}/icps`

export function registerIcpTools(server: McpServer, client: OlliClient) {
  server.tool(
    'list_icps',
    'List Ideal Customer Profiles (ICPs) for a workspace. Supports pagination.',
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
    'create_icp',
    'Create an ICP',
    {
      workspace_id: z.string().describe('Workspace slug or UUID'),
      name: z.string().describe('ICP name'),
      description: z.string().optional(),
      criteria: z.record(z.unknown()).optional().describe('Key-value criteria object'),
    },
    async ({ workspace_id, ...params }) => {
      const data = await client.post(base(workspace_id), { icp: params })
      return { content: [{ type: 'text', text: JSON.stringify(data, null, 2) }] }
    },
  )

  server.tool(
    'update_icp',
    'Update an ICP',
    {
      workspace_id: z.string().describe('Workspace slug or UUID'),
      id: z.string().describe('ICP UUID'),
      name: z.string().optional(),
      description: z.string().optional(),
      criteria: z.record(z.unknown()).optional(),
    },
    async ({ workspace_id, id, ...params }) => {
      const data = await client.patch(`${base(workspace_id)}/${id}`, { icp: params })
      return { content: [{ type: 'text', text: JSON.stringify(data, null, 2) }] }
    },
  )

  server.tool(
    'delete_icp',
    'Delete an ICP',
    {
      workspace_id: z.string().describe('Workspace slug or UUID'),
      id: z.string().describe('ICP UUID'),
    },
    async ({ workspace_id, id }) => {
      await client.delete(`${base(workspace_id)}/${id}`)
      return { content: [{ type: 'text', text: 'ICP deleted.' }] }
    },
  )
}
