import { ReactNode } from 'react'
import { SignedIn, SignedOut, useUser } from '@clerk/clerk-react'
import { Redirect } from 'wouter'

/**
 * The single source of truth for "is this user allowed into /admin".
 *
 * Two gates:
 *   1. Clerk: user must be signed in with a verified email.
 *   2. Allowlist: email must equal VITE_ADMIN_EMAIL.
 *
 * For Phase 1 this is client-side only — good enough because there's nothing
 * sensitive behind it yet. Phase 2/3 adds server-side JWT verification in the
 * Vercel serverless functions that actually do dangerous things (commit to
 * GitHub, hit the Mac Mini, etc).
 *
 * Belt-and-suspenders: also configure Clerk in "restricted" mode (dashboard
 * setting) so only invited emails can sign in at all. See APPLY.md.
 */

const ADMIN_EMAIL =
  import.meta.env.VITE_ADMIN_EMAIL ?? 'edwardcromwell1998@gmail.com'

function AccessDenied() {
  return (
    <div className="min-h-screen bg-bg flex items-center justify-center px-6">
      <div className="max-w-md text-center">
        <h1 className="font-heading text-4xl uppercase tracking-widest text-cream mb-4">
          Not Authorized
        </h1>
        <p className="font-body text-cream/70 leading-relaxed">
          You're signed in, but this area is restricted to the site owner.
          If you think you should have access, reach out via the contact form.
        </p>
      </div>
    </div>
  )
}

export default function RequireAdmin({ children }: { children: ReactNode }) {
  return (
    <>
      <SignedOut>
        <Redirect to="/sign-in" />
      </SignedOut>
      <SignedIn>
        <AdminGate>{children}</AdminGate>
      </SignedIn>
    </>
  )
}

function AdminGate({ children }: { children: ReactNode }) {
  const { user, isLoaded } = useUser()

  if (!isLoaded) {
    return (
      <div className="min-h-screen bg-bg flex items-center justify-center">
        <span className="font-heading tracking-widest uppercase text-cream/40">
          Loading…
        </span>
      </div>
    )
  }

  const email = user?.primaryEmailAddress?.emailAddress?.toLowerCase()
  const verified =
    user?.primaryEmailAddress?.verification?.status === 'verified'

  if (!email || !verified || email !== ADMIN_EMAIL.toLowerCase()) {
    return <AccessDenied />
  }

  return <>{children}</>
}
