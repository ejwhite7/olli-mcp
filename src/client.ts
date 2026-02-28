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
    this.baseUrl = (process.env.OLLI_BASE_URL ?? 'https://api.olli.social/api/v1').replace(/\/$/, '')
  }

  private async request<T>(
    method: 'GET' | 'POST' | 'PATCH' | 'DELETE',
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
