/**
 * STUB — Phase 3 will wire each card to open the live dashboard through
 * the Cloudflare Tunnel + Vercel reverse proxy.
 */
export default function AdminDashboards() {
  const dashboards = [
    { name: 'Aldric Command Center', port: 5000, path: '/', status: 'existing Flask app (app.py)' },
    { name: 'Aldric', port: 8585, path: '/', status: 'agent dashboard' },
    { name: 'Forge', port: 8586, path: '/', status: 'agent dashboard' },
    { name: 'Ledger', port: 8587, path: '/', status: 'agent dashboard' },
    { name: 'Lumen', port: 8588, path: '/', status: 'agent dashboard' },
    { name: 'Pulse', port: 8590, path: '/', status: 'arbitrage scanner' },
  ]

  return (
    <div>
      <div className="mb-8">
        <h1 className="font-heading text-3xl uppercase tracking-widest text-cream mb-2">
          Dashboards
        </h1>
        <p className="font-body text-cream/60">
          Embedded views of your Mac Mini dashboards, gated by Clerk and routed
          through a Cloudflare Tunnel. Wiring lands in Phase 3.
        </p>
      </div>

      <div className="grid gap-3 md:grid-cols-2">
        {dashboards.map((d) => (
          <div
            key={d.port}
            className="bg-card border border-border rounded p-4 flex items-start justify-between"
          >
            <div>
              <div className="font-heading text-base uppercase tracking-wider text-cream">
                {d.name}
              </div>
              <div className="font-mono text-xs text-cream/50 mt-1">
                localhost:{d.port}
                {d.path}
              </div>
              <div className="font-body text-xs text-cream/40 mt-2">
                {d.status}
              </div>
            </div>
            <span className="font-body text-xs uppercase tracking-widest text-cream/40">
              Phase 3
            </span>
          </div>
        ))}
      </div>

      <div className="mt-6 bg-card/50 border border-border border-dashed rounded p-5">
        <h3 className="font-heading text-xs uppercase tracking-widest text-cream/40 mb-2">
          Tunnel plan
        </h3>
        <p className="font-body text-sm text-cream/60 leading-relaxed">
          Cloudflare Tunnel will expose each port via a subdomain
          (e.g. <code className="font-mono text-gold">ledger.aldric.edcromwell.com</code>).
          The Vercel proxy at <code className="font-mono text-gold">/api/aldric-dashboard/:name/*</code>{' '}
          verifies the Clerk session, adds a Cloudflare Access service-token
          header, and forwards. These cards will each open an iframe pointing at
          the proxy.
        </p>
      </div>
    </div>
  )
}
