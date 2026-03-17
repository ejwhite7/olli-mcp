import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js'
import { z } from 'zod'
import type { OlliClient } from '../client.js'

const base = (workspaceId: string) => `/workspaces/${workspaceId}/assets`

export function registerAssetTools(server: McpServer, client: OlliClient) {
  server.tool(
    'list_assets',
    'List assets in the workspace library. Supports pagination.',
    {
      workspace_id: z.string().describe('Workspace slug or UUID'),
      type: z.string().optional().describe('Filter by asset_type'),
      tag: z.string().optional().describe('Filter by tag'),
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
    'get_asset',
    'Get a single asset',
    {
      workspace_id: z.string().describe('Workspace slug or UUID'),
      id: z.string().describe('Asset UUID'),
    },
    async ({ workspace_id, id }) => {
      const data = await client.get(`${base(workspace_id)}/${id}`)
      return { content: [{ type: 'text', text: JSON.stringify(data, null, 2) }] }
    },
  )

  server.tool(
    'create_asset',
    'Add an asset to the workspace library',
    {
      workspace_id: z.string().describe('Workspace slug or UUID'),
      name: z.string().describe('Asset name'),
      asset_type: z.string().describe('e.g. image, video, document'),
      url: z.string().url().describe('Public URL of the asset'),
      thumbnail_url: z.string().url().optional(),
      tags: z.array(z.string()).optional(),
    },
    async ({ workspace_id, ...params }) => {
      const data = await client.post(base(workspace_id), { asset: params })
      return { content: [{ type: 'text', text: JSON.stringify(data, null, 2) }] }
    },
  )

  server.tool(
    'delete_asset',
    'Delete an asset from the library',
    {
      workspace_id: z.string().describe('Workspace slug or UUID'),
      id: z.string().describe('Asset UUID'),
    },
    async ({ workspace_id, id }) => {
      await client.delete(`${base(workspace_id)}/${id}`)
      return { content: [{ type: 'text', text: 'Asset deleted.' }] }
    },
  )
}
