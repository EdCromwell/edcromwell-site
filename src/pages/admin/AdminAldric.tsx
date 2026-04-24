/**
 * STUB — Phase 3 will replace this with a live control surface.
 *
 * What's coming:
 *   - Agent status cards (Ledger / Forge / Lumen / Aldric / Discord router)
 *     pulled from GET /api/aldric/agents/status (Vercel fn → Cloudflare Tunnel
 *     → FastAPI on Mac Mini → `launchctl list | grep aldric`).
 *   - Recent task log from memory/task_log.md.
 *   - Per-agent log viewer with tail + follow mode.
 *   - Restart buttons with confirm modals.
 *   - Manual task trigger form.
 */
export default function AdminAldric() {
  return (
    <div>
      <div className="mb-8">
        <h1 className="font-heading text-3xl uppercase tracking-widest text-cream mb-2">
          Aldric Control
        </h1>
        <p className="font-body text-cream/60">
          Live status and control for the Mac Mini agent crew. Backend lands in
          Phase 3 — Cloudflare Tunnel + FastAPI + Vercel reverse proxy.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 mb-6">
        {[
          { name: 'Ledger', domain: 'Finance', model: 'qwen2.5:32b', port: 8587 },
          { name: 'Forge', domain: 'Business', model: 'qwen2.5:32b', port: 8586 },
          { name: 'Lumen', domain: 'Education', model: 'gemma3:27b', port: 8588 },
          { name: 'Aldric', domain: 'General', model: 'llama3.1:8b', port: 8585 },
        ].map((agent) => (
          <div
            key={agent.name}
            className="bg-card border border-border rounded p-5"
          >
            <div className="flex items-start justify-between mb-3">
              <div>
                <div className="font-heading text-lg uppercase tracking-wider text-cream">
                  {agent.name}
                </div>
                <div className="font-body text-xs text-cream/50">
                  {agent.domain}
                </div>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-cream/20" />
                <span className="font-body text-xs text-cream/40 uppercase tracking-wider">
                  Pending
                </span>
              </div>
            </div>
            <div className="font-mono text-xs text-cream/50 space-y-1">
              <div>model: {agent.model}</div>
              <div>port: {agent.port}</div>
            </div>
          </div>
        ))}
      </div>

      <div className="bg-card/50 border border-border border-dashed rounded p-5">
        <h3 className="font-heading text-xs uppercase tracking-widest text-cream/40 mb-2">
          Phase 3 preview
        </h3>
        <p className="font-body text-sm text-cream/60 leading-relaxed">
          Status dots go green once <code className="font-mono text-gold">admin_api.py</code>{' '}
          is running on the Mac Mini behind the Cloudflare Tunnel, and the Vercel
          serverless proxy at <code className="font-mono text-gold">/api/aldric/*</code>{' '}
          is deployed. 10-second polling for status, on-demand tail for logs.
        </p>
      </div>
    </div>
  )
}
