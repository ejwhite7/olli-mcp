import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js'
import { z } from 'zod'
import type { OlliClient } from '../client.js'
import { PLATFORMS } from '../constants.js'

const base = (workspaceId: string) => `/workspaces/${workspaceId}/calendar_events`

export function registerCalendarTools(server: McpServer, client: OlliClient) {
  server.tool(
    'list_calendar_events',
    'List calendar events in a workspace',
    {
      workspace_id: z.string().describe('Workspace slug or UUID'),
      platform: z.enum(PLATFORMS).optional(),
      status: z.string().optional(),
      start_date: z.string().optional().describe('ISO 8601 date filter start'),
      end_date: z.string().optional().describe('ISO 8601 date filter end'),
    },
    async ({ workspace_id, ...filters }) => {
      const params = new URLSearchParams(
        Object.entries(filters).filter(([, v]) => v !== undefined) as [string, string][],
      )
      const qs = params.size ? `?${params}` : ''
      const data = await client.get(`${base(workspace_id)}${qs}`)
      return { content: [{ type: 'text', text: JSON.stringify(data, null, 2) }] }
    },
  )

  server.tool(
    'get_calendar_event',
    'Get a single calendar event',
    {
      workspace_id: z.string().describe('Workspace slug or UUID'),
      id: z.string().describe('Calendar event UUID'),
    },
    async ({ workspace_id, id }) => {
      const data = await client.get(`${base(workspace_id)}/${id}`)
      return { content: [{ type: 'text', text: JSON.stringify(data, null, 2) }] }
    },
  )

  server.tool(
    'create_calendar_event',
    'Create a calendar event',
    {
      workspace_id: z.string().describe('Workspace slug or UUID'),
      title: z.string().describe('Event title'),
      content: z.string().optional().describe('Post content'),
      platform: z.enum(PLATFORMS).optional(),
      scheduled_for: z.string().describe('ISO 8601 datetime'),
      campaign_id: z.string().optional(),
      status: z.string().optional(),
      notes: z.string().optional(),
    },
    async ({ workspace_id, ...params }) => {
      const data = await client.post(base(workspace_id), { calendar_event: params })
      return { content: [{ type: 'text', text: JSON.stringify(data, null, 2) }] }
    },
  )

  server.tool(
    'update_calendar_event',
    'Update a calendar event',
    {
      workspace_id: z.string().describe('Workspace slug or UUID'),
      id: z.string().describe('Calendar event UUID'),
      title: z.string().optional(),
      content: z.string().optional(),
      platform: z.enum(PLATFORMS).optional(),
      scheduled_for: z.string().optional().describe('ISO 8601 datetime'),
      campaign_id: z.string().optional(),
      status: z.string().optional(),
      notes: z.string().optional(),
    },
    async ({ workspace_id, id, ...params }) => {
      const data = await client.patch(`${base(workspace_id)}/${id}`, { calendar_event: params })
      return { content: [{ type: 'text', text: JSON.stringify(data, null, 2) }] }
    },
  )

  server.tool(
    'delete_calendar_event',
    'Delete a calendar event',
    {
      workspace_id: z.string().describe('Workspace slug or UUID'),
      id: z.string().describe('Calendar event UUID'),
    },
    async ({ workspace_id, id }) => {
      await client.delete(`${base(workspace_id)}/${id}`)
      return { content: [{ type: 'text', text: 'Calendar event deleted.' }] }
    },
  )
}
