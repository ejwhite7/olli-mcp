import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js'
import { z } from 'zod'
import type { OlliClient } from '../client.js'

const base = (workspaceId: string) => `/workspaces/${workspaceId}/support_tickets`

export function registerSupportTools(server: McpServer, client: OlliClient) {
  server.tool(
    'list_support_tickets',
    'List support tickets for a workspace. Supports pagination.',
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
    'get_support_ticket',
    'Get details of a support ticket',
    {
      workspace_id: z.string().describe('Workspace slug or UUID'),
      id: z.string().describe('Support ticket UUID'),
    },
    async ({ workspace_id, id }) => {
      const data = await client.get(`${base(workspace_id)}/${id}`)
      return { content: [{ type: 'text', text: JSON.stringify(data, null, 2) }] }
    },
  )

  server.tool(
    'create_support_ticket',
    'Create a support ticket',
    {
      workspace_id: z.string().describe('Workspace slug or UUID'),
      subject: z.string().describe('Ticket subject'),
      description: z.string().describe('Ticket description'),
      priority: z.enum(['low', 'medium', 'high', 'urgent']).optional(),
      category: z.string().optional().describe('Ticket category'),
    },
    async ({ workspace_id, ...params }) => {
      const data = await client.post(base(workspace_id), { support_ticket: params })
      return { content: [{ type: 'text', text: JSON.stringify(data, null, 2) }] }
    },
  )

  server.tool(
    'list_ticket_messages',
    'List messages on a support ticket. Supports pagination.',
    {
      workspace_id: z.string().describe('Workspace slug or UUID'),
      ticket_id: z.string().describe('Support ticket UUID'),
      page: z.number().optional().describe('Page number (default: 1)'),
      per_page: z.number().optional().describe('Results per page (default: 25, max: 100)'),
    },
    async ({ workspace_id, ticket_id, page, per_page }) => {
      const params = new URLSearchParams()
      if (page !== undefined) params.set('page', String(page))
      if (per_page !== undefined) params.set('per_page', String(Math.min(per_page, 100)))
      const qs = params.size ? `?${params}` : ''
      const data = await client.get(`${base(workspace_id)}/${ticket_id}/messages${qs}`)
      return { content: [{ type: 'text', text: JSON.stringify(data, null, 2) }] }
    },
  )

  server.tool(
    'reply_to_ticket',
    'Send a message on a support ticket',
    {
      workspace_id: z.string().describe('Workspace slug or UUID'),
      ticket_id: z.string().describe('Support ticket UUID'),
      body: z.string().describe('Message content'),
    },
    async ({ workspace_id, ticket_id, body }) => {
      const data = await client.post(`${base(workspace_id)}/${ticket_id}/messages`, { message: { body } })
      return { content: [{ type: 'text', text: JSON.stringify(data, null, 2) }] }
    },
  )
}
