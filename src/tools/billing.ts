import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js'
import { z } from 'zod'
import type { OlliClient } from '../client.js'

const base = (workspaceId: string) => `/workspaces/${workspaceId}/billing`

export function registerBillingTools(server: McpServer, client: OlliClient) {
  server.tool(
    'get_billing',
    'Get billing info and current subscription for a workspace',
    {
      workspace_id: z.string().describe('Workspace slug or UUID'),
    },
    async ({ workspace_id }) => {
      const data = await client.get(base(workspace_id))
      return { content: [{ type: 'text', text: JSON.stringify(data, null, 2) }] }
    },
  )

  server.tool(
    'list_invoices',
    'List billing invoices for a workspace. Supports pagination.',
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
      const data = await client.get(`${base(workspace_id)}/invoices${qs}`)
      return { content: [{ type: 'text', text: JSON.stringify(data, null, 2) }] }
    },
  )

  // -- Usage Tracking --

  server.tool(
    'check_feature_usage',
    'Check remaining usage allowance for a feature (e.g., AI generations, posts)',
    {
      workspace_id: z.string().describe('Workspace slug or UUID'),
      feature: z.string().describe('Feature name to check (e.g., "ai_generation", "post_publish")'),
    },
    async ({ workspace_id, feature }) => {
      const data = await client.get(
        `/workspaces/${workspace_id}/usage/check?feature=${encodeURIComponent(feature)}`,
      )
      return { content: [{ type: 'text', text: JSON.stringify(data, null, 2) }] }
    },
  )

  server.tool(
    'track_feature_usage',
    'Record usage of a feature for quota tracking',
    {
      workspace_id: z.string().describe('Workspace slug or UUID'),
      feature: z.string().describe('Feature name'),
      quantity: z.number().optional().describe('Usage quantity (default: 1)'),
    },
    async ({ workspace_id, feature, quantity }) => {
      const data = await client.post(
        `/workspaces/${workspace_id}/usage/track`,
        { feature, quantity: quantity ?? 1 },
      )
      return { content: [{ type: 'text', text: JSON.stringify(data, null, 2) }] }
    },
  )
}
