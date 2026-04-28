/**
 * schema-sync.ts — Fetches avatar tool schemas from olli-social-app's
 * AvatarToolRegistry and writes them to src/generated/avatar-schemas.json.
 *
 * This script is the bridge between the Rails source-of-truth for avatar tool
 * definitions and the MCP server's tool registration. Instead of maintaining
 * duplicate Zod schemas in TypeScript, the MCP server imports the JSON schemas
 * that Rails exports via GET /api/v1/ai/avatar_schemas.
 *
 * Environment variables:
 *   MCP_RAILS_URL     — Base URL of the olli-social-app Rails server
 *                        (e.g. https://api.olli.social or http://localhost:3000)
 *   MCP_SHARED_SECRET — Shared secret for authenticating with the schema endpoint.
 *                        Must match the MCP_SHARED_SECRET env var on the Rails side.
 *
 * Usage:
 *   npm run sync-schemas
 *   # or: npx tsx src/schema-sync.ts
 */

import { writeFileSync, mkdirSync, existsSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

// Resolve the output path relative to this file's location
const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)
const OUTPUT_PATH = resolve(__dirname, 'generated', 'avatar-schemas.json')

/**
 * Fetches avatar tool schemas from the Rails API endpoint.
 *
 * @returns The parsed JSON response containing tools, version, and generated_at.
 * @throws If the request fails or the response is not valid JSON.
 */
async function fetchSchemas(): Promise<{
  tools: Array<Record<string, unknown>>
  version: string
  generated_at: string
}> {
  const railsUrl = process.env.MCP_RAILS_URL
  if (!railsUrl) {
    console.error('Error: MCP_RAILS_URL environment variable is required.')
    console.error('Set it to the base URL of your olli-social-app instance.')
    console.error('Example: MCP_RAILS_URL=https://api.olli.social')
    process.exit(1)
  }

  const secret = process.env.MCP_SHARED_SECRET
  if (!secret) {
    console.error('Error: MCP_SHARED_SECRET environment variable is required.')
    console.error('Set it to the same value as MCP_SHARED_SECRET on the Rails side.')
    process.exit(1)
  }

  // Build the full endpoint URL
  const url = `${railsUrl.replace(/\/$/, '')}/v1/ai/avatar_schemas`

  console.log(`Fetching avatar schemas from ${url} ...`)

  const response = await fetch(url, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
      'X-MCP-Secret': secret,
    },
  })

  if (!response.ok) {
    const body = await response.text()
    console.error(`Error: HTTP ${response.status} from Rails API`)
    console.error(`Response: ${body}`)
    process.exit(1)
  }

  return response.json() as Promise<{
    tools: Array<Record<string, unknown>>
    version: string
    generated_at: string
  }>
}

/**
 * Main entry point — fetches schemas and writes them to the output file.
 */
async function main(): Promise<void> {
  const data = await fetchSchemas()

  // Ensure the output directory exists
  const outputDir = dirname(OUTPUT_PATH)
  if (!existsSync(outputDir)) {
    mkdirSync(outputDir, { recursive: true })
    console.log(`Created directory: ${outputDir}`)
  }

  // Write the schemas to disk with pretty formatting for readability
  writeFileSync(OUTPUT_PATH, JSON.stringify(data, null, 2) + '\n', 'utf-8')

  console.log(`Successfully synced ${data.tools.length} avatar tool schemas`)
  console.log(`Schema version: ${data.version}`)
  console.log(`Generated at: ${data.generated_at}`)
  console.log(`Written to: ${OUTPUT_PATH}`)
}

main().catch((err) => {
  console.error('Fatal error during schema sync:', err)
  process.exit(1)
})
