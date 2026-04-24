import { Route, Switch } from 'wouter'
import Navbar from '@/components/Navbar'
import Footer from '@/components/Footer'
import Business from '@/pages/Business'
import Career from '@/pages/Career'
import Personal from '@/pages/Personal'
import ProjectDetail from '@/pages/ProjectDetail'

function App() {
  return (
    <Switch>
      <Route path="/personal">
        <Personal />
      </Route>
      <Route>
        {(params) => (
          <div className="min-h-screen flex flex-col">
            <Navbar />
            <main className="flex-1">
              <Switch>
                <Route path="/" component={Career} />
                <Route path="/business" component={Business} />
                <Route path="/project/:slug" component={ProjectDetail} />
                <Route>
                  <div className="flex items-center justify-center min-h-[60vh]">
                    <h1 className="font-heading text-4xl uppercase text-cream/50">404 — Page Not Found</h1>
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
