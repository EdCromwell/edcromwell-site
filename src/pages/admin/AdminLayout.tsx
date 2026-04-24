import { ReactNode } from 'react'
import { Link, useLocation } from 'wouter'
import { UserButton } from '@clerk/clerk-react'
import { FileText, Activity, LayoutDashboard, Home } from 'lucide-react'

const navItems = [
  { href: '/admin', label: 'Home', icon: Home, exact: true },
  { href: '/admin/content', label: 'Content', icon: FileText },
  { href: '/admin/aldric', label: 'Aldric Control', icon: Activity },
  { href: '/admin/dashboards', label: 'Dashboards', icon: LayoutDashboard },
]

export default function AdminLayout({ children }: { children: ReactNode }) {
  const [location] = useLocation()

  const isActive = (href: string, exact?: boolean) =>
    exact ? location === href : location.startsWith(href)

  return (
    <div className="min-h-screen bg-bg text-cream">
      {/* Top bar */}
      <header className="border-b border-border bg-card">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <Link href="/admin">
            <div className="flex items-baseline gap-3 cursor-pointer">
              <span className="font-heading text-xl tracking-widest uppercase text-cream">
                Admin
              </span>
              <span className="font-body text-xs text-cream/40">
                edcromwell.com
              </span>
            </div>
          </Link>
          <div className="flex items-center gap-6">
            <Link href="/">
              <span className="font-body text-sm text-cream/60 hover:text-cream cursor-pointer">
                ← Back to site
              </span>
            </Link>
            <UserButton
              afterSignOutUrl="/"
              appearance={{
                elements: { avatarBox: 'w-9 h-9' },
              }}
            />
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-6 py-8 flex gap-8">
        {/* Sidebar */}
        <aside className="w-56 shrink-0">
          <nav className="sticky top-24 flex flex-col gap-1">
            {navItems.map((item) => {
              const Icon = item.icon
              const active = isActive(item.href, item.exact)
              return (
                <Link key={item.href} href={item.href}>
                  <div
                    className={`flex items-center gap-3 px-3 py-2 rounded cursor-pointer transition-colors ${
                      active
                        ? 'bg-warm/40 text-cream'
                        : 'text-cream/60 hover:text-cream hover:bg-warm/20'
                    }`}
                  >
                    <Icon size={16} />
                    <span className="font-body text-sm">{item.label}</span>
                  </div>
                </Link>
              )
            })}
          </nav>
        </aside>

        {/* Main */}
        <main className="flex-1 min-w-0">{children}</main>
      </div>
    </div>
  )
}
