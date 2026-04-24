import { Mail, Github, Linkedin, Lock } from 'lucide-react'
import { Link } from 'wouter'
import { SignedIn } from '@clerk/clerk-react'

export default function Footer() {
  return (
    <footer className="border-t border-border py-12 px-6">
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6">
        <div className="flex flex-col items-center md:items-start gap-1">
          <span className="font-heading text-lg font-bold tracking-widest text-cream uppercase">
            ED CROMWELL
          </span>
          <span className="text-cream/40 text-sm font-body">
            AI Automation & Web Development
          </span>
        </div>

        <div className="flex items-center gap-6">
          <a
            href="mailto:edwardcromwell1998@gmail.com"
            className="text-cream/40 hover:text-gold transition-colors"
            aria-label="Email"
          >
            <Mail size={18} />
          </a>
          <a
            href="https://github.com/EdCromwell?tab=repositories"
            target="_blank"
            rel="noopener noreferrer"
            className="text-cream/40 hover:text-gold transition-colors"
            aria-label="GitHub"
          >
            <Github size={18} />
          </a>
          <a
            href="https://www.linkedin.com/in/edward-cromwell/"
            target="_blank"
            rel="noopener noreferrer"
            className="text-cream/40 hover:text-gold transition-colors"
            aria-label="LinkedIn"
          >
            <Linkedin size={18} />
          </a>
          {/* Only rendered when signed in — keeps the admin entry invisible to the public */}
          <SignedIn>
            <Link href="/admin">
              <span
                className="text-cream/40 hover:text-gold transition-colors cursor-pointer"
                aria-label="Admin"
              >
                <Lock size={18} />
              </span>
            </Link>
          </SignedIn>
        </div>

        <span className="text-cream/30 text-xs font-body">
          &copy; {new Date().getFullYear()} Ed Cromwell. All rights reserved.
        </span>
      </div>
    </footer>
  )
}
