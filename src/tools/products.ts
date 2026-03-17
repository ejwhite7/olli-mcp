import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js'
import { z } from 'zod'
import type { OlliClient } from '../client.js'

const base = (workspaceId: string) => `/workspaces/${workspaceId}/products`

export function registerProductTools(server: McpServer, client: OlliClient) {
  server.tool(
    'list_products',
    'List products in a workspace. Supports pagination.',
    {
      workspace_id: z.string().describe('Workspace slug or UUID'),
      page: z.number().optional().describe('Page number (default: 1)'),
      per_page: z.number().optional().describe('Results per page (default: 25, max: 100)'),
    },
    async ({ workspace_id, page, per_page }) => {
      const params = new URLSearchParams()
      if (page !== undefined) params.set('page', String(page))
      if (per_page !== undefined) params.set('per_page', String(Math.min(per_page, 100)))
      const qs = params.size ? `?${params}` : ''
      const data = await client.get(`${base(workspace_id)}${qs}`)
      return { content: [{ type: 'text', text: JSON.stringify(data, null, 2) }] }
    },
  )

  server.tool(
    'create_product',
    'Create a product',
    {
      workspace_id: z.string().describe('Workspace slug or UUID'),
      name: z.string().describe('Product name'),
      description: z.string().optional(),
      metadata: z.record(z.unknown()).optional().describe('Arbitrary key-value metadata'),
    },
    async ({ workspace_id, ...params }) => {
      const data = await client.post(base(workspace_id), { product: params })
      return { content: [{ type: 'text', text: JSON.stringify(data, null, 2) }] }
    },
  )

  server.tool(
    'update_product',
    'Update a product',
    {
      workspace_id: z.string().describe('Workspace slug or UUID'),
      id: z.string().describe('Product UUID'),
      name: z.string().optional(),
      description: z.string().optional(),
      metadata: z.record(z.unknown()).optional(),
    },
    async ({ workspace_id, id, ...params }) => {
      const data = await client.patch(`${base(workspace_id)}/${id}`, { product: params })
      return { content: [{ type: 'text', text: JSON.stringify(data, null, 2) }] }
    },
  )

  server.tool(
    'delete_product',
    'Delete a product',
    {
      workspace_id: z.string().describe('Workspace slug or UUID'),
      id: z.string().describe('Product UUID'),
    },
    async ({ workspace_id, id }) => {
      await client.delete(`${base(workspace_id)}/${id}`)
      return { content: [{ type: 'text', text: 'Product deleted.' }] }
    },
  )
}
