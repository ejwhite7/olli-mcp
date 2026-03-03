import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js'
import { z } from 'zod'
import type { OlliClient } from '../client.js'

const base = (workspaceId: string) => `/workspaces/${workspaceId}/notifications`

export function registerNotificationTools(server: McpServer, client: OlliClient) {
  server.tool(
    'list_notifications',
    'List notifications for the current user in a workspace',
    {
      workspace_id: z.string().describe('Workspace slug or UUID'),
    },
    async ({ workspace_id }) => {
      const data = await client.get(base(workspace_id))
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
