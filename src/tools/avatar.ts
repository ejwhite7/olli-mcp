/**
 * avatar.ts — Registers avatar AI tools dynamically from synced JSON schemas.
 *
 * Instead of defining Zod schemas inline (like other tool files), this module
 * reads tool definitions from src/generated/avatar-schemas.json — a file produced
 * by `npm run sync-schemas` from the Rails AvatarToolRegistry source of truth.
 *
 * Each avatar tool is registered as an MCP tool that proxies the call to the
 * Rails avatar chat endpoint. The MCP tool schemas match the OpenAI function
 * format exported by AvatarToolRegistry.schema_definitions.
 *
 * Architecture:
 *   AvatarToolRegistry (Rails) --export--> avatar-schemas.json --import--> MCP tools
 *
 * The avatar tools run server-side in Rails (in-process with ActiveRecord).
 * The MCP server acts as a thin schema + routing layer — it knows the tool shapes
 * but delegates execution to the Rails avatar chat endpoint.
 */

import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js'
import { z } from 'zod'
import type { OlliClient } from '../client.js'
import { existsSync, readFileSync } from 'node:fs'
import { resolve, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

/** Path to the synced avatar schemas JSON file */
const SCHEMAS_PATH = resolve(__dirname, '..', 'generated', 'avatar-schemas.json')

/**
 * Shape of a single tool definition in the synced schemas file.
 * Matches the OpenAI function-calling format exported by AvatarToolRegistry.
 */
interface AvatarToolSchema {
  type: 'function'
  function: {
    name: string
    description: string
    parameters: {
      type: 'object'
      properties: Record<string, {
        type: string
        description?: string
        enum?: string[]
        format?: string
      }>
      required?: string[]
    }
  }
}

/**
 * Shape of the full synced schemas file.
 */
interface AvatarSchemasFile {
  tools: AvatarToolSchema[]
  version: string
  generated_at: string
}

/**
 * Converts an OpenAI JSON Schema property definition to a Zod schema.
 * Handles string (with optional enum), integer/number, boolean, and array types.
 *
 * @param prop — The JSON Schema property definition
 * @returns A Zod schema matching the property definition
 */
function jsonSchemaPropertyToZod(
  prop: { type: string; description?: string; enum?: string[]; format?: string }
): z.ZodTypeAny {
  let schema: z.ZodTypeAny

  switch (prop.type) {
    case 'string':
      if (prop.enum && prop.enum.length > 0) {
        // Create a Zod enum from the allowed values
        schema = z.enum(prop.enum as [string, ...string[]])
      } else {
        schema = z.string()
      }
      break
    case 'integer':
      schema = z.number().int()
      break
    case 'number':
      schema = z.number()
      break
    case 'boolean':
      schema = z.boolean()
      break
    case 'array':
      schema = z.array(z.unknown())
      break
    default:
      // Fallback for unrecognized types
      schema = z.unknown()
  }

  // Add description if present
  if (prop.description) {
    schema = schema.describe(prop.description)
  }

  return schema
}

/**
 * Converts an OpenAI function parameters object to a Zod object schema
 * suitable for McpServer.tool() registration.
 *
 * @param params — The OpenAI function parameters definition
 * @returns A record of Zod schemas keyed by parameter name
 */
function buildZodShape(
  params: AvatarToolSchema['function']['parameters']
): Record<string, z.ZodTypeAny> {
  const shape: Record<string, z.ZodTypeAny> = {}
  const required = new Set(params.required ?? [])

  for (const [key, prop] of Object.entries(params.properties)) {
    let zodProp = jsonSchemaPropertyToZod(prop)

    // Mark optional parameters as .optional() in Zod
    if (!required.has(key)) {
      zodProp = zodProp.optional()
    }

    shape[key] = zodProp
  }

  return shape
}

/**
 * Registers avatar tools from the synced schemas file with the MCP server.
 *
 * Each tool is registered as an MCP tool that:
 * 1. Uses the schema (name, description, parameters) from the JSON file
 * 2. Proxies execution to the Rails avatar chat endpoint
 *
 * If the schemas file doesn't exist, a warning is logged and registration is
 * skipped — the MCP server continues to work with its other (non-avatar) tools.
 * Run `npm run sync-schemas` to generate the file.
 *
 * @param server — The MCP server instance to register tools on
 * @param client — The OlliClient instance for making API calls to Rails
 */
export function registerAvatarTools(server: McpServer, client: OlliClient): void {
  // Check if the synced schemas file exists
  if (!existsSync(SCHEMAS_PATH)) {
    console.warn(
      '[avatar] No synced schemas found at src/generated/avatar-schemas.json. ' +
      'Run "npm run sync-schemas" to fetch avatar tool definitions from Rails. ' +
      'Avatar tools will not be registered.'
    )
    return
  }

  // Read and parse the schemas file
  let schemas: AvatarSchemasFile
  try {
    const raw = readFileSync(SCHEMAS_PATH, 'utf-8')
    schemas = JSON.parse(raw) as AvatarSchemasFile
  } catch (err) {
    console.error('[avatar] Failed to parse avatar-schemas.json:', err)
    return
  }

  console.error(
    `[avatar] Registering ${schemas.tools.length} avatar tools ` +
    `(schema version: ${schemas.version}, synced: ${schemas.generated_at})`
  )

  // Register each avatar tool with the MCP server
  for (const tool of schemas.tools) {
    const { name, description, parameters } = tool.function

    // Convert OpenAI JSON Schema parameters to Zod shape for MCP registration
    const zodShape = buildZodShape(parameters)

    // Register the tool — execution is proxied to the Rails avatar chat endpoint.
    // The avatar chat endpoint accepts a tool name and arguments, executes the tool
    // in-process with full ActiveRecord context, and returns the result.
    server.tool(
      `avatar_${name}`,
      `[Avatar] ${description}`,
      zodShape,
      async (args) => {
        // Proxy the tool call to the Rails avatar chat endpoint.
        // The workspace_id is required for avatar tools that operate on workspace data.
        const workspaceId = (args as Record<string, unknown>).workspace_id as string | undefined

        // Build the avatar tool invocation payload
        const payload = {
          tool_name: name,
          tool_args: args,
        }

        // Call the avatar tool execution endpoint
        const path = workspaceId
          ? `/workspaces/${workspaceId}/ai/avatar/tool`
          : '/ai/avatar/tool'

        try {
          const data = await client.post<Record<string, unknown>>(path, payload)
          return {
            content: [{ type: 'text' as const, text: JSON.stringify(data, null, 2) }],
          }
        } catch (err) {
          return {
            content: [{
              type: 'text' as const,
              text: `Avatar tool error: ${err instanceof Error ? err.message : String(err)}`,
            }],
            isError: true,
          }
        }
      },
    )
  }

  console.error(`[avatar] Successfully registered ${schemas.tools.length} avatar tools`)
}
