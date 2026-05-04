import { useCallback, useEffect, useMemo, useState } from 'react'
import { useAuth } from '@clerk/clerk-react'
import {
  Activity,
  AlertCircle,
  CheckCircle2,
  Circle,
  RefreshCw,
  RotateCw,
  Terminal,
  X,
} from 'lucide-react'
import {
  AldricClient,
  LogsResponse,
  ServiceStatus,
} from '@/lib/aldricClient'

/**
 * /admin/aldric — live control surface for the Mac Mini agent fleet.
 *
 * This page is deliberately read-heavy: status cards across the top, per-
 * service log drawer below, restart button gated behind a confirm. It's
 * designed for the "is everything running? what did Ledger say this morning?
 * let me bounce the stuck one" flow, not task kickoff (Discord still owns
 * that).
 *
 * Every fetch goes through /api/aldric/* which validates your Clerk session
 * server-side before talking to the Mac Mini. Failure modes surface in the
 * status banner — they don't silently fail because a dashboard that lies is
 * worse than no dashboard.
 */
export default function AdminAldric() {
  const { getToken } = useAuth()
  const client = useMemo(() => new AldricClient(() => getToken()), [getToken])

  const [services, setServices] = useState<ServiceStatus[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [lastFetched, setLastFetched] = useState<Date | null>(null)
  const [restarting, setRestarting] = useState<string | null>(null)
  const [selectedLogs, setSelectedLogs] = useState<string | null>(null)

  const refresh = useCallback(async () => {
    setError(null)
    try {
      const { services } = await client.listServices()
      setServices(services)
      setLastFetched(new Date())
    } catch (err: any) {
      setError(err?.message ?? 'Failed to reach admin API')
    } finally {
      setLoading(false)
    }
  }, [client])

  // Initial load + 30s auto-refresh. Poll interval is a compromise: short
  // enough that a crashed service is noticed quickly, long enough not to
  // hammer the tunnel or blow through Vercel function invocations.
  useEffect(() => {
    refresh()
    const id = setInterval(refresh, 30_000)
    return () => clearInterval(id)
  }, [refresh])

  const restart = async (key: string, label: string) => {
    if (!window.confirm(`Restart ${label}? Running tasks will be interrupted.`)) {
      return
    }
    setRestarting(key)
    try {
      await client.restartService(key)
      // Small delay to let launchctl flip state, then refresh.
      setTimeout(refresh, 1_500)
    } catch (err: any) {
      setError(err?.message ?? `Failed to restart ${label}`)
    } finally {
      setRestarting(null)
    }
  }

  return (
    <div>
      {/* Header */}
      <div className="flex items-start justify-between mb-8 gap-4">
        <div>
          <h1 className="font-heading text-3xl uppercase tracking-widest text-cream mb-2">
            Aldric Control
          </h1>
          <p className="font-body text-cream/60">
            Live view of the agent fleet running on the Mac Mini. All calls go
            through Cloudflare Tunnel; this page itself stays on Vercel.
          </p>
        </div>
        <div className="flex items-center gap-3">
          {lastFetched && (
            <span className="font-mono text-xs text-cream/40">
              Updated {formatClock(lastFetched)}
            </span>
          )}
          <button
            type="button"
            onClick={refresh}
            disabled={loading}
            className="flex items-center gap-2 px-4 py-2 border border-border text-cream/70 hover:text-cream rounded font-body text-sm transition-colors disabled:opacity-40"
          >
            <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
            Refresh
          </button>
        </div>
      </div>

      {/* Error banner */}
      {error && (
        <div className="flex items-center gap-2 p-3 mb-6 bg-red-500/10 border border-red-500/30 rounded">
          <AlertCircle size={16} className="text-red-400" />
          <span className="font-body text-sm text-red-200">{error}</span>
        </div>
      )}

      {/* Service grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {services.map((svc) => (
          <ServiceCard
            key={svc.key}
            svc={svc}
            restarting={restarting === svc.key}
            onRestart={() => restart(svc.key, svc.label)}
            onViewLogs={() => setSelectedLogs(svc.key)}
          />
        ))}
        {!loading && services.length === 0 && !error && (
          <div className="col-span-full p-6 border border-dashed border-border rounded text-center">
            <p className="font-body text-cream/50">
              No services reported. Check that admin_api.py is running on the
              Mac Mini and the tunnel is up.
            </p>
          </div>
        )}
      </div>

      {/* Logs drawer */}
      {selectedLogs && (
        <LogsDrawer
          client={client}
          serviceKey={selectedLogs}
          onClose={() => setSelectedLogs(null)}
        />
      )}
    </div>
  )
}

// ───────── Service card ──────────────────────────────────────────────────

function ServiceCard({
  svc,
  restarting,
  onRestart,
  onViewLogs,
}: {
  svc: ServiceStatus
  restarting: boolean
  onRestart: () => void
  onViewLogs: () => void
}) {
  const healthy = svc.port_listening && svc.launchd_state === 'running'
  return (
    <div className="p-4 bg-card border border-border rounded flex flex-col gap-3">
      <div className="flex items-start justify-between gap-2">
        <div>
          <div className="flex items-center gap-2">
            <Activity size={14} className="text-cream/40" />
            <h3 className="font-heading text-base uppercase tracking-wider text-cream">
              {svc.label}
            </h3>
          </div>
          <p className="font-body text-xs text-cream/50 mt-0.5">
            {svc.description}
          </p>
        </div>
        <StatusPill healthy={healthy} state={svc.launchd_state} />
      </div>

      <dl className="grid grid-cols-2 gap-x-3 gap-y-1 text-xs font-mono">
        <dt className="text-cream/40">pid</dt>
        <dd className="text-cream/80">{svc.pid ?? '—'}</dd>
        <dt className="text-cream/40">port</dt>
        <dd className="text-cream/80">{svc.port}</dd>
        <dt className="text-cream/40">listening</dt>
        <dd className={svc.port_listening ? 'text-gold' : 'text-red-400'}>
          {svc.port_listening ? 'yes' : 'no'}
        </dd>
      </dl>

      <div className="flex items-center gap-2 pt-2 border-t border-border">
        <button
          type="button"
          onClick={onViewLogs}
          className="flex-1 flex items-center justify-center gap-2 px-3 py-1.5 border border-border hover:border-gold/60 text-cream/70 hover:text-cream rounded font-body text-xs transition-colors"
        >
          <Terminal size={12} />
          Logs
        </button>
        <button
          type="button"
          onClick={onRestart}
          disabled={restarting}
          className="flex-1 flex items-center justify-center gap-2 px-3 py-1.5 bg-warm/30 hover:bg-warm/50 text-cream rounded font-body text-xs transition-colors disabled:opacity-40"
        >
          <RotateCw size={12} className={restarting ? 'animate-spin' : ''} />
          {restarting ? 'Restarting…' : 'Restart'}
        </button>
      </div>
    </div>
  )
}

function StatusPill({ healthy, state }: { healthy: boolean; state: string }) {
  if (healthy) {
    return (
      <span className="inline-flex items-center gap-1.5 px-2 py-0.5 bg-gold/10 border border-gold/30 rounded-full text-xs font-body text-gold">
        <CheckCircle2 size={10} />
        healthy
      </span>
    )
  }
  return (
    <span className="inline-flex items-center gap-1.5 px-2 py-0.5 bg-red-500/10 border border-red-500/30 rounded-full text-xs font-body text-red-300">
      <Circle size={8} className="fill-red-400 text-red-400" />
      {state}
    </span>
  )
}

// ───────── Logs drawer (modal) ───────────────────────────────────────────

function LogsDrawer({
  client,
  serviceKey,
  onClose,
}: {
  client: AldricClient
  serviceKey: string
  onClose: () => void
}) {
  const [stream, setStream] = useState<'stdout' | 'stderr'>('stdout')
  const [data, setData] = useState<LogsResponse | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const load = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await client.getLogs(serviceKey, 500, stream)
      setData(res)
    } catch (err: any) {
      setError(err?.message ?? 'Failed to load logs')
    } finally {
      setLoading(false)
    }
  }, [client, serviceKey, stream])

  useEffect(() => {
    load()
  }, [load])

  return (
    <div
      className="fixed inset-0 z-50 bg-black/60 flex items-end md:items-center justify-center p-4"
      onClick={onClose}
    >
      <div
        className="w-full max-w-4xl max-h-[85vh] bg-bg border border-border rounded-lg flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between p-4 border-b border-border">
          <div>
            <h2 className="font-heading text-lg uppercase tracking-widest text-cream">
              {serviceKey} logs
            </h2>
            {data?.path && (
              <p className="font-mono text-xs text-cream/40 mt-0.5">
                {data.path}
              </p>
            )}
          </div>
          <div className="flex items-center gap-2">
            <div className="flex border border-border rounded overflow-hidden text-xs font-mono">
              {(['stdout', 'stderr'] as const).map((s) => (
                <button
                  key={s}
                  type="button"
                  onClick={() => setStream(s)}
                  className={`px-3 py-1.5 transition-colors ${
                    stream === s
                      ? 'bg-warm/40 text-cream'
                      : 'text-cream/50 hover:text-cream'
                  }`}
                >
                  {s}
                </button>
              ))}
            </div>
            <button
              type="button"
              onClick={load}
              disabled={loading}
              className="p-2 border border-border text-cream/60 hover:text-cream rounded disabled:opacity-40"
              aria-label="Refresh"
            >
              <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
            </button>
            <button
              type="button"
              onClick={onClose}
              className="p-2 border border-border text-cream/60 hover:text-cream rounded"
              aria-label="Close"
            >
              <X size={14} />
            </button>
          </div>
        </div>
        <div className="flex-1 overflow-auto p-3 font-mono text-xs text-cream/80 bg-card">
          {error ? (
            <p className="text-red-300">{error}</p>
          ) : loading ? (
            <p className="text-cream/40">Loading…</p>
          ) : data?.lines.length ? (
            <pre className="whitespace-pre-wrap break-all">
              {data.lines.join('\n')}
            </pre>
          ) : (
            <p className="text-cream/40">
              {data?.note ?? 'Log file is empty.'}
            </p>
          )}
        </div>
      </div>
    </div>
  )
}

function formatClock(d: Date) {
  return d.toLocaleTimeString([], {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false,
  })
}
