import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js'
import { z } from 'zod'
import type { OlliClient } from '../client.js'

export function registerSettingsTools(server: McpServer, client: OlliClient) {
  server.tool(
    'get_profile',
    'Get the current user profile (display name, email, timezone, etc.)',
    {},
    async () => {
      const data = await client.get('/profile')
      return { content: [{ type: 'text', text: JSON.stringify(data, null, 2) }] }
    },
  )

  server.tool(
    'update_profile',
    'Update the current user profile settings',
    {
      display_name: z.string().optional().describe('Display name'),
      bio: z.string().optional().describe('Bio/about text'),
      timezone: z.string().optional().describe('IANA timezone (e.g., America/New_York)'),
      avatar_url: z.string().url().optional().describe('Profile image URL'),
    },
    async (params) => {
      const data = await client.patch('/profile', { user: params })
      return { content: [{ type: 'text', text: JSON.stringify(data, null, 2) }] }
    },
  )

  server.tool(
    'list_api_keys',
    'List API keys for the current user',
    {},
    async () => {
      const data = await client.get('/profile/api_keys')
      return { content: [{ type: 'text', text: JSON.stringify(data, null, 2) }] }
    },
  )

  server.tool(
    'create_api_key',
    'Generate a new API key. The full key value is only shown once in the response.',
    {
      name: z.string().describe('Descriptive name for the API key (e.g., "MCP Server", "CI/CD")'),
    },
    async ({ name }) => {
      const data = await client.post('/profile/api_keys', { api_key: { name } })
      return { content: [{ type: 'text', text: JSON.stringify(data, null, 2) }] }
    },
  )

  server.tool(
    'delete_api_key',
    'Revoke and delete an API key',
    {
      id: z.string().describe('API key UUID'),
    },
    async ({ id }) => {
      await client.delete(`/profile/api_keys/${id}`)
      return { content: [{ type: 'text', text: 'API key revoked and deleted.' }] }
    },
  )
}
