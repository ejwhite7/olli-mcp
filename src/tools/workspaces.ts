import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js'
import { z } from 'zod'
import type { OlliClient } from '../client.js'

export function registerWorkspaceTools(server: McpServer, client: OlliClient) {
  server.tool(
    'list_workspaces',
    'List all workspaces the authenticated user belongs to. Supports pagination.',
    {
      page: z.number().optional().describe('Page number (default: 1)'),
      per_page: z.number().optional().describe('Results per page (default: 25, max: 100)'),
    },
    async ({ page, per_page }) => {
      const params = new URLSearchParams()
      if (page !== undefined) params.set('page', String(page))
      if (per_page !== undefined) params.set('per_page', String(Math.min(per_page, 100)))
      const qs = params.size ? `?${params}` : ''
      const data = await client.get(`/workspaces${qs}`)
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
    'List members of a workspace. Supports pagination.',
    {
      workspace_id: z.string().describe('Workspace slug or UUID'),
      status: z.enum(['active', 'inactive', 'pending']).optional(),
      role: z.enum(['admin', 'member', 'influencer', 'vip']).optional(),
      page: z.number().optional().describe('Page number (default: 1)'),
      per_page: z.number().optional().describe('Results per page (default: 25, max: 100)'),
    },
    async ({ workspace_id, page, per_page, ...filters }) => {
      const params = new URLSearchParams()
      if (filters.status) params.set('status', filters.status)
      if (filters.role) params.set('role', filters.role)
      if (page !== undefined) params.set('page', String(page))
      if (per_page !== undefined) params.set('per_page', String(Math.min(per_page, 100)))
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
    'List pending invitations for a workspace. Supports pagination.',
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
      const data = await client.get(`/workspaces/${workspace_id}/invitations${qs}`)
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

  // -- Domain Verification --

  server.tool(
    'create_domain_verification',
    'Start domain verification for a workspace (generates DNS/meta tag verification record)',
    {
      workspace_id: z.string().describe('Workspace slug or UUID'),
      domain: z.string().describe('Domain to verify (e.g., example.com)'),
    },
    async ({ workspace_id, domain }) => {
      const data = await client.post(
        `/workspaces/${workspace_id}/domain_verification`,
        { domain },
      )
      return { content: [{ type: 'text', text: JSON.stringify(data, null, 2) }] }
    },
  )

  server.tool(
    'get_domain_verification',
    'Check domain verification status',
    {
      workspace_id: z.string().describe('Workspace slug or UUID'),
    },
    async ({ workspace_id }) => {
      const data = await client.get(
        `/workspaces/${workspace_id}/domain_verification`,
      )
      return { content: [{ type: 'text', text: JSON.stringify(data, null, 2) }] }
    },
  )

  server.tool(
    'verify_domain',
    'Trigger domain verification check (after DNS/meta tag has been set up)',
    {
      workspace_id: z.string().describe('Workspace slug or UUID'),
    },
    async ({ workspace_id }) => {
      const data = await client.post(
        `/workspaces/${workspace_id}/domain_verification/verify`,
        {},
      )
      return { content: [{ type: 'text', text: JSON.stringify(data, null, 2) }] }
    },
  )

  // -- Onboarding --

  server.tool(
    'get_onboarding_status',
    'View onboarding progress and completion status for a workspace',
    {
      workspace_id: z.string().describe('Workspace slug or UUID'),
    },
    async ({ workspace_id }) => {
      const data = await client.get(
        `/workspaces/${workspace_id}/onboarding`,
      )
      return { content: [{ type: 'text', text: JSON.stringify(data, null, 2) }] }
    },
  )

  server.tool(
    'get_checklist',
    'Get the onboarding checklist with completion status for each item',
    {
      workspace_id: z.string().describe('Workspace slug or UUID'),
    },
    async ({ workspace_id }) => {
      const data = await client.get(
        `/workspaces/${workspace_id}/checklist`,
      )
      return { content: [{ type: 'text', text: JSON.stringify(data, null, 2) }] }
    },
  )
}
