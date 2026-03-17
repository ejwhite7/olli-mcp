import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js'
import { z } from 'zod'
import type { OlliClient } from '../client.js'

const base = (workspaceId: string) => `/workspaces/${workspaceId}/pixel_configs`
const sessions = (workspaceId: string) => `/workspaces/${workspaceId}/visitor_sessions`

export function registerPixelTools(server: McpServer, client: OlliClient) {
  // -- Pixel Configuration Tools --

  server.tool(
    'list_pixel_configs',
    'List pixel tracking configurations for website visitor identification',
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
    'create_pixel_config',
    'Create a new pixel tracking configuration for a website domain',
    {
      workspace_id: z.string().describe('Workspace slug or UUID'),
      domain: z.string().describe('Website domain to track (e.g., example.com)'),
      name: z.string().optional().describe('Friendly name for this pixel config'),
    },
    async ({ workspace_id, ...params }) => {
      const data = await client.post(base(workspace_id), { pixel_config: params })
      return { content: [{ type: 'text', text: JSON.stringify(data, null, 2) }] }
    },
  )

  server.tool(
    'delete_pixel_config',
    'Delete a pixel tracking configuration',
    {
      workspace_id: z.string().describe('Workspace slug or UUID'),
      id: z.string().describe('Pixel config UUID'),
    },
    async ({ workspace_id, id }) => {
      await client.delete(`${base(workspace_id)}/${id}`)
      return { content: [{ type: 'text', text: 'Pixel config deleted.' }] }
    },
  )

  server.tool(
    'get_pixel_snippet',
    'Get the JavaScript embed snippet for a pixel config (for website installation)',
    {
      workspace_id: z.string().describe('Workspace slug or UUID'),
      id: z.string().describe('Pixel config UUID'),
    },
    async ({ workspace_id, id }) => {
      const data = await client.get(`${base(workspace_id)}/${id}/snippet`)
      return { content: [{ type: 'text', text: JSON.stringify(data, null, 2) }] }
    },
  )

  // -- Visitor Session Tools --

  server.tool(
    'list_visitor_sessions',
    'List recent visitor sessions captured by the tracking pixel. Returns company identification, page views, and engagement data.',
    {
      workspace_id: z.string().describe('Workspace slug or UUID'),
      since: z.string().optional().describe('ISO date to filter from (default: 7 days ago)'),
      page: z.number().optional().describe('Page number (default: 1)'),
      per_page: z.number().optional().describe('Results per page (default: 25, max: 100)'),
    },
    async ({ workspace_id, since, page, per_page }) => {
      const params = new URLSearchParams()
      if (since) params.set('since', since)
      if (page !== undefined) params.set('page', String(page))
      if (per_page !== undefined) params.set('per_page', String(Math.min(per_page, 100)))
      const qs = params.size ? `?${params}` : ''
      const data = await client.get(`${sessions(workspace_id)}${qs}`)
      return { content: [{ type: 'text', text: JSON.stringify(data, null, 2) }] }
    },
  )

  server.tool(
    'get_visitor_session',
    'Get detailed info about a specific visitor session including page views and identified company',
    {
      workspace_id: z.string().describe('Workspace slug or UUID'),
      id: z.string().describe('Visitor session UUID'),
    },
    async ({ workspace_id, id }) => {
      const data = await client.get(`${sessions(workspace_id)}/${id}`)
      return { content: [{ type: 'text', text: JSON.stringify(data, null, 2) }] }
    },
  )

  server.tool(
    'get_visitor_stats',
    'Get aggregated visitor session statistics for a workspace',
    {
      workspace_id: z.string().describe('Workspace slug or UUID'),
      since: z.string().optional().describe('ISO date to filter from'),
    },
    async ({ workspace_id, since }) => {
      const params = new URLSearchParams()
      if (since) params.set('since', since)
      const qs = params.size ? `?${params}` : ''
      const data = await client.get(`${sessions(workspace_id)}/stats${qs}`)
      return { content: [{ type: 'text', text: JSON.stringify(data, null, 2) }] }
    },
  )
}
