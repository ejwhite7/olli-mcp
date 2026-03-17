import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js'
import { z } from 'zod'
import type { OlliClient } from '../client.js'

const base = (workspaceId: string) => `/workspaces/${workspaceId}/teams`

export function registerTeamTools(server: McpServer, client: OlliClient) {
  server.tool(
    'list_teams',
    'List teams in a workspace. Supports pagination.',
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
    'get_team',
    'Get a single team and its members',
    {
      workspace_id: z.string().describe('Workspace slug or UUID'),
      id: z.string().describe('Team UUID'),
    },
    async ({ workspace_id, id }) => {
      const data = await client.get(`${base(workspace_id)}/${id}`)
      return { content: [{ type: 'text', text: JSON.stringify(data, null, 2) }] }
    },
  )

  server.tool(
    'create_team',
    'Create a new team in a workspace',
    {
      workspace_id: z.string().describe('Workspace slug or UUID'),
      name: z.string().describe('Team name'),
      description: z.string().optional(),
      metadata: z.record(z.string()).optional().describe('Key-value metadata'),
    },
    async ({ workspace_id, ...params }) => {
      const data = await client.post(base(workspace_id), { team: params })
      return { content: [{ type: 'text', text: JSON.stringify(data, null, 2) }] }
    },
  )

  server.tool(
    'update_team',
    'Update an existing team',
    {
      workspace_id: z.string().describe('Workspace slug or UUID'),
      id: z.string().describe('Team UUID'),
      name: z.string().optional(),
      description: z.string().optional(),
      metadata: z.record(z.string()).optional().describe('Key-value metadata'),
    },
    async ({ workspace_id, id, ...params }) => {
      const data = await client.patch(`${base(workspace_id)}/${id}`, { team: params })
      return { content: [{ type: 'text', text: JSON.stringify(data, null, 2) }] }
    },
  )

  server.tool(
    'delete_team',
    'Delete a team',
    {
      workspace_id: z.string().describe('Workspace slug or UUID'),
      id: z.string().describe('Team UUID'),
    },
    async ({ workspace_id, id }) => {
      await client.delete(`${base(workspace_id)}/${id}`)
      return { content: [{ type: 'text', text: 'Team deleted.' }] }
    },
  )

  server.tool(
    'list_team_members',
    'List members of a team. Supports pagination.',
    {
      workspace_id: z.string().describe('Workspace slug or UUID'),
      team_id: z.string().describe('Team UUID'),
      page: z.number().optional().describe('Page number (default: 1)'),
      per_page: z.number().optional().describe('Results per page (default: 25, max: 100)'),
    },
    async ({ workspace_id, team_id, page, per_page }) => {
      const params = new URLSearchParams()
      if (page !== undefined) params.set('page', String(page))
      if (per_page !== undefined) params.set('per_page', String(Math.min(per_page, 100)))
      const qs = params.size ? `?${params}` : ''
      const data = await client.get(`${base(workspace_id)}/${team_id}/memberships${qs}`)
      return { content: [{ type: 'text', text: JSON.stringify(data, null, 2) }] }
    },
  )

  server.tool(
    'add_team_member',
    'Add a user to a team',
    {
      workspace_id: z.string().describe('Workspace slug or UUID'),
      team_id: z.string().describe('Team UUID'),
      user_id: z.string().describe('User UUID to add'),
    },
    async ({ workspace_id, team_id, user_id }) => {
      const data = await client.post(`${base(workspace_id)}/${team_id}/memberships`, { user_id })
      return { content: [{ type: 'text', text: JSON.stringify(data, null, 2) }] }
    },
  )

  server.tool(
    'remove_team_member',
    'Remove a user from a team',
    {
      workspace_id: z.string().describe('Workspace slug or UUID'),
      team_id: z.string().describe('Team UUID'),
      id: z.string().describe('Team membership UUID'),
    },
    async ({ workspace_id, team_id, id }) => {
      await client.delete(`${base(workspace_id)}/${team_id}/memberships/${id}`)
      return { content: [{ type: 'text', text: 'Team member removed.' }] }
    },
  )
}
