# Olli MCP Server Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Build a TypeScript MCP server (`@olli/mcp-server`) that wraps the olli.social REST API, enabling LLMs to manage a user's social presence via an API key.

**Architecture:** Standalone npm package with stdio transport. An `OlliClient` class wraps all HTTP calls. Twelve tool files register named MCP tools against the server instance in `index.ts`.

**Tech Stack:** TypeScript 5, `@modelcontextprotocol/sdk`, `zod`, Node.js 20+, `tsx` for dev, `tsup` for build.

---

### Task 1: Project Scaffold

**Files:**
- Create: `package.json`
- Create: `tsconfig.json`
- Create: `.env.example`
- Create: `.gitignore`
- Create: `src/index.ts` (stub)
- Create: `src/client.ts` (stub)

**Step 1: Initialize git repo and create package.json**

```bash
cd ~/Documents/coding/olli-mcp
git init   # (if not already done)
```

Create `package.json`:

```json
{
  "name": "@olli/mcp-server",
  "version": "0.1.0",
  "description": "MCP server for olli.social",
  "type": "module",
  "bin": {
    "olli-mcp": "./dist/index.js"
  },
  "main": "./dist/index.js",
  "files": ["dist"],
  "scripts": {
    "build": "tsup src/index.ts --format esm --dts --clean",
    "dev": "tsx src/index.ts",
    "typecheck": "tsc --noEmit"
  },
  "dependencies": {
    "@modelcontextprotocol/sdk": "^1.0.0",
    "zod": "^3.22.0"
  },
  "devDependencies": {
    "tsx": "^4.7.0",
    "tsup": "^8.0.0",
    "typescript": "^5.4.0",
    "@types/node": "^20.0.0"
  },
  "engines": {
    "node": ">=20"
  }
}
```

**Step 2: Create tsconfig.json**

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "ESNext",
    "moduleResolution": "bundler",
    "strict": true,
    "outDir": "dist",
    "rootDir": "src",
    "declaration": true,
    "esModuleInterop": true,
    "skipLibCheck": true
  },
  "include": ["src"]
}
```

**Step 3: Create .env.example**

```
OLLI_API_KEY=olli_sk_your_key_here
OLLI_BASE_URL=https://api.olli.social/v1
```

**Step 4: Create .gitignore**

```
node_modules/
dist/
.env
*.js.map
```

**Step 5: Create src/index.ts stub**

```typescript
#!/usr/bin/env node
console.log('stub')
```

**Step 6: Create src/client.ts stub**

```typescript
export {}
```

**Step 7: Install dependencies**

Run: `npm install`

Expected: `node_modules/` created, lock file written.

**Step 8: Verify typecheck passes**

Run: `npm run typecheck`

Expected: exits 0, no errors.

**Step 9: Commit**

```bash
git add package.json tsconfig.json .env.example .gitignore src/index.ts src/client.ts
git commit -m "feat: scaffold @olli/mcp-server package"
```

---

### Task 2: OlliClient

**Files:**
- Modify: `src/client.ts`

**Step 1: Write src/client.ts**

```typescript
import { McpError, ErrorCode } from '@modelcontextprotocol/sdk/types.js'

export class OlliClient {
  private readonly baseUrl: string
  private readonly apiKey: string

  constructor() {
    const key = process.env.OLLI_API_KEY
    if (!key) {
      console.error('Error: OLLI_API_KEY environment variable is required')
      process.exit(1)
    }
    this.apiKey = key
    this.baseUrl =
      process.env.OLLI_BASE_URL ?? 'https://api.olli.social/v1'
  }

  private async request<T>(
    method: string,
    path: string,
    body?: unknown,
  ): Promise<T> {
    const url = `${this.baseUrl}${path}`
    let response: Response
    try {
      response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          'X-API-Key': this.apiKey,
        },
        body: body !== undefined ? JSON.stringify(body) : undefined,
      })
    } catch (err) {
      throw new McpError(
        ErrorCode.InternalError,
        `Network error: ${err instanceof Error ? err.message : String(err)}`,
      )
    }

    if (!response.ok) {
      let message = `HTTP ${response.status}`
      try {
        const json = (await response.json()) as { error?: { message?: string } }
        if (json.error?.message) message = json.error.message
      } catch {
        // ignore parse errors
      }
      throw new McpError(ErrorCode.InternalError, message)
    }

    if (response.status === 204) return undefined as T
    return response.json() as Promise<T>
  }

  get<T>(path: string) { return this.request<T>('GET', path) }
  post<T>(path: string, body: unknown) { return this.request<T>('POST', path, body) }
  patch<T>(path: string, body: unknown) { return this.request<T>('PATCH', path, body) }
  delete<T = void>(path: string) { return this.request<T>('DELETE', path) }
}
```

**Step 2: Typecheck**

Run: `npm run typecheck`

Expected: 0 errors.

**Step 3: Commit**

```bash
git add src/client.ts
git commit -m "feat: add OlliClient fetch wrapper"
```

---

### Task 3: Campaigns Tool File

**Files:**
- Create: `src/tools/campaigns.ts`

The campaigns API lives at `/workspaces/:workspace_id/campaigns`.

Permitted params (from controller): `name`, `description`, `start_date`, `end_date`, `status`, `campaign_type`, `target_audience`, `budget`.

**Step 1: Write src/tools/campaigns.ts**

```typescript
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js'
import { z } from 'zod'
import type { OlliClient } from '../client.js'

const base = (workspaceId: string) => `/workspaces/${workspaceId}/campaigns`

export function registerCampaignTools(server: McpServer, client: OlliClient) {
  server.tool(
    'list_campaigns',
    {
      workspace_id: z.string().describe('Workspace slug or UUID'),
    },
    'List all campaigns in a workspace',
    async ({ workspace_id }) => {
      const data = await client.get(base(workspace_id))
      return { content: [{ type: 'text', text: JSON.stringify(data, null, 2) }] }
    },
  )

  server.tool(
    'get_campaign',
    {
      workspace_id: z.string().describe('Workspace slug or UUID'),
      id: z.string().describe('Campaign UUID'),
    },
    'Get a single campaign',
    async ({ workspace_id, id }) => {
      const data = await client.get(`${base(workspace_id)}/${id}`)
      return { content: [{ type: 'text', text: JSON.stringify(data, null, 2) }] }
    },
  )

  server.tool(
    'create_campaign',
    {
      workspace_id: z.string().describe('Workspace slug or UUID'),
      name: z.string().describe('Campaign name'),
      description: z.string().optional(),
      start_date: z.string().optional().describe('ISO 8601 date'),
      end_date: z.string().optional().describe('ISO 8601 date'),
      status: z.enum(['draft', 'active', 'paused', 'completed']).optional(),
      campaign_type: z.string().optional(),
      target_audience: z.string().optional(),
      budget: z.number().optional(),
    },
    'Create a new campaign',
    async ({ workspace_id, ...params }) => {
      const data = await client.post(base(workspace_id), { campaign: params })
      return { content: [{ type: 'text', text: JSON.stringify(data, null, 2) }] }
    },
  )

  server.tool(
    'update_campaign',
    {
      workspace_id: z.string().describe('Workspace slug or UUID'),
      id: z.string().describe('Campaign UUID'),
      name: z.string().optional(),
      description: z.string().optional(),
      start_date: z.string().optional().describe('ISO 8601 date'),
      end_date: z.string().optional().describe('ISO 8601 date'),
      status: z.enum(['draft', 'active', 'paused', 'completed']).optional(),
      campaign_type: z.string().optional(),
      target_audience: z.string().optional(),
      budget: z.number().optional(),
    },
    'Update an existing campaign',
    async ({ workspace_id, id, ...params }) => {
      const data = await client.patch(`${base(workspace_id)}/${id}`, { campaign: params })
      return { content: [{ type: 'text', text: JSON.stringify(data, null, 2) }] }
    },
  )

  server.tool(
    'delete_campaign',
    {
      workspace_id: z.string().describe('Workspace slug or UUID'),
      id: z.string().describe('Campaign UUID'),
    },
    'Delete a campaign',
    async ({ workspace_id, id }) => {
      await client.delete(`${base(workspace_id)}/${id}`)
      return { content: [{ type: 'text', text: 'Campaign deleted.' }] }
    },
  )
}
```

**Step 2: Typecheck**

Run: `npm run typecheck`

Expected: 0 errors.

**Step 3: Commit**

```bash
git add src/tools/campaigns.ts
git commit -m "feat: add campaigns tools"
```

---

### Task 4: Drafts Tool File

**Files:**
- Create: `src/tools/drafts.ts`

Permitted params: `title`, `content`, `platform`, `campaign_id`, `status`, `notes`, `media_url`.
Publish: `integration_id`, `author_type`.
Schedule: `integration_id`, `scheduled_for`, `author_type`.

**Step 1: Write src/tools/drafts.ts**

```typescript
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js'
import { z } from 'zod'
import type { OlliClient } from '../client.js'

const base = (workspaceId: string) => `/workspaces/${workspaceId}/drafts`

const PLATFORMS = ['linkedin', 'twitter', 'instagram', 'facebook'] as const

export function registerDraftTools(server: McpServer, client: OlliClient) {
  server.tool(
    'list_drafts',
    {
      workspace_id: z.string().describe('Workspace slug or UUID'),
      platform: z.enum(PLATFORMS).optional(),
      q: z.string().optional().describe('Search query'),
    },
    'List drafts in a workspace',
    async ({ workspace_id, ...filters }) => {
      const params = new URLSearchParams(
        Object.entries(filters).filter(([, v]) => v !== undefined) as [string, string][],
      )
      const qs = params.size ? `?${params}` : ''
      const data = await client.get(`${base(workspace_id)}${qs}`)
      return { content: [{ type: 'text', text: JSON.stringify(data, null, 2) }] }
    },
  )

  server.tool(
    'get_draft',
    {
      workspace_id: z.string().describe('Workspace slug or UUID'),
      id: z.string().describe('Draft UUID'),
    },
    'Get a single draft',
    async ({ workspace_id, id }) => {
      const data = await client.get(`${base(workspace_id)}/${id}`)
      return { content: [{ type: 'text', text: JSON.stringify(data, null, 2) }] }
    },
  )

  server.tool(
    'create_draft',
    {
      workspace_id: z.string().describe('Workspace slug or UUID'),
      title: z.string().optional(),
      content: z.string().describe('Post content'),
      platform: z.enum(PLATFORMS).optional(),
      campaign_id: z.string().optional().describe('Campaign UUID'),
      status: z.enum(['draft', 'ready', 'scheduled', 'published']).optional(),
      notes: z.string().optional(),
      media_url: z.string().optional(),
    },
    'Create a new draft',
    async ({ workspace_id, ...params }) => {
      const data = await client.post(base(workspace_id), { draft: params })
      return { content: [{ type: 'text', text: JSON.stringify(data, null, 2) }] }
    },
  )

  server.tool(
    'update_draft',
    {
      workspace_id: z.string().describe('Workspace slug or UUID'),
      id: z.string().describe('Draft UUID'),
      title: z.string().optional(),
      content: z.string().optional(),
      platform: z.enum(PLATFORMS).optional(),
      campaign_id: z.string().optional(),
      status: z.enum(['draft', 'ready', 'scheduled', 'published']).optional(),
      notes: z.string().optional(),
      media_url: z.string().optional(),
    },
    'Update a draft',
    async ({ workspace_id, id, ...params }) => {
      const data = await client.patch(`${base(workspace_id)}/${id}`, { draft: params })
      return { content: [{ type: 'text', text: JSON.stringify(data, null, 2) }] }
    },
  )

  server.tool(
    'delete_draft',
    {
      workspace_id: z.string().describe('Workspace slug or UUID'),
      id: z.string().describe('Draft UUID'),
    },
    'Delete a draft',
    async ({ workspace_id, id }) => {
      await client.delete(`${base(workspace_id)}/${id}`)
      return { content: [{ type: 'text', text: 'Draft deleted.' }] }
    },
  )

  server.tool(
    'publish_draft',
    {
      workspace_id: z.string().describe('Workspace slug or UUID'),
      id: z.string().describe('Draft UUID'),
      integration_id: z.string().describe('LinkedIn/Twitter integration UUID'),
      author_type: z.enum(['member', 'organization']).default('member'),
    },
    'Publish a draft immediately to a connected social account',
    async ({ workspace_id, id, integration_id, author_type }) => {
      const data = await client.post(
        `${base(workspace_id)}/${id}/publish_now`,
        { integration_id, author_type },
      )
      return { content: [{ type: 'text', text: JSON.stringify(data, null, 2) }] }
    },
  )

  server.tool(
    'schedule_draft',
    {
      workspace_id: z.string().describe('Workspace slug or UUID'),
      id: z.string().describe('Draft UUID'),
      integration_id: z.string().describe('LinkedIn/Twitter integration UUID'),
      scheduled_for: z.string().describe('ISO 8601 datetime to publish at'),
      author_type: z.enum(['member', 'organization']).default('member'),
    },
    'Schedule a draft for future publishing',
    async ({ workspace_id, id, integration_id, scheduled_for, author_type }) => {
      const data = await client.post(
        `${base(workspace_id)}/${id}/schedule`,
        { integration_id, scheduled_for, author_type },
      )
      return { content: [{ type: 'text', text: JSON.stringify(data, null, 2) }] }
    },
  )
}
```

**Step 2: Typecheck**

Run: `npm run typecheck`

Expected: 0 errors.

**Step 3: Commit**

```bash
git add src/tools/drafts.ts
git commit -m "feat: add drafts tools including publish and schedule"
```

---

### Task 5: Calendar Tool File

**Files:**
- Create: `src/tools/calendar.ts`

Permitted params: `title`, `content`, `platform`, `scheduled_for`, `campaign_id`, `status`, `notes`.
Filters: `platform`, `status`, `start_date`, `end_date`.

**Step 1: Write src/tools/calendar.ts**

```typescript
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js'
import { z } from 'zod'
import type { OlliClient } from '../client.js'

const base = (workspaceId: string) => `/workspaces/${workspaceId}/calendar_events`

const PLATFORMS = ['linkedin', 'twitter', 'instagram', 'facebook'] as const

export function registerCalendarTools(server: McpServer, client: OlliClient) {
  server.tool(
    'list_calendar_events',
    {
      workspace_id: z.string().describe('Workspace slug or UUID'),
      platform: z.enum(PLATFORMS).optional(),
      status: z.string().optional(),
      start_date: z.string().optional().describe('ISO 8601 date filter start'),
      end_date: z.string().optional().describe('ISO 8601 date filter end'),
    },
    'List calendar events in a workspace',
    async ({ workspace_id, ...filters }) => {
      const params = new URLSearchParams(
        Object.entries(filters).filter(([, v]) => v !== undefined) as [string, string][],
      )
      const qs = params.size ? `?${params}` : ''
      const data = await client.get(`${base(workspace_id)}${qs}`)
      return { content: [{ type: 'text', text: JSON.stringify(data, null, 2) }] }
    },
  )

  server.tool(
    'get_calendar_event',
    {
      workspace_id: z.string().describe('Workspace slug or UUID'),
      id: z.string().describe('Calendar event UUID'),
    },
    'Get a single calendar event',
    async ({ workspace_id, id }) => {
      const data = await client.get(`${base(workspace_id)}/${id}`)
      return { content: [{ type: 'text', text: JSON.stringify(data, null, 2) }] }
    },
  )

  server.tool(
    'create_calendar_event',
    {
      workspace_id: z.string().describe('Workspace slug or UUID'),
      title: z.string().describe('Event title'),
      content: z.string().optional().describe('Post content'),
      platform: z.enum(PLATFORMS).optional(),
      scheduled_for: z.string().describe('ISO 8601 datetime'),
      campaign_id: z.string().optional(),
      status: z.string().optional(),
      notes: z.string().optional(),
    },
    'Create a calendar event',
    async ({ workspace_id, ...params }) => {
      const data = await client.post(base(workspace_id), { calendar_event: params })
      return { content: [{ type: 'text', text: JSON.stringify(data, null, 2) }] }
    },
  )

  server.tool(
    'update_calendar_event',
    {
      workspace_id: z.string().describe('Workspace slug or UUID'),
      id: z.string().describe('Calendar event UUID'),
      title: z.string().optional(),
      content: z.string().optional(),
      platform: z.enum(PLATFORMS).optional(),
      scheduled_for: z.string().optional().describe('ISO 8601 datetime'),
      campaign_id: z.string().optional(),
      status: z.string().optional(),
      notes: z.string().optional(),
    },
    'Update a calendar event',
    async ({ workspace_id, id, ...params }) => {
      const data = await client.patch(`${base(workspace_id)}/${id}`, { calendar_event: params })
      return { content: [{ type: 'text', text: JSON.stringify(data, null, 2) }] }
    },
  )

  server.tool(
    'delete_calendar_event',
    {
      workspace_id: z.string().describe('Workspace slug or UUID'),
      id: z.string().describe('Calendar event UUID'),
    },
    'Delete a calendar event',
    async ({ workspace_id, id }) => {
      await client.delete(`${base(workspace_id)}/${id}`)
      return { content: [{ type: 'text', text: 'Calendar event deleted.' }] }
    },
  )
}
```

**Step 2: Typecheck + commit**

Run: `npm run typecheck`

Expected: 0 errors.

```bash
git add src/tools/calendar.ts
git commit -m "feat: add calendar tools"
```

---

### Task 6: Assets Tool File

**Files:**
- Create: `src/tools/assets.ts`

Permitted params: `name`, `asset_type`, `url`, `thumbnail_url`, `tags` (array).
Filters: `type`, `tag`, `q`.

**Step 1: Write src/tools/assets.ts**

```typescript
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js'
import { z } from 'zod'
import type { OlliClient } from '../client.js'

const base = (workspaceId: string) => `/workspaces/${workspaceId}/assets`

export function registerAssetTools(server: McpServer, client: OlliClient) {
  server.tool(
    'list_assets',
    {
      workspace_id: z.string().describe('Workspace slug or UUID'),
      type: z.string().optional().describe('Filter by asset_type'),
      tag: z.string().optional().describe('Filter by tag'),
      q: z.string().optional().describe('Search query'),
    },
    'List assets in the workspace library',
    async ({ workspace_id, ...filters }) => {
      const params = new URLSearchParams(
        Object.entries(filters).filter(([, v]) => v !== undefined) as [string, string][],
      )
      const qs = params.size ? `?${params}` : ''
      const data = await client.get(`${base(workspace_id)}${qs}`)
      return { content: [{ type: 'text', text: JSON.stringify(data, null, 2) }] }
    },
  )

  server.tool(
    'get_asset',
    {
      workspace_id: z.string().describe('Workspace slug or UUID'),
      id: z.string().describe('Asset UUID'),
    },
    'Get a single asset',
    async ({ workspace_id, id }) => {
      const data = await client.get(`${base(workspace_id)}/${id}`)
      return { content: [{ type: 'text', text: JSON.stringify(data, null, 2) }] }
    },
  )

  server.tool(
    'create_asset',
    {
      workspace_id: z.string().describe('Workspace slug or UUID'),
      name: z.string().describe('Asset name'),
      asset_type: z.string().describe('e.g. image, video, document'),
      url: z.string().url().describe('Public URL of the asset'),
      thumbnail_url: z.string().url().optional(),
      tags: z.array(z.string()).optional(),
    },
    'Add an asset to the workspace library',
    async ({ workspace_id, ...params }) => {
      const data = await client.post(base(workspace_id), { asset: params })
      return { content: [{ type: 'text', text: JSON.stringify(data, null, 2) }] }
    },
  )

  server.tool(
    'delete_asset',
    {
      workspace_id: z.string().describe('Workspace slug or UUID'),
      id: z.string().describe('Asset UUID'),
    },
    'Delete an asset from the library',
    async ({ workspace_id, id }) => {
      await client.delete(`${base(workspace_id)}/${id}`)
      return { content: [{ type: 'text', text: 'Asset deleted.' }] }
    },
  )
}
```

**Step 2: Typecheck + commit**

Run: `npm run typecheck`

```bash
git add src/tools/assets.ts
git commit -m "feat: add assets tools"
```

---

### Task 7: ICPs and Industries Tool Files

**Files:**
- Create: `src/tools/icps.ts`
- Create: `src/tools/industries.ts`

Both share the same shape: `name`, `description`, `criteria` (object).

**Step 1: Write src/tools/icps.ts**

```typescript
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js'
import { z } from 'zod'
import type { OlliClient } from '../client.js'

const base = (workspaceId: string) => `/workspaces/${workspaceId}/icps`

export function registerIcpTools(server: McpServer, client: OlliClient) {
  server.tool(
    'list_icps',
    {
      workspace_id: z.string().describe('Workspace slug or UUID'),
      q: z.string().optional().describe('Search query'),
    },
    'List Ideal Customer Profiles (ICPs) for a workspace',
    async ({ workspace_id, q }) => {
      const qs = q ? `?q=${encodeURIComponent(q)}` : ''
      const data = await client.get(`${base(workspace_id)}${qs}`)
      return { content: [{ type: 'text', text: JSON.stringify(data, null, 2) }] }
    },
  )

  server.tool(
    'create_icp',
    {
      workspace_id: z.string().describe('Workspace slug or UUID'),
      name: z.string().describe('ICP name'),
      description: z.string().optional(),
      criteria: z.record(z.unknown()).optional().describe('Key-value criteria object'),
    },
    'Create an ICP',
    async ({ workspace_id, ...params }) => {
      const data = await client.post(base(workspace_id), { icp: params })
      return { content: [{ type: 'text', text: JSON.stringify(data, null, 2) }] }
    },
  )

  server.tool(
    'update_icp',
    {
      workspace_id: z.string().describe('Workspace slug or UUID'),
      id: z.string().describe('ICP UUID'),
      name: z.string().optional(),
      description: z.string().optional(),
      criteria: z.record(z.unknown()).optional(),
    },
    'Update an ICP',
    async ({ workspace_id, id, ...params }) => {
      const data = await client.patch(`${base(workspace_id)}/${id}`, { icp: params })
      return { content: [{ type: 'text', text: JSON.stringify(data, null, 2) }] }
    },
  )

  server.tool(
    'delete_icp',
    {
      workspace_id: z.string().describe('Workspace slug or UUID'),
      id: z.string().describe('ICP UUID'),
    },
    'Delete an ICP',
    async ({ workspace_id, id }) => {
      await client.delete(`${base(workspace_id)}/${id}`)
      return { content: [{ type: 'text', text: 'ICP deleted.' }] }
    },
  )
}
```

**Step 2: Write src/tools/industries.ts**

```typescript
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js'
import { z } from 'zod'
import type { OlliClient } from '../client.js'

const base = (workspaceId: string) => `/workspaces/${workspaceId}/industries`

export function registerIndustryTools(server: McpServer, client: OlliClient) {
  server.tool(
    'list_industries',
    {
      workspace_id: z.string().describe('Workspace slug or UUID'),
      q: z.string().optional().describe('Search query'),
    },
    'List target industries for a workspace',
    async ({ workspace_id, q }) => {
      const qs = q ? `?q=${encodeURIComponent(q)}` : ''
      const data = await client.get(`${base(workspace_id)}${qs}`)
      return { content: [{ type: 'text', text: JSON.stringify(data, null, 2) }] }
    },
  )

  server.tool(
    'create_industry',
    {
      workspace_id: z.string().describe('Workspace slug or UUID'),
      name: z.string().describe('Industry name'),
      description: z.string().optional(),
      criteria: z.record(z.unknown()).optional(),
    },
    'Create a target industry',
    async ({ workspace_id, ...params }) => {
      const data = await client.post(base(workspace_id), { industry: params })
      return { content: [{ type: 'text', text: JSON.stringify(data, null, 2) }] }
    },
  )

  server.tool(
    'update_industry',
    {
      workspace_id: z.string().describe('Workspace slug or UUID'),
      id: z.string().describe('Industry UUID'),
      name: z.string().optional(),
      description: z.string().optional(),
      criteria: z.record(z.unknown()).optional(),
    },
    'Update a target industry',
    async ({ workspace_id, id, ...params }) => {
      const data = await client.patch(`${base(workspace_id)}/${id}`, { industry: params })
      return { content: [{ type: 'text', text: JSON.stringify(data, null, 2) }] }
    },
  )

  server.tool(
    'delete_industry',
    {
      workspace_id: z.string().describe('Workspace slug or UUID'),
      id: z.string().describe('Industry UUID'),
    },
    'Delete a target industry',
    async ({ workspace_id, id }) => {
      await client.delete(`${base(workspace_id)}/${id}`)
      return { content: [{ type: 'text', text: 'Industry deleted.' }] }
    },
  )
}
```

**Step 3: Typecheck + commit**

Run: `npm run typecheck`

```bash
git add src/tools/icps.ts src/tools/industries.ts
git commit -m "feat: add ICPs and industries tools"
```

---

### Task 8: Products and Teams Tool Files

**Files:**
- Create: `src/tools/products.ts`
- Create: `src/tools/teams.ts`

Products: full CRUD with `name`, `description`, `metadata` (hash).
Teams: read-only (`list_teams`, `get_team`).

**Step 1: Write src/tools/products.ts**

```typescript
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js'
import { z } from 'zod'
import type { OlliClient } from '../client.js'

const base = (workspaceId: string) => `/workspaces/${workspaceId}/products`

export function registerProductTools(server: McpServer, client: OlliClient) {
  server.tool(
    'list_products',
    {
      workspace_id: z.string().describe('Workspace slug or UUID'),
    },
    'List products in a workspace',
    async ({ workspace_id }) => {
      const data = await client.get(base(workspace_id))
      return { content: [{ type: 'text', text: JSON.stringify(data, null, 2) }] }
    },
  )

  server.tool(
    'create_product',
    {
      workspace_id: z.string().describe('Workspace slug or UUID'),
      name: z.string().describe('Product name'),
      description: z.string().optional(),
      metadata: z.record(z.unknown()).optional().describe('Arbitrary key-value metadata'),
    },
    'Create a product',
    async ({ workspace_id, ...params }) => {
      const data = await client.post(base(workspace_id), { product: params })
      return { content: [{ type: 'text', text: JSON.stringify(data, null, 2) }] }
    },
  )

  server.tool(
    'update_product',
    {
      workspace_id: z.string().describe('Workspace slug or UUID'),
      id: z.string().describe('Product UUID'),
      name: z.string().optional(),
      description: z.string().optional(),
      metadata: z.record(z.unknown()).optional(),
    },
    'Update a product',
    async ({ workspace_id, id, ...params }) => {
      const data = await client.patch(`${base(workspace_id)}/${id}`, { product: params })
      return { content: [{ type: 'text', text: JSON.stringify(data, null, 2) }] }
    },
  )

  server.tool(
    'delete_product',
    {
      workspace_id: z.string().describe('Workspace slug or UUID'),
      id: z.string().describe('Product UUID'),
    },
    'Delete a product',
    async ({ workspace_id, id }) => {
      await client.delete(`${base(workspace_id)}/${id}`)
      return { content: [{ type: 'text', text: 'Product deleted.' }] }
    },
  )
}
```

**Step 2: Write src/tools/teams.ts**

```typescript
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js'
import { z } from 'zod'
import type { OlliClient } from '../client.js'

const base = (workspaceId: string) => `/workspaces/${workspaceId}/teams`

export function registerTeamTools(server: McpServer, client: OlliClient) {
  server.tool(
    'list_teams',
    {
      workspace_id: z.string().describe('Workspace slug or UUID'),
    },
    'List teams in a workspace',
    async ({ workspace_id }) => {
      const data = await client.get(base(workspace_id))
      return { content: [{ type: 'text', text: JSON.stringify(data, null, 2) }] }
    },
  )

  server.tool(
    'get_team',
    {
      workspace_id: z.string().describe('Workspace slug or UUID'),
      id: z.string().describe('Team UUID'),
    },
    'Get a single team and its members',
    async ({ workspace_id, id }) => {
      const data = await client.get(`${base(workspace_id)}/${id}`)
      return { content: [{ type: 'text', text: JSON.stringify(data, null, 2) }] }
    },
  )
}
```

**Step 3: Typecheck + commit**

Run: `npm run typecheck`

```bash
git add src/tools/products.ts src/tools/teams.ts
git commit -m "feat: add products and teams tools"
```

---

### Task 9: Analytics, Leaderboard, and Amplification Tool Files

**Files:**
- Create: `src/tools/analytics.ts`
- Create: `src/tools/leaderboard.ts`
- Create: `src/tools/amplification.ts`

Analytics: GET with `period` query param.
Amplification: `list_amplification_posts` (read) + `create_amplification_post` (write).

**Step 1: Write src/tools/analytics.ts**

```typescript
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js'
import { z } from 'zod'
import type { OlliClient } from '../client.js'

const PERIODS = [
  'current_month',
  'last_month',
  'last_7_days',
  'last_30_days',
  'last_90_days',
  'all_time',
] as const

export function registerAnalyticsTools(server: McpServer, client: OlliClient) {
  server.tool(
    'get_analytics',
    {
      workspace_id: z.string().describe('Workspace slug or UUID'),
      period: z.enum(PERIODS).default('last_30_days').describe('Time period for analytics'),
    },
    'Get workspace analytics (impressions, engagement, follower growth)',
    async ({ workspace_id, period }) => {
      const data = await client.get(
        `/workspaces/${workspace_id}/analytics?period=${period}`,
      )
      return { content: [{ type: 'text', text: JSON.stringify(data, null, 2) }] }
    },
  )
}
```

**Step 2: Write src/tools/leaderboard.ts**

```typescript
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js'
import { z } from 'zod'
import type { OlliClient } from '../client.js'

export function registerLeaderboardTools(server: McpServer, client: OlliClient) {
  server.tool(
    'get_leaderboard',
    {
      workspace_id: z.string().describe('Workspace slug or UUID'),
    },
    'Get the workspace member leaderboard ranked by content performance',
    async ({ workspace_id }) => {
      const data = await client.get(`/workspaces/${workspace_id}/leaderboard`)
      return { content: [{ type: 'text', text: JSON.stringify(data, null, 2) }] }
    },
  )
}
```

**Step 3: Write src/tools/amplification.ts**

```typescript
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js'
import { z } from 'zod'
import type { OlliClient } from '../client.js'

const base = (workspaceId: string) => `/workspaces/${workspaceId}/amplification_posts`

export function registerAmplificationTools(server: McpServer, client: OlliClient) {
  server.tool(
    'list_amplification_posts',
    {
      workspace_id: z.string().describe('Workspace slug or UUID'),
    },
    'List amplification posts (posts queued for team amplification)',
    async ({ workspace_id }) => {
      const data = await client.get(base(workspace_id))
      return { content: [{ type: 'text', text: JSON.stringify(data, null, 2) }] }
    },
  )

  server.tool(
    'create_amplification_post',
    {
      workspace_id: z.string().describe('Workspace slug or UUID'),
      original_post_id: z.string().describe('UUID of the original post/draft'),
      platform: z.enum(['linkedin', 'twitter']),
      content_preview: z.string().describe('Preview text for team members to see'),
      target_audience: z.string().optional().describe('Who this post is targeting'),
      post_url: z.string().url().optional().describe('Public URL of the live post'),
    },
    'Add a post to the amplification queue for team sharing',
    async ({ workspace_id, ...params }) => {
      const data = await client.post(base(workspace_id), { amplification_post: params })
      return { content: [{ type: 'text', text: JSON.stringify(data, null, 2) }] }
    },
  )
}
```

**Step 4: Typecheck + commit**

Run: `npm run typecheck`

```bash
git add src/tools/analytics.ts src/tools/leaderboard.ts src/tools/amplification.ts
git commit -m "feat: add analytics, leaderboard, and amplification tools"
```

---

### Task 10: AI Tool File

**Files:**
- Create: `src/tools/ai.ts`

AI endpoints live at `/workspaces/:id/ai/generate`, `/ai/improve`, `/ai/variations`, `/ai/hashtags`.
Params: `platform`, `topic`, `tone`, `length`, `content`, `instruction`, `count`.

**Step 1: Write src/tools/ai.ts**

```typescript
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
    {
      workspace_id: z.string().describe('Workspace slug or UUID'),
      platform: z.enum(PLATFORMS).describe('Target social platform'),
      topic: z.string().describe('What the post should be about'),
      tone: z.enum(TONES).default('professional'),
      length: z.enum(LENGTHS).default('medium'),
    },
    'Generate a social media post using AI',
    async ({ workspace_id, ...params }) => {
      const data = await client.post(`${aiBase(workspace_id)}/generate`, params)
      return { content: [{ type: 'text', text: JSON.stringify(data, null, 2) }] }
    },
  )

  server.tool(
    'improve_content',
    {
      workspace_id: z.string().describe('Workspace slug or UUID'),
      content: z.string().describe('Existing content to improve'),
      instruction: z.string().describe('How to improve it, e.g. "make it more concise"'),
      platform: z.enum(PLATFORMS).optional(),
    },
    'Improve existing post content using AI',
    async ({ workspace_id, ...params }) => {
      const data = await client.post(`${aiBase(workspace_id)}/improve`, params)
      return { content: [{ type: 'text', text: JSON.stringify(data, null, 2) }] }
    },
  )

  server.tool(
    'create_variations',
    {
      workspace_id: z.string().describe('Workspace slug or UUID'),
      content: z.string().describe('Source content to create variations from'),
      count: z.number().int().min(1).max(5).default(3),
      platform: z.enum(PLATFORMS).optional(),
    },
    'Generate multiple variations of a post',
    async ({ workspace_id, ...params }) => {
      const data = await client.post(`${aiBase(workspace_id)}/variations`, params)
      return { content: [{ type: 'text', text: JSON.stringify(data, null, 2) }] }
    },
  )

  server.tool(
    'suggest_hashtags',
    {
      workspace_id: z.string().describe('Workspace slug or UUID'),
      content: z.string().describe('Post content to generate hashtags for'),
      platform: z.enum(PLATFORMS).optional(),
    },
    'Suggest relevant hashtags for a post',
    async ({ workspace_id, ...params }) => {
      const data = await client.post(`${aiBase(workspace_id)}/hashtags`, params)
      return { content: [{ type: 'text', text: JSON.stringify(data, null, 2) }] }
    },
  )
}
```

**Step 2: Typecheck + commit**

Run: `npm run typecheck`

```bash
git add src/tools/ai.ts
git commit -m "feat: add AI content generation tools"
```

---

### Task 11: Entry Point (src/index.ts)

**Files:**
- Modify: `src/index.ts`

Wire all tool registrations into a single McpServer and connect stdio transport.

**Step 1: Write src/index.ts**

```typescript
#!/usr/bin/env node
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js'
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js'
import { OlliClient } from './client.js'
import { registerCampaignTools } from './tools/campaigns.js'
import { registerDraftTools } from './tools/drafts.js'
import { registerCalendarTools } from './tools/calendar.js'
import { registerAssetTools } from './tools/assets.js'
import { registerIcpTools } from './tools/icps.js'
import { registerIndustryTools } from './tools/industries.js'
import { registerProductTools } from './tools/products.js'
import { registerTeamTools } from './tools/teams.js'
import { registerAnalyticsTools } from './tools/analytics.js'
import { registerAmplificationTools } from './tools/amplification.js'
import { registerLeaderboardTools } from './tools/leaderboard.js'
import { registerAiTools } from './tools/ai.js'

const server = new McpServer({
  name: 'olli',
  version: '0.1.0',
})

const client = new OlliClient()

registerCampaignTools(server, client)
registerDraftTools(server, client)
registerCalendarTools(server, client)
registerAssetTools(server, client)
registerIcpTools(server, client)
registerIndustryTools(server, client)
registerProductTools(server, client)
registerTeamTools(server, client)
registerAnalyticsTools(server, client)
registerAmplificationTools(server, client)
registerLeaderboardTools(server, client)
registerAiTools(server, client)

const transport = new StdioServerTransport()
await server.connect(transport)
```

**Step 2: Typecheck**

Run: `npm run typecheck`

Expected: 0 errors.

**Step 3: Build**

Run: `npm run build`

Expected: `dist/index.js` created, exits 0.

**Step 4: Verify it starts (requires OLLI_API_KEY)**

```bash
echo '{"jsonrpc":"2.0","id":1,"method":"tools/list","params":{}}' | OLLI_API_KEY=olli_sk_test node dist/index.js
```

Expected: JSON response listing all 30 tools.

**Step 5: Commit**

```bash
git add src/index.ts
git commit -m "feat: wire all tools into MCP server entry point"
```

---

### Task 12: README

**Files:**
- Create: `README.md`

**Step 1: Write README.md**

````markdown
# @olli/mcp-server

MCP server for [olli.social](https://olli.social) — lets LLMs manage your social presence via API key.

## Installation

```json
{
  "mcpServers": {
    "olli": {
      "command": "npx",
      "args": ["-y", "@olli/mcp-server"],
      "env": {
        "OLLI_API_KEY": "olli_sk_your_key_here"
      }
    }
  }
}
```

Generate an API key in your olli.social profile settings under **API Keys**.

## Configuration

| Variable | Required | Default |
|---|---|---|
| `OLLI_API_KEY` | Yes | — |
| `OLLI_BASE_URL` | No | `https://api.olli.social/v1` |

## Tools (30)

| Category | Tools |
|---|---|
| Campaigns | `list_campaigns`, `get_campaign`, `create_campaign`, `update_campaign`, `delete_campaign` |
| Drafts | `list_drafts`, `get_draft`, `create_draft`, `update_draft`, `delete_draft`, `publish_draft`, `schedule_draft` |
| Calendar | `list_calendar_events`, `get_calendar_event`, `create_calendar_event`, `update_calendar_event`, `delete_calendar_event` |
| Assets | `list_assets`, `get_asset`, `create_asset`, `delete_asset` |
| ICPs | `list_icps`, `create_icp`, `update_icp`, `delete_icp` |
| Industries | `list_industries`, `create_industry`, `update_industry`, `delete_industry` |
| Products | `list_products`, `create_product`, `update_product`, `delete_product` |
| Teams | `list_teams`, `get_team` |
| Analytics | `get_analytics` |
| Amplification | `list_amplification_posts`, `create_amplification_post` |
| Leaderboard | `get_leaderboard` |
| AI | `generate_post`, `improve_content`, `create_variations`, `suggest_hashtags` |

All workspace-scoped tools require a `workspace_id` (slug or UUID, e.g. `"olli-demo"`).

## Development

```bash
npm install
OLLI_API_KEY=olli_sk_... npm run dev
npm run build
```
````

**Step 2: Commit**

```bash
git add README.md
git commit -m "docs: add README with installation and tool reference"
```
