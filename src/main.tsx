import React from 'react'
import ReactDOM from 'react-dom/client'
import { ClerkProvider } from '@clerk/clerk-react'
import App from './App'
import './index.css'

const PUBLISHABLE_KEY = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY

// Clerk is only required for /admin and /sign-in. If the key is missing, log a
// warning and render the rest of the site without ClerkProvider — public pages
// (Career, Business, Me, Personal) don't need auth.
if (!PUBLISHABLE_KEY) {
  // eslint-disable-next-line no-console
  console.warn(
    '[edcromwell-site] Missing VITE_CLERK_PUBLISHABLE_KEY. Admin/sign-in routes will not work. ' +
      'Add it to .env.local for dev, and to Vercel env vars for prod.',
  )
}

// Clerk appearance: tune the default UI to match the cream/brown palette.
const clerkAppearance = {
  variables: {
    colorPrimary: '#8B6914',
    colorBackground: '#FAF6F1',
    colorText: '#2C2216',
    colorTextSecondary: '#5C3D1A',
    colorInputBackground: '#F0EBE3',
    colorInputText: '#2C2216',
    fontFamily: 'Karla, sans-serif',
    borderRadius: '0.25rem',
  },
  elements: {
    formButtonPrimary:
      'bg-gold text-bg hover:bg-accent font-heading tracking-widest uppercase',
    card: 'bg-card border border-border',
    headerTitle: 'font-heading uppercase tracking-widest text-cream',
    headerSubtitle: 'font-body text-cream/70',
  },
}

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    {PUBLISHABLE_KEY ? (
      <ClerkProvider publishableKey={PUBLISHABLE_KEY} appearance={clerkAppearance}>
        <App />
      </ClerkProvider>
    ) : (
      <App />
    )}
  </React.StrictMode>,
)
