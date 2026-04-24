import { useState } from 'react'
import { Link, useLocation } from 'wouter'
import { Menu, X } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'

const navLinks = [
  { href: '/', label: 'CAREER' },
  { href: '/business', label: 'BUSINESS' },
]

export default function Navbar() {
  const [mobileOpen, setMobileOpen] = useState(false)
  const [location] = useLocation()

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-bg/80 backdrop-blur-md border-b border-border">
      <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
        <Link href="/">
          <span className="font-heading text-xl font-bold tracking-widest text-cream uppercase cursor-pointer hover:text-gold transition-colors">
            ED CROMWELL
          </span>
        </Link>

        {/* Desktop */}
        <div className="hidden md:flex items-center gap-8">
          {navLinks.map((link) => (
            <Link key={link.href} href={link.href}>
              <span
                className={`font-heading text-sm tracking-[0.2em] uppercase cursor-pointer transition-colors ${
                  location === link.href ? 'text-gold' : 'text-cream/60 hover:text-cream'
                }`}
              >
                {link.label}
              </span>
            </Link>
          ))}
        </div>

        {/* Mobile toggle */}
        <button
          className="md:hidden text-cream"
          onClick={() => setMobileOpen(!mobileOpen)}
          aria-label="Toggle menu"
        >
          {mobileOpen ? <X size={24} /> : <Menu size={24} />}
        </button>
      </div>

      {/* Mobile menu */}
      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="md:hidden bg-bg/95 backdrop-blur-md border-b border-border overflow-hidden"
          >
            <div className="px-6 py-4 flex flex-col gap-4">
              {navLinks.map((link) => (
                <Link key={link.href} href={link.href}>
                  <span
                    className={`font-heading text-lg tracking-[0.2em] uppercase cursor-pointer block ${
                      location === link.href ? 'text-gold' : 'text-cream/60'
                    }`}
                    onClick={() => setMobileOpen(false)}
                  >
                    {link.label}
                  </span>
                </Link>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </nav>
  )
}
