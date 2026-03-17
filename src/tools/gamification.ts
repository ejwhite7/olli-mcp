import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js'
import { z } from 'zod'
import type { OlliClient } from '../client.js'

const rewards = (workspaceId: string) => `/workspaces/${workspaceId}/incentive_rewards`
const redemptions = (workspaceId: string) => `/workspaces/${workspaceId}/point_redemptions`

export function registerGamificationTools(server: McpServer, client: OlliClient) {
  // -- Incentive Rewards --

  server.tool(
    'list_incentive_rewards',
    'List incentive rewards available for point redemption',
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
      const data = await client.get(`${rewards(workspace_id)}${qs}`)
      return { content: [{ type: 'text', text: JSON.stringify(data, null, 2) }] }
    },
  )

  server.tool(
    'get_incentive_reward',
    'Get details of a specific incentive reward',
    {
      workspace_id: z.string().describe('Workspace slug or UUID'),
      id: z.string().describe('Incentive reward UUID'),
    },
    async ({ workspace_id, id }) => {
      const data = await client.get(`${rewards(workspace_id)}/${id}`)
      return { content: [{ type: 'text', text: JSON.stringify(data, null, 2) }] }
    },
  )

  server.tool(
    'create_incentive_reward',
    'Create a new incentive reward that team members can redeem with points',
    {
      workspace_id: z.string().describe('Workspace slug or UUID'),
      name: z.string().describe('Reward name (e.g., "Amazon Gift Card", "Extra PTO Day")'),
      description: z.string().optional().describe('Reward description'),
      points_cost: z.number().describe('Points required to redeem this reward'),
      quantity: z.number().optional().describe('Available quantity (omit for unlimited)'),
    },
    async ({ workspace_id, ...params }) => {
      const data = await client.post(rewards(workspace_id), { incentive_reward: params })
      return { content: [{ type: 'text', text: JSON.stringify(data, null, 2) }] }
    },
  )

  server.tool(
    'update_incentive_reward',
    'Update an incentive reward',
    {
      workspace_id: z.string().describe('Workspace slug or UUID'),
      id: z.string().describe('Incentive reward UUID'),
      name: z.string().optional(),
      description: z.string().optional(),
      points_cost: z.number().optional(),
      quantity: z.number().optional(),
    },
    async ({ workspace_id, id, ...params }) => {
      const data = await client.patch(`${rewards(workspace_id)}/${id}`, { incentive_reward: params })
      return { content: [{ type: 'text', text: JSON.stringify(data, null, 2) }] }
    },
  )

  server.tool(
    'delete_incentive_reward',
    'Delete an incentive reward',
    {
      workspace_id: z.string().describe('Workspace slug or UUID'),
      id: z.string().describe('Incentive reward UUID'),
    },
    async ({ workspace_id, id }) => {
      await client.delete(`${rewards(workspace_id)}/${id}`)
      return { content: [{ type: 'text', text: 'Incentive reward deleted.' }] }
    },
  )

  // -- Point Redemptions --

  server.tool(
    'list_point_redemptions',
    'List point redemption requests (pending, approved, rejected, fulfilled)',
    {
      workspace_id: z.string().describe('Workspace slug or UUID'),
      status: z.enum(['pending', 'approved', 'rejected', 'fulfilled']).optional().describe('Filter by status'),
      page: z.number().optional().describe('Page number (default: 1)'),
      per_page: z.number().optional().describe('Results per page (default: 25, max: 100)'),
    },
    async ({ workspace_id, status, page, per_page }) => {
      const params = new URLSearchParams()
      if (status) params.set('status', status)
      if (page !== undefined) params.set('page', String(page))
      if (per_page !== undefined) params.set('per_page', String(Math.min(per_page, 100)))
      const qs = params.size ? `?${params}` : ''
      const data = await client.get(`${redemptions(workspace_id)}${qs}`)
      return { content: [{ type: 'text', text: JSON.stringify(data, null, 2) }] }
    },
  )

  server.tool(
    'request_point_redemption',
    'Request to redeem points for an incentive reward',
    {
      workspace_id: z.string().describe('Workspace slug or UUID'),
      incentive_reward_id: z.string().describe('UUID of the reward to redeem'),
    },
    async ({ workspace_id, incentive_reward_id }) => {
      const data = await client.post(redemptions(workspace_id), {
        point_redemption: { incentive_reward_id },
      })
      return { content: [{ type: 'text', text: JSON.stringify(data, null, 2) }] }
    },
  )

  server.tool(
    'approve_point_redemption',
    'Approve a pending point redemption request (admin action)',
    {
      workspace_id: z.string().describe('Workspace slug or UUID'),
      id: z.string().describe('Point redemption UUID'),
    },
    async ({ workspace_id, id }) => {
      const data = await client.post(`${redemptions(workspace_id)}/${id}/approve`, {})
      return { content: [{ type: 'text', text: JSON.stringify(data, null, 2) }] }
    },
  )

  server.tool(
    'reject_point_redemption',
    'Reject a pending point redemption request (admin action)',
    {
      workspace_id: z.string().describe('Workspace slug or UUID'),
      id: z.string().describe('Point redemption UUID'),
    },
    async ({ workspace_id, id }) => {
      const data = await client.post(`${redemptions(workspace_id)}/${id}/reject`, {})
      return { content: [{ type: 'text', text: JSON.stringify(data, null, 2) }] }
    },
  )

  server.tool(
    'fulfill_point_redemption',
    'Mark a point redemption as fulfilled (reward delivered)',
    {
      workspace_id: z.string().describe('Workspace slug or UUID'),
      id: z.string().describe('Point redemption UUID'),
    },
    async ({ workspace_id, id }) => {
      const data = await client.post(`${redemptions(workspace_id)}/${id}/fulfill`, {})
      return { content: [{ type: 'text', text: JSON.stringify(data, null, 2) }] }
    },
  )
}
