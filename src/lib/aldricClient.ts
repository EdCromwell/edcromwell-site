/**
 * Tiny API helper for the admin /admin/aldric surface.
 *
 * All calls go to /api/aldric/* which is the Vercel reverse-proxy serverless
 * function. That function takes care of Clerk JWT verification + forwarding
 * to the Mac Mini via Cloudflare Tunnel.
 *
 * Callers must provide a getToken fn sourced from Clerk's useAuth hook —
 * this helper does NOT reach into Clerk directly so it stays testable and
 * lets pages render static shells before auth resolves.
 */

export type ServiceStatus = {
  key: string
  label: string
  description: string
  launchd: string
  port: number
  log_stem: string
  launchd_state: string
  pid: number | null
  port_listening: boolean
}

export type LogsResponse = {
  service: string
  stream: 'stdout' | 'stderr'
  path?: string
  lines: string[]
  note?: string
}

export type TaskEntry = Record<string, unknown>

type Fetcher = () => Promise<string | null>

export class AldricClient {
  constructor(private getToken: Fetcher) {}

  private async call<T>(
    path: string,
    init: RequestInit = {},
  ): Promise<T> {
    const token = await this.getToken()
    if (!token) {
      throw new Error('Not signed in')
    }
    const res = await fetch(`/api/aldric/${path}`, {
      ...init,
      headers: {
        ...(init.headers ?? {}),
        Authorization: `Bearer ${token}`,
      },
    })
    if (!res.ok) {
      let detail = `${res.status} ${res.statusText}`
      try {
        const body = await res.json()
        if (body?.error) detail = body.error
      } catch {
        /* non-JSON error body, keep the status text */
      }
      throw new Error(detail)
    }
    return (await res.json()) as T
  }

  listServices() {
    return this.call<{ services: ServiceStatus[] }>('services')
  }

  getLogs(key: string, lines = 200, stream: 'stdout' | 'stderr' = 'stdout') {
    const qs = new URLSearchParams({ lines: String(lines), stream })
    return this.call<LogsResponse>(`services/${key}/logs?${qs}`)
  }

  restartService(key: string) {
    return this.call<{ service: string; restarted: boolean }>(
      `services/${key}/restart`,
      { method: 'POST' },
    )
  }

  recentTasks(limit = 20) {
    return this.call<{ tasks: TaskEntry[] }>(`tasks/recent?limit=${limit}`)
  }
}
