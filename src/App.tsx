import { Route, Switch } from 'wouter'
import Navbar from '@/components/Navbar'
import Footer from '@/components/Footer'
import Business from '@/pages/Business'
import Career from '@/pages/Career'
import Personal from '@/pages/Personal'
import Me from '@/pages/Me'
import ProjectDetail from '@/pages/ProjectDetail'
import SignInPage from '@/auth/SignInPage'
import RequireAdmin from '@/auth/RequireAdmin'
import AdminLayout from '@/pages/admin/AdminLayout'
import AdminHome from '@/pages/admin/AdminHome'
import AdminContent from '@/pages/admin/AdminContent'
import AdminMe from '@/pages/admin/AdminMe'
import AdminAldric from '@/pages/admin/AdminAldric'
import AdminDashboards from '@/pages/admin/AdminDashboards'

function App() {
  // Host-based routing — `me.edcromwell.com` serves the Me page directly,
  // bypassing the rest of the site. Falls back to path-based `/me` for
  // local dev.
  if (typeof window !== 'undefined' && window.location.hostname.startsWith('me.')) {
    return <Me />
  }

  return (
    <Switch>
      {/* Sign-in — Clerk component handles its own sub-routes.
          Two routes because wouter's "/sign-in/:rest*" requires a trailing
          slash; we need both "/sign-in" (the initial visit) and the subpaths
          Clerk navigates to like "/sign-in/factor-one". */}
      <Route path="/sign-in">
        <SignInPage />
      </Route>
      <Route path="/sign-in/:rest*">
        <SignInPage />
      </Route>

      {/* Admin tree — all protected by RequireAdmin.
          Same double-route trick: "/admin" bare, then subpaths. */}
      <Route path="/admin">
        <RequireAdmin>
          <AdminLayout>
            <AdminHome />
          </AdminLayout>
        </RequireAdmin>
      </Route>
      <Route path="/admin/:rest*">
        <RequireAdmin>
          <AdminLayout>
            <Switch>
              <Route path="/admin" component={AdminHome} />
              <Route path="/admin/content" component={AdminContent} />
              <Route path="/admin/me" component={AdminMe} />
              <Route path="/admin/aldric" component={AdminAldric} />
              <Route path="/admin/dashboards" component={AdminDashboards} />
              <Route>
                <div className="py-16 text-center">
                  <h2 className="font-heading text-2xl uppercase tracking-widest text-cream/50">
                    Admin page not found
                  </h2>
                </div>
              </Route>
            </Switch>
          </AdminLayout>
        </RequireAdmin>
      </Route>

      {/* Personal gallery — intentionally unlinked, no auth required (by design) */}
      <Route path="/personal">
        <Personal />
      </Route>

      {/* Me — music + photo curation hub. Lives at me.edcromwell.com via
          host-based routing above; this path is for local dev. */}
      <Route path="/me">
        <Me />
      </Route>

      {/* Public site */}
      <Route>
        {() => (
          <div className="min-h-screen flex flex-col">
            <Navbar />
            <main className="flex-1">
              <Switch>
                <Route path="/" component={Career} />
                <Route path="/business" component={Business} />
                <Route path="/project/:slug" component={ProjectDetail} />
                <Route>
                  <div className="flex items-center justify-center min-h-[60vh]">
                    <h1 className="font-heading text-4xl uppercase text-cream/50">
                      404 — Page Not Found
                    </h1>
                  </div>
                </Route>
              </Switch>
            </main>
            <Footer />
          </div>
        )}
      </Route>
    </Switch>
  )
}

export default App
