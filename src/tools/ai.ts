import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js'
import { z } from 'zod'
import type { OlliClient } from '../client.js'

const aiBase = (workspaceId: string) => `/workspaces/${workspaceId}/ai`

const PLATFORMS = ['linkedin', 'twitter', 'instagram', 'facebook'] as const
const TONES = ['professional', 'casual', 'inspirational', 'educational', 'promotional'] as const
const LENGTHS = ['short', 'medium', 'long'] as const

export function registerAiTools(server: McpServer, client: OlliClient) {
  server.tool(
    'generate_post',
    'Generate a social media post using AI',
    {
      workspace_id: z.string().describe('Workspace slug or UUID'),
      platform: z.enum(PLATFORMS).describe('Target social platform'),
      topic: z.string().describe('What the post should be about'),
      tone: z.enum(TONES).default('professional'),
      length: z.enum(LENGTHS).default('medium'),
    },
    async ({ workspace_id, ...params }) => {
      const data = await client.post(`${aiBase(workspace_id)}/generate`, params)
      return { content: [{ type: 'text', text: JSON.stringify(data, null, 2) }] }
    },
  )

  server.tool(
    'improve_content',
    'Improve existing post content using AI',
    {
      workspace_id: z.string().describe('Workspace slug or UUID'),
      content: z.string().describe('Existing content to improve'),
      instruction: z.string().describe('How to improve it, e.g. "make it more concise"'),
      platform: z.enum(PLATFORMS).optional(),
    },
    async ({ workspace_id, ...params }) => {
      const data = await client.post(`${aiBase(workspace_id)}/improve`, params)
      return { content: [{ type: 'text', text: JSON.stringify(data, null, 2) }] }
    },
  )

  server.tool(
    'create_variations',
    'Generate multiple variations of a post',
    {
      workspace_id: z.string().describe('Workspace slug or UUID'),
      content: z.string().describe('Source content to create variations from'),
      count: z.number().int().min(1).max(5).default(3),
      platform: z.enum(PLATFORMS).optional(),
    },
    async ({ workspace_id, ...params }) => {
      const data = await client.post(`${aiBase(workspace_id)}/variations`, params)
      return { content: [{ type: 'text', text: JSON.stringify(data, null, 2) }] }
    },
  )

  server.tool(
    'suggest_hashtags',
    'Suggest relevant hashtags for a post',
    {
      workspace_id: z.string().describe('Workspace slug or UUID'),
      content: z.string().describe('Post content to generate hashtags for'),
      platform: z.enum(PLATFORMS).optional(),
    },
    async ({ workspace_id, ...params }) => {
      const data = await client.post(`${aiBase(workspace_id)}/hashtags`, params)
      return { content: [{ type: 'text', text: JSON.stringify(data, null, 2) }] }
    },
  )
}
