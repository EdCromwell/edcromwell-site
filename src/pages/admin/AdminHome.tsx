import { useUser } from '@clerk/clerk-react'
import { Link } from 'wouter'
import { FileText, Activity, LayoutDashboard, ArrowUpRight } from 'lucide-react'

const cards = [
  {
    href: '/admin/content',
    icon: FileText,
    title: 'Site Content',
    body: 'Edit project cards, gallery items, and copy. Changes commit to GitHub and auto-deploy via Vercel.',
    status: 'Phase 2 — coming next',
  },
  {
    href: '/admin/aldric',
    icon: Activity,
    title: 'Aldric Control',
    body: 'Agent status, recent task log, log viewer, restart controls. Live data from the Mac Mini.',
    status: 'Phase 3 — coming soon',
  },
  {
    href: '/admin/dashboards',
    icon: LayoutDashboard,
    title: 'Dashboards',
    body: 'Embedded views of Ledger / Forge / Lumen / Aldric dashboards, routed through Cloudflare Tunnel.',
    status: 'Phase 3 — coming soon',
  },
]

export default function AdminHome() {
  const { user } = useUser()
  const firstName = user?.firstName ?? 'Ed'

  return (
    <div>
      <div className="mb-10">
        <h1 className="font-heading text-4xl uppercase tracking-widest text-cream mb-2">
          Welcome back, {firstName}
        </h1>
        <p className="font-body text-cream/60">
          This is your private command center. Every section below will come
          online as the Phase 2/3 work lands.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        {cards.map((card) => {
          const Icon = card.icon
          return (
            <Link key={card.href} href={card.href}>
              <div className="group bg-card border border-border rounded p-5 cursor-pointer hover:border-gold/40 transition-colors h-full flex flex-col">
                <div className="flex items-start justify-between mb-4">
                  <div className="w-10 h-10 rounded bg-warm/30 flex items-center justify-center text-gold">
                    <Icon size={20} />
                  </div>
                  <ArrowUpRight
                    size={16}
                    className="text-cream/30 group-hover:text-gold transition-colors"
                  />
                </div>
                <h2 className="font-heading text-xl uppercase tracking-wider text-cream mb-2">
                  {card.title}
                </h2>
                <p className="font-body text-sm text-cream/60 leading-relaxed flex-1">
                  {card.body}
                </p>
                <div className="mt-4 pt-4 border-t border-border">
                  <span className="font-body text-xs uppercase tracking-widest text-cream/40">
                    {card.status}
                  </span>
                </div>
              </div>
            </Link>
          )
        })}
      </div>

      <div className="mt-10 bg-card border border-border rounded p-5">
        <h3 className="font-heading text-sm uppercase tracking-widest text-cream/70 mb-3">
          Build Status
        </h3>
        <ul className="font-body text-sm text-cream/70 space-y-2">
          <li>
            <span className="text-gold">✓</span> Phase 1 — Clerk auth, admin shell, content extracted to JSON
          </li>
          <li>
            <span className="text-cream/30">○</span> Phase 2 — Content editor UI + GitHub commit API
          </li>
          <li>
            <span className="text-cream/30">○</span> Phase 3 — Mac Mini API + Cloudflare Tunnel + reverse proxy
          </li>
        </ul>
      </div>
    </div>
  )
}
