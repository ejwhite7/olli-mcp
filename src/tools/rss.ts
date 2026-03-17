import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js'
import { z } from 'zod'
import type { OlliClient } from '../client.js'

const feeds = (workspaceId: string) => `/workspaces/${workspaceId}/rss_feeds`
const items = (workspaceId: string) => `/workspaces/${workspaceId}/rss_feed_items`

export function registerRssTools(server: McpServer, client: OlliClient) {
  server.tool(
    'list_rss_feeds',
    'List RSS feeds configured for content curation',
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
      const data = await client.get(`${feeds(workspace_id)}${qs}`)
      return { content: [{ type: 'text', text: JSON.stringify(data, null, 2) }] }
    },
  )

  server.tool(
    'get_rss_feed',
    'Get details of a specific RSS feed including sync status',
    {
      workspace_id: z.string().describe('Workspace slug or UUID'),
      id: z.string().describe('RSS feed UUID'),
    },
    async ({ workspace_id, id }) => {
      const data = await client.get(`${feeds(workspace_id)}/${id}`)
      return { content: [{ type: 'text', text: JSON.stringify(data, null, 2) }] }
    },
  )

  server.tool(
    'create_rss_feed',
    'Add a new RSS feed for content curation',
    {
      workspace_id: z.string().describe('Workspace slug or UUID'),
      url: z.string().url().describe('RSS feed URL'),
      name: z.string().optional().describe('Friendly name for the feed'),
      category: z.string().optional().describe('Feed category (e.g., "Industry News", "Thought Leadership")'),
    },
    async ({ workspace_id, ...params }) => {
      const data = await client.post(feeds(workspace_id), { rss_feed: params })
      return { content: [{ type: 'text', text: JSON.stringify(data, null, 2) }] }
    },
  )

  server.tool(
    'update_rss_feed',
    'Update an RSS feed configuration',
    {
      workspace_id: z.string().describe('Workspace slug or UUID'),
      id: z.string().describe('RSS feed UUID'),
      name: z.string().optional(),
      category: z.string().optional(),
      url: z.string().url().optional(),
    },
    async ({ workspace_id, id, ...params }) => {
      const data = await client.patch(`${feeds(workspace_id)}/${id}`, { rss_feed: params })
      return { content: [{ type: 'text', text: JSON.stringify(data, null, 2) }] }
    },
  )

  server.tool(
    'delete_rss_feed',
    'Remove an RSS feed from the workspace',
    {
      workspace_id: z.string().describe('Workspace slug or UUID'),
      id: z.string().describe('RSS feed UUID'),
    },
    async ({ workspace_id, id }) => {
      await client.delete(`${feeds(workspace_id)}/${id}`)
      return { content: [{ type: 'text', text: 'RSS feed deleted.' }] }
    },
  )

  server.tool(
    'sync_rss_feed',
    'Manually trigger a sync for an RSS feed to fetch latest items',
    {
      workspace_id: z.string().describe('Workspace slug or UUID'),
      id: z.string().describe('RSS feed UUID'),
    },
    async ({ workspace_id, id }) => {
      const data = await client.post(`${feeds(workspace_id)}/${id}/sync`, {})
      return { content: [{ type: 'text', text: JSON.stringify(data, null, 2) }] }
    },
  )

  server.tool(
    'list_rss_feed_items',
    'List items/articles from RSS feeds. Filter by feed or browse all.',
    {
      workspace_id: z.string().describe('Workspace slug or UUID'),
      feed_id: z.string().optional().describe('Filter to items from a specific RSS feed UUID'),
      page: z.number().optional().describe('Page number (default: 1)'),
      per_page: z.number().optional().describe('Results per page (default: 25, max: 100)'),
    },
    async ({ workspace_id, feed_id, page, per_page }) => {
      const params = new URLSearchParams()
      if (feed_id) params.set('feed_id', feed_id)
      if (page !== undefined) params.set('page', String(page))
      if (per_page !== undefined) params.set('per_page', String(Math.min(per_page, 100)))
      const qs = params.size ? `?${params}` : ''
      const data = await client.get(`${items(workspace_id)}${qs}`)
      return { content: [{ type: 'text', text: JSON.stringify(data, null, 2) }] }
    },
  )
}
