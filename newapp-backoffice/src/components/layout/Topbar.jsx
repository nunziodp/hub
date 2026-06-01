import { Link, useLocation, useNavigate } from 'react-router-dom'
import { Bell, LogOut } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { useAuth } from '@/hooks/useAuth'
import { ROUTES } from '@/constants/routes'

// Mappa segmenti URL → etichette breadcrumb in italiano
const BREADCRUMB_LABELS = {
  dashboard:    'Dashboard',
  campagne:     'Campagne',
  rdv:          'RDV',
  tutte:        'Tutte',
  attive:       'Attive nel mese',
  fatturazione: 'Fatturazione',
  statistiche:  'Statistiche',
  fonti:        'Performance fonti',
  gdpr:         'Report GDPR',
  lead:         'Lead',
  revisione:    'In revisione',
  riciclo:      'In riciclo',
  'liste-fredde': 'Liste fredde',
  importa:      'Importa lista',
}

function buildCrumbs(pathname) {
  const segments = pathname.split('/').filter(Boolean)
  return segments.map((seg, idx) => {
    const href = '/' + segments.slice(0, idx + 1).join('/')
    const label = BREADCRUMB_LABELS[seg] ?? seg
    return { href, label }
  })
}

export function Topbar() {
  const { user, signOut } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const crumbs = buildCrumbs(location.pathname)

  async function handleLogout() {
    await signOut()
    navigate(ROUTES.LOGIN, { replace: true })
  }

  const userName =
    user?.user_metadata?.full_name ?? user?.email ?? 'Utente'

  return (
    <header className="fixed inset-x-0 top-0 z-50 flex h-14 items-center justify-between border-b border-border bg-card px-4">
      <div className="flex items-center gap-4">
        <Link
          to={ROUTES.DASHBOARD}
          className="flex items-center gap-2 font-semibold text-foreground"
        >
          <span className="flex h-7 w-7 items-center justify-center rounded-md bg-brand-600 text-xs font-bold text-white">
            N
          </span>
          NewApp
        </Link>
        {crumbs.length > 0 && (
          <nav
            aria-label="breadcrumb"
            className="hidden items-center gap-1 text-sm text-muted-foreground md:flex"
          >
            <span>/</span>
            {crumbs.map((c, i) => (
              <span key={c.href} className="flex items-center gap-1">
                {i > 0 && <span>/</span>}
                <Link
                  to={c.href}
                  className="hover:text-foreground"
                >
                  {c.label}
                </Link>
              </span>
            ))}
          </nav>
        )}
      </div>

      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" aria-label="Notifiche">
          <Bell className="h-4 w-4" />
        </Button>
        <div className="hidden text-sm text-muted-foreground md:block">
          {userName}
        </div>
        <Button
          variant="ghost"
          size="icon"
          onClick={handleLogout}
          aria-label="Logout"
        >
          <LogOut className="h-4 w-4" />
        </Button>
      </div>
    </header>
  )
}
