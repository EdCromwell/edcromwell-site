import { useState } from 'react'
import { ExternalLink } from 'lucide-react'

/**
 * /admin/dashboards — iframes into each Mac Mini dashboard, served through
 * Cloudflare Tunnel.
 *
 * Each dashboard has its own hostname (ledger.edcromwell.com,
 * forge.edcromwell.com, etc.) so it can stay completely path-agnostic — no
 * prefix middleware, no <base> tags, no JS shims. Cloudflared routes each
 * hostname to its local port. To add a new dashboard: append a rule to
 * /etc/cloudflared/config.yml + add the entry below.
 *
 * Auth flow: the iframe src points at the dashboard hostname directly, not
 * through /api/aldric. Cloudflare Access enforces the identity check at the
 * tunnel edge — the first iframe load will show a CF Access login (email OTP
 * or SSO depending on what you configured); once logged in, the session
 * cookie works for all *.edcromwell.com dashboards in the same Access app.
 *
 * Proxying every asset request through a Vercel function would be slow and
 * explode the function invocation bill. CF Access is the right tool for iframes.
 */

type DashboardSpec = {
  key: string
  label: string
  description: string
  hostname: string // full hostname, e.g. "ledger.edcromwell.com"
}

const DASHBOARDS: DashboardSpec[] = [
  {
    key: 'ledger',
    label: 'Ledger',
    description: 'Personal CFO — accounts, transactions, rules',
    hostname: 'ledger.edcromwell.com',
  },
  {
    key: 'aldric',
    label: 'Aldric',
    description: 'General assistant status',
    hostname: 'aldric-dash.edcromwell.com',
  },
  {
    key: 'forge',
    label: 'Forge',
    description: 'Business strategy + competitor intel',
    hostname: 'forge.edcromwell.com',
  },
  {
    key: 'lumen',
    label: 'Lumen',
    description: 'Tutoring + flashcard generation',
    hostname: 'lumen.edcromwell.com',
  },
  {
    key: 'pulse',
    label: 'Pulse',
    description: 'Pulse dashboard',
    hostname: 'pulse.edcromwell.com',
  },
  {
    key: 'store',
    label: 'Proper Supply',
    description: 'Store operations',
    hostname: 'store.edcromwell.com',
  },
]

export default function AdminDashboards() {
  const [active, setActive] = useState<string>(DASHBOARDS[0].key)
  const current = DASHBOARDS.find((d) => d.key === active) ?? DASHBOARDS[0]

  const url = `https://${current.hostname}/`

  return (
    <div>
      <div className="flex items-start justify-between mb-8 gap-4">
        <div>
          <h1 className="font-heading text-3xl uppercase tracking-widest text-cream mb-2">
            Dashboards
          </h1>
          <p className="font-body text-cream/60">
            Embedded views of the Mac Mini dashboards. First load per session
            may prompt you to log in via Cloudflare Access — email OTP to{' '}
            <span className="font-mono text-gold text-sm">
              edwardcromwell1998@gmail.com
            </span>
            .
          </p>
        </div>
        <a
          href={url}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-2 px-4 py-2 border border-border text-cream/70 hover:text-cream rounded font-body text-sm transition-colors"
        >
          <ExternalLink size={14} />
          Open in new tab
        </a>
      </div>

      {/* Tab rail */}
      <div className="flex flex-wrap gap-1 border-b border-border mb-4">
        {DASHBOARDS.map((d) => {
          const isActive = d.key === active
          return (
            <button
              key={d.key}
              type="button"
              onClick={() => setActive(d.key)}
              className={`px-4 py-2 font-heading text-xs uppercase tracking-widest transition-colors border-b-2 ${
                isActive
                  ? 'text-cream border-gold'
                  : 'text-cream/50 border-transparent hover:text-cream'
              }`}
            >
              {d.label}
            </button>
          )
        })}
      </div>

      <div className="text-xs font-body text-cream/50 mb-3">
        {current.description}
      </div>

      {/* Iframe. Key on `current.key` so switching tabs tears down and rebuilds
          the iframe rather than keeping a stale document around. */}
      <div className="border border-border rounded bg-card overflow-hidden">
        <iframe
          key={current.key}
          src={url}
          title={`${current.label} dashboard`}
          className="w-full"
          style={{ height: 'calc(100vh - 280px)', minHeight: '480px' }}
          // These dashboards are your own code; you trust them. Still, tighten
          // the sandbox a little — no top-level navigation out of the iframe.
          sandbox="allow-forms allow-scripts allow-same-origin allow-popups"
        />
      </div>
    </div>
  )
}

