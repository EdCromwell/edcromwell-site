import { SignIn } from '@clerk/clerk-react'

export default function SignInPage() {
  return (
    <div className="min-h-screen bg-bg flex flex-col items-center justify-center px-6 py-16">
      <div className="mb-10 text-center">
        <h1 className="font-heading text-3xl md:text-4xl uppercase tracking-[0.25em] text-cream mb-3">
          Admin Sign In
        </h1>
        <p className="font-body text-sm text-cream/60 max-w-md mx-auto">
          This area is for the site owner. Unauthorized sign-ins will be
          refused.
        </p>
      </div>
      <SignIn
        routing="path"
        path="/sign-in"
        signUpUrl="/sign-in"
        afterSignInUrl="/admin"
        afterSignUpUrl="/admin"
      />
    </div>
  )
}
