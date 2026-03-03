import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js'
import { z } from 'zod'
import type { OlliClient } from '../client.js'
import { PLATFORMS, TONES, LENGTHS } from '../constants.js'

const aiBase = (workspaceId: string) => `/workspaces/${workspaceId}/ai`

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

  server.tool(
    'analyze_content',
    'Analyze post content for quality, tone, and suggestions',
    {
      workspace_id: z.string().describe('Workspace slug or UUID'),
      content: z.string().describe('Content to analyze'),
      platform: z.enum(PLATFORMS).optional(),
    },
    async ({ workspace_id, ...params }) => {
      const data = await client.post(`${aiBase(workspace_id)}/analyze`, params)
      return { content: [{ type: 'text', text: JSON.stringify(data, null, 2) }] }
    },
  )

  server.tool(
    'get_ai_usage',
    'Get AI quota usage for the workspace',
    {
      workspace_id: z.string().describe('Workspace slug or UUID'),
    },
    async ({ workspace_id }) => {
      const data = await client.get(`${aiBase(workspace_id)}/usage`)
      return { content: [{ type: 'text', text: JSON.stringify(data, null, 2) }] }
    },
  )

  server.tool(
    'campaign_generate',
    'Generate campaign content (posts, messaging) using AI',
    {
      workspace_id: z.string().describe('Workspace slug or UUID'),
      campaign_id: z.string().describe('Campaign UUID'),
      platform: z.enum(PLATFORMS).optional(),
      count: z.number().int().min(1).max(10).optional().describe('Number of posts to generate'),
    },
    async ({ workspace_id, ...params }) => {
      const data = await client.post(`${aiBase(workspace_id)}/campaign_generate`, params)
      return { content: [{ type: 'text', text: JSON.stringify(data, null, 2) }] }
    },
  )

  server.tool(
    'avatar_chat',
    'Chat with the AI brand avatar',
    {
      workspace_id: z.string().describe('Workspace slug or UUID'),
      message: z.string().describe('Message to send to the avatar'),
      conversation_id: z.string().optional().describe('Existing conversation UUID to continue'),
    },
    async ({ workspace_id, ...params }) => {
      const data = await client.post(`${aiBase(workspace_id)}/avatar/chat`, params)
      return { content: [{ type: 'text', text: JSON.stringify(data, null, 2) }] }
    },
  )

  server.tool(
    'list_avatar_conversations',
    'List avatar chat conversations',
    {
      workspace_id: z.string().describe('Workspace slug or UUID'),
    },
    async ({ workspace_id }) => {
      const data = await client.get(`${aiBase(workspace_id)}/avatar/conversations`)
      return { content: [{ type: 'text', text: JSON.stringify(data, null, 2) }] }
    },
  )

  server.tool(
    'get_avatar_conversation',
    'Get a single avatar chat conversation with messages',
    {
      workspace_id: z.string().describe('Workspace slug or UUID'),
      id: z.string().describe('Conversation UUID'),
    },
    async ({ workspace_id, id }) => {
      const data = await client.get(`${aiBase(workspace_id)}/avatar/conversations/${id}`)
      return { content: [{ type: 'text', text: JSON.stringify(data, null, 2) }] }
    },
  )
}
