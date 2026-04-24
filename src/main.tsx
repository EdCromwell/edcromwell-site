import React from 'react'
import ReactDOM from 'react-dom/client'
import { ClerkProvider } from '@clerk/clerk-react'
import App from './App'
import './index.css'

const PUBLISHABLE_KEY = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY

if (!PUBLISHABLE_KEY) {
  throw new Error(
    'Missing VITE_CLERK_PUBLISHABLE_KEY. Add it to .env.local for dev, and to Vercel env vars for prod.',
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
    <ClerkProvider publishableKey={PUBLISHABLE_KEY} appearance={clerkAppearance}>
      <App />
    </ClerkProvider>
  </React.StrictMode>,
)
