import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js'
import { z } from 'zod'
import type { OlliClient } from '../client.js'

const base = (workspaceId: string) => `/workspaces/${workspaceId}/notifications`

export function registerNotificationTools(server: McpServer, client: OlliClient) {
  server.tool(
    'list_notifications',
    'List notifications for the current user in a workspace. Supports pagination.',
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
    'mark_notification_read',
    'Mark a single notification as read',
    {
      workspace_id: z.string().describe('Workspace slug or UUID'),
      id: z.string().describe('Notification UUID'),
    },
    async ({ workspace_id, id }) => {
      const data = await client.patch(`${base(workspace_id)}/${id}`, { read: true })
      return { content: [{ type: 'text', text: JSON.stringify(data, null, 2) }] }
    },
  )

  server.tool(
    'mark_all_notifications_read',
    'Mark all notifications as read',
    {
      workspace_id: z.string().describe('Workspace slug or UUID'),
    },
    async ({ workspace_id }) => {
      await client.post(`${base(workspace_id)}/mark_all_read`, {})
      return { content: [{ type: 'text', text: 'All notifications marked as read.' }] }
    },
  )

  server.tool(
    'delete_notification',
    'Delete a notification',
    {
      workspace_id: z.string().describe('Workspace slug or UUID'),
      id: z.string().describe('Notification UUID'),
    },
    async ({ workspace_id, id }) => {
      await client.delete(`${base(workspace_id)}/${id}`)
      return { content: [{ type: 'text', text: 'Notification deleted.' }] }
    },
  )
}
