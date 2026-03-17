import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js'
import { z } from 'zod'
import type { OlliClient } from '../client.js'
import { PLATFORMS, TONES, LENGTHS } from '../constants.js'

const prompts = (workspaceId: string) => `/workspaces/${workspaceId}/compose_prompts`
const samples = (workspaceId: string) => `/workspaces/${workspaceId}/writing_samples`

export function registerContentConfigTools(server: McpServer, client: OlliClient) {
  // -- Compose Prompts --

  server.tool(
    'list_compose_prompts',
    'List saved compose prompt templates for content generation',
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
      const data = await client.get(`${prompts(workspace_id)}${qs}`)
      return { content: [{ type: 'text', text: JSON.stringify(data, null, 2) }] }
    },
  )

  server.tool(
    'create_compose_prompt',
    'Create a reusable compose prompt template',
    {
      workspace_id: z.string().describe('Workspace slug or UUID'),
      title: z.string().describe('Prompt template name'),
      prompt_text: z.string().describe('The prompt template text'),
      platform: z.enum(PLATFORMS).optional().describe('Target platform'),
      tone: z.enum(TONES).optional().describe('Writing tone'),
      length: z.enum(LENGTHS).optional().describe('Content length'),
    },
    async ({ workspace_id, ...params }) => {
      const data = await client.post(prompts(workspace_id), { compose_prompt: params })
      return { content: [{ type: 'text', text: JSON.stringify(data, null, 2) }] }
    },
  )

  server.tool(
    'delete_compose_prompt',
    'Delete a compose prompt template',
    {
      workspace_id: z.string().describe('Workspace slug or UUID'),
      id: z.string().describe('Compose prompt UUID'),
    },
    async ({ workspace_id, id }) => {
      await client.delete(`${prompts(workspace_id)}/${id}`)
      return { content: [{ type: 'text', text: 'Compose prompt deleted.' }] }
    },
  )

  // -- Writing Samples --

  server.tool(
    'list_writing_samples',
    'List writing samples that define the workspace brand voice',
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
      const data = await client.get(`${samples(workspace_id)}${qs}`)
      return { content: [{ type: 'text', text: JSON.stringify(data, null, 2) }] }
    },
  )

  server.tool(
    'create_writing_sample',
    'Add a writing sample to train the AI on your brand voice',
    {
      workspace_id: z.string().describe('Workspace slug or UUID'),
      title: z.string().describe('Sample title/label'),
      content: z.string().describe('The writing sample text'),
      platform: z.enum(PLATFORMS).optional().describe('Platform this sample is from'),
    },
    async ({ workspace_id, ...params }) => {
      const data = await client.post(samples(workspace_id), { writing_sample: params })
      return { content: [{ type: 'text', text: JSON.stringify(data, null, 2) }] }
    },
  )

  server.tool(
    'delete_writing_sample',
    'Remove a writing sample',
    {
      workspace_id: z.string().describe('Workspace slug or UUID'),
      id: z.string().describe('Writing sample UUID'),
    },
    async ({ workspace_id, id }) => {
      await client.delete(`${samples(workspace_id)}/${id}`)
      return { content: [{ type: 'text', text: 'Writing sample deleted.' }] }
    },
  )
}
