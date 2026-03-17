import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js'
import { z } from 'zod'
import type { OlliClient } from '../client.js'

export function registerIntegrationTools(server: McpServer, client: OlliClient) {
  server.tool(
    'list_integrations',
    'List all connected integrations for a workspace',
    {
      workspace_id: z.string().describe('Workspace slug or UUID'),
    },
    async ({ workspace_id }) => {
      const data = await client.get(`/workspaces/${workspace_id}/integrations`)
      return { content: [{ type: 'text', text: JSON.stringify(data, null, 2) }] }
    },
  )

  server.tool(
    'get_linkedin_organizations',
    'List LinkedIn organizations available for a workspace integration',
    {
      workspace_id: z.string().describe('Workspace slug or UUID'),
    },
    async ({ workspace_id }) => {
      const data = await client.get(`/workspaces/${workspace_id}/integrations/linkedin/organizations`)
      return { content: [{ type: 'text', text: JSON.stringify(data, null, 2) }] }
    },
  )

  server.tool(
    'select_linkedin_organization',
    'Select which LinkedIn company page to post on behalf of',
    {
      workspace_id: z.string().describe('Workspace slug or UUID'),
      organization_id: z.string().describe('LinkedIn organization URN'),
      organization_name: z.string().describe('Organization display name'),
      organization_logo_url: z.string().optional().describe('Organization logo URL'),
    },
    async ({ workspace_id, ...params }) => {
      const data = await client.patch(
        `/workspaces/${workspace_id}/integrations/linkedin/select_organization`,
        params,
      )
      return { content: [{ type: 'text', text: JSON.stringify(data, null, 2) }] }
    },
  )

  server.tool(
    'sync_linkedin',
    'Trigger a LinkedIn data sync for a workspace',
    {
      workspace_id: z.string().describe('Workspace slug or UUID'),
    },
    async ({ workspace_id }) => {
      const data = await client.post(`/workspaces/${workspace_id}/integrations/linkedin/sync`, {})
      return { content: [{ type: 'text', text: JSON.stringify(data, null, 2) }] }
    },
  )

  server.tool(
    'get_linkedin_analytics',
    'Get LinkedIn integration analytics',
    {
      workspace_id: z.string().describe('Workspace slug or UUID'),
    },
    async ({ workspace_id }) => {
      const data = await client.get(`/workspaces/${workspace_id}/integrations/linkedin/analytics`)
      return { content: [{ type: 'text', text: JSON.stringify(data, null, 2) }] }
    },
  )

  server.tool(
    'disconnect_integration',
    'Disconnect a social platform integration',
    {
      workspace_id: z.string().describe('Workspace slug or UUID'),
      platform: z.enum(['linkedin', 'slack', 'twitter']).describe('Platform to disconnect'),
    },
    async ({ workspace_id, platform }) => {
      await client.delete(`/workspaces/${workspace_id}/integrations/${platform}/disconnect`)
      return { content: [{ type: 'text', text: `${platform} disconnected.` }] }
    },
  )

  // -- Twitter/X Integration --

  server.tool(
    'sync_twitter',
    'Trigger a Twitter/X data sync for a workspace',
    {
      workspace_id: z.string().describe('Workspace slug or UUID'),
    },
    async ({ workspace_id }) => {
      const data = await client.post(
        `/workspaces/${workspace_id}/integrations/twitter/sync`,
        {},
      )
      return { content: [{ type: 'text', text: JSON.stringify(data, null, 2) }] }
    },
  )

  server.tool(
    'get_twitter_analytics',
    'Get Twitter/X integration analytics',
    {
      workspace_id: z.string().describe('Workspace slug or UUID'),
    },
    async ({ workspace_id }) => {
      const data = await client.get(
        `/workspaces/${workspace_id}/integrations/twitter/analytics`,
      )
      return { content: [{ type: 'text', text: JSON.stringify(data, null, 2) }] }
    },
  )

  // -- LinkedIn Messaging --

  server.tool(
    'list_linkedin_conversations',
    'List LinkedIn messaging conversations for a workspace',
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
      const data = await client.get(
        `/workspaces/${workspace_id}/integrations/linkedin/messaging${qs}`,
      )
      return { content: [{ type: 'text', text: JSON.stringify(data, null, 2) }] }
    },
  )

  server.tool(
    'reply_to_linkedin_conversation',
    'Send a reply in a LinkedIn messaging conversation',
    {
      workspace_id: z.string().describe('Workspace slug or UUID'),
      conversation_id: z.string().describe('LinkedIn conversation ID'),
      message: z.string().describe('Reply message text'),
    },
    async ({ workspace_id, conversation_id, message }) => {
      const data = await client.post(
        `/workspaces/${workspace_id}/integrations/linkedin/messaging/${conversation_id}/reply`,
        { message },
      )
      return { content: [{ type: 'text', text: JSON.stringify(data, null, 2) }] }
    },
  )

  // -- Chrome Extension Token Management --

  server.tool(
    'generate_extension_token',
    'Generate a new Chrome extension connection token for a workspace',
    {
      workspace_id: z.string().describe('Workspace slug or UUID'),
    },
    async ({ workspace_id }) => {
      const data = await client.post(
        `/workspaces/${workspace_id}/extension_token`,
        {},
      )
      return { content: [{ type: 'text', text: JSON.stringify(data, null, 2) }] }
    },
  )

  server.tool(
    'get_extension_token',
    'Show the current Chrome extension token for a workspace',
    {
      workspace_id: z.string().describe('Workspace slug or UUID'),
    },
    async ({ workspace_id }) => {
      const data = await client.get(
        `/workspaces/${workspace_id}/extension_token`,
      )
      return { content: [{ type: 'text', text: JSON.stringify(data, null, 2) }] }
    },
  )

  server.tool(
    'revoke_extension_token',
    'Revoke the Chrome extension token for a workspace',
    {
      workspace_id: z.string().describe('Workspace slug or UUID'),
    },
    async ({ workspace_id }) => {
      await client.delete(`/workspaces/${workspace_id}/extension_token`)
      return { content: [{ type: 'text', text: 'Extension token revoked.' }] }
    },
  )
}
