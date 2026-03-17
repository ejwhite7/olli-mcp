import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js'
import { z } from 'zod'
import type { OlliClient } from '../client.js'

const base = (workspaceId: string) => `/workspaces/${workspaceId}/tracked_profiles`

export function registerTrackedProfileTools(server: McpServer, client: OlliClient) {
  server.tool(
    'list_tracked_profiles',
    'List tracked LinkedIn profiles for prospecting and monitoring',
    {
      workspace_id: z.string().describe('Workspace slug or UUID'),
      q: z.string().optional().describe('Search by name or company'),
      page: z.number().optional().describe('Page number (default: 1)'),
      per_page: z.number().optional().describe('Results per page (default: 25, max: 100)'),
    },
    async ({ workspace_id, q, page, per_page }) => {
      const params = new URLSearchParams()
      if (q) params.set('q', q)
      if (page !== undefined) params.set('page', String(page))
      if (per_page !== undefined) params.set('per_page', String(Math.min(per_page, 100)))
      const qs = params.size ? `?${params}` : ''
      const data = await client.get(`${base(workspace_id)}${qs}`)
      return { content: [{ type: 'text', text: JSON.stringify(data, null, 2) }] }
    },
  )

  server.tool(
    'get_tracked_profile',
    'Get details of a tracked LinkedIn profile including activity history',
    {
      workspace_id: z.string().describe('Workspace slug or UUID'),
      id: z.string().describe('Tracked profile UUID'),
    },
    async ({ workspace_id, id }) => {
      const data = await client.get(`${base(workspace_id)}/${id}`)
      return { content: [{ type: 'text', text: JSON.stringify(data, null, 2) }] }
    },
  )

  server.tool(
    'create_tracked_profile',
    'Add a LinkedIn profile to tracking for prospecting and monitoring',
    {
      workspace_id: z.string().describe('Workspace slug or UUID'),
      linkedin_url: z.string().url().describe('LinkedIn profile URL'),
      name: z.string().optional().describe('Person name'),
      company: z.string().optional().describe('Company name'),
      title: z.string().optional().describe('Job title'),
      notes: z.string().optional().describe('Notes about this prospect'),
    },
    async ({ workspace_id, ...params }) => {
      const data = await client.post(base(workspace_id), { tracked_profile: params })
      return { content: [{ type: 'text', text: JSON.stringify(data, null, 2) }] }
    },
  )

  server.tool(
    'delete_tracked_profile',
    'Remove a profile from tracking',
    {
      workspace_id: z.string().describe('Workspace slug or UUID'),
      id: z.string().describe('Tracked profile UUID'),
    },
    async ({ workspace_id, id }) => {
      await client.delete(`${base(workspace_id)}/${id}`)
      return { content: [{ type: 'text', text: 'Tracked profile removed.' }] }
    },
  )
}
