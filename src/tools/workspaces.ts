import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js'
import { z } from 'zod'
import type { OlliClient } from '../client.js'

export function registerWorkspaceTools(server: McpServer, client: OlliClient) {
  server.tool(
    'list_workspaces',
    'List all workspaces the authenticated user belongs to',
    {},
    async () => {
      const data = await client.get('/workspaces')
      return { content: [{ type: 'text', text: JSON.stringify(data, null, 2) }] }
    },
  )

  server.tool(
    'get_workspace',
    'Get details of a workspace including subscription and settings',
    {
      workspace_id: z.string().describe('Workspace slug or UUID'),
    },
    async ({ workspace_id }) => {
      const data = await client.get(`/workspaces/${workspace_id}`)
      return { content: [{ type: 'text', text: JSON.stringify(data, null, 2) }] }
    },
  )

  server.tool(
    'update_workspace',
    'Update workspace settings (name, description, brand voice, etc.)',
    {
      workspace_id: z.string().describe('Workspace slug or UUID'),
      name: z.string().optional(),
      description: z.string().optional(),
      website_url: z.string().optional(),
      brand_voice: z.string().optional(),
      settings: z.record(z.unknown()).optional().describe('Workspace settings object'),
    },
    async ({ workspace_id, ...params }) => {
      const data = await client.patch(`/workspaces/${workspace_id}`, { workspace: params })
      return { content: [{ type: 'text', text: JSON.stringify(data, null, 2) }] }
    },
  )

  server.tool(
    'list_memberships',
    'List members of a workspace',
    {
      workspace_id: z.string().describe('Workspace slug or UUID'),
      status: z.enum(['active', 'inactive', 'pending']).optional(),
      role: z.enum(['admin', 'member', 'influencer', 'vip']).optional(),
    },
    async ({ workspace_id, ...filters }) => {
      const params = new URLSearchParams()
      if (filters.status) params.set('status', filters.status)
      if (filters.role) params.set('role', filters.role)
      const qs = params.size ? `?${params}` : ''
      const data = await client.get(`/workspaces/${workspace_id}/memberships${qs}`)
      return { content: [{ type: 'text', text: JSON.stringify(data, null, 2) }] }
    },
  )

  server.tool(
    'update_membership',
    'Update a workspace membership role or status',
    {
      workspace_id: z.string().describe('Workspace slug or UUID'),
      id: z.string().describe('Membership UUID'),
      role: z.enum(['admin', 'member', 'influencer', 'vip']).optional(),
      status: z.enum(['active', 'inactive']).optional(),
    },
    async ({ workspace_id, id, ...params }) => {
      const data = await client.patch(`/workspaces/${workspace_id}/memberships/${id}`, { membership: params })
      return { content: [{ type: 'text', text: JSON.stringify(data, null, 2) }] }
    },
  )

  server.tool(
    'remove_membership',
    'Remove a member from a workspace',
    {
      workspace_id: z.string().describe('Workspace slug or UUID'),
      id: z.string().describe('Membership UUID'),
    },
    async ({ workspace_id, id }) => {
      await client.delete(`/workspaces/${workspace_id}/memberships/${id}`)
      return { content: [{ type: 'text', text: 'Member removed.' }] }
    },
  )

  server.tool(
    'list_invitations',
    'List pending invitations for a workspace',
    {
      workspace_id: z.string().describe('Workspace slug or UUID'),
    },
    async ({ workspace_id }) => {
      const data = await client.get(`/workspaces/${workspace_id}/invitations`)
      return { content: [{ type: 'text', text: JSON.stringify(data, null, 2) }] }
    },
  )

  server.tool(
    'create_invitation',
    'Invite a user to the workspace by email',
    {
      workspace_id: z.string().describe('Workspace slug or UUID'),
      email: z.string().email().describe('Email address to invite'),
      role: z.enum(['admin', 'member', 'influencer', 'vip']).default('member'),
    },
    async ({ workspace_id, ...params }) => {
      const data = await client.post(`/workspaces/${workspace_id}/invitations`, { invitation: params })
      return { content: [{ type: 'text', text: JSON.stringify(data, null, 2) }] }
    },
  )

  server.tool(
    'delete_invitation',
    'Revoke a pending invitation',
    {
      workspace_id: z.string().describe('Workspace slug or UUID'),
      id: z.string().describe('Invitation UUID'),
    },
    async ({ workspace_id, id }) => {
      await client.delete(`/workspaces/${workspace_id}/invitations/${id}`)
      return { content: [{ type: 'text', text: 'Invitation revoked.' }] }
    },
  )

  server.tool(
    'get_feature_flags',
    'Get enabled feature flags for a workspace',
    {
      workspace_id: z.string().describe('Workspace slug or UUID'),
    },
    async ({ workspace_id }) => {
      const data = await client.get(`/workspaces/${workspace_id}/feature_flags`)
      return { content: [{ type: 'text', text: JSON.stringify(data, null, 2) }] }
    },
  )

  server.tool(
    'get_plan_features',
    'Get features available on the workspace current plan',
    {
      workspace_id: z.string().describe('Workspace slug or UUID'),
    },
    async ({ workspace_id }) => {
      const data = await client.get(`/workspaces/${workspace_id}/plan_features`)
      return { content: [{ type: 'text', text: JSON.stringify(data, null, 2) }] }
    },
  )
}
