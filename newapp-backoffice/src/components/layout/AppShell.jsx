import { Navigate, Outlet, useLocation } from 'react-router-dom'
import { Loader2 } from 'lucide-react'

import { Sidebar } from '@/components/layout/Sidebar'
import { Topbar } from '@/components/layout/Topbar'
import { useAuth } from '@/hooks/useAuth'
import { useRealtime } from '@/hooks/useRealtime'
import { ROUTES } from '@/constants/routes'

// Layout principale dell'applicazione — sezione 4 della spec.
// Funge anche da AuthGuard: redirige a /login se l'utente non è autenticato.
export default function AppShell() {
  const { user, loading } = useAuth()
  const location = useLocation()

  // Sottoscrizioni realtime (no-op in mock-mode)
  useRealtime()

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    )
  }

  if (!user) {
    return <Navigate to={ROUTES.LOGIN} replace state={{ from: location }} />
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <Topbar />
      <Sidebar />
      <main className="ml-0 overflow-y-auto px-6 py-6 pt-20 md:ml-60">
        <Outlet />
      </main>
    </div>
  )
}
