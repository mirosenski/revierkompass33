import { createRootRoute, Outlet, useLocation } from '@tanstack/react-router'
import { TanStackRouterDevtools } from '@tanstack/router-devtools'
import { Header, Footer, Breadcrumb, BackToTop } from '../components/layout'

export const Route = createRootRoute({
  component: RootComponent,
})

function RootComponent() {
  const location = useLocation()
  
  // Breadcrumb auf allen Seiten außer der Home-Seite anzeigen
  const showBreadcrumb = location.pathname !== '/'

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      {showBreadcrumb && <Breadcrumb />}
      <main className="flex-1">
        <Outlet />
      </main>
      <Footer />
      <BackToTop />
      <TanStackRouterDevtools />
    </div>
  )
} 