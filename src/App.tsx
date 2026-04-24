import { Route, Switch } from 'wouter'
import Navbar from '@/components/Navbar'
import Footer from '@/components/Footer'
import Business from '@/pages/Business'
import Career from '@/pages/Career'
import Personal from '@/pages/Personal'
import ProjectDetail from '@/pages/ProjectDetail'
import SignInPage from '@/auth/SignInPage'
import RequireAdmin from '@/auth/RequireAdmin'
import AdminLayout from '@/pages/admin/AdminLayout'
import AdminHome from '@/pages/admin/AdminHome'
import AdminContent from '@/pages/admin/AdminContent'
import AdminAldric from '@/pages/admin/AdminAldric'
import AdminDashboards from '@/pages/admin/AdminDashboards'

function App() {
  return (
    <Switch>
      {/* Sign-in — Clerk component handles its own sub-routes */}
      <Route path="/sign-in/:rest*">
        <SignInPage />
      </Route>

      {/* Admin tree — all protected by RequireAdmin */}
      <Route path="/admin/:rest*">
        <RequireAdmin>
          <AdminLayout>
            <Switch>
              <Route path="/admin" component={AdminHome} />
              <Route path="/admin/content" component={AdminContent} />
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
