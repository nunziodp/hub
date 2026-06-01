import { Link } from 'react-router-dom'
import { AlertTriangle, ArrowRight, XCircle } from 'lucide-react'

import { cn } from '@/lib/utils'

// Stile colorato per livello dell'alert (sezione 9.1)
const LIVELLO_STYLES = {
  warning: {
    container: 'border-amber-200 bg-amber-50 text-amber-900',
    icon: 'text-amber-600',
    link:  'text-amber-700 hover:text-amber-900',
  },
  error: {
    container: 'border-red-200 bg-red-50 text-red-900',
    icon: 'text-red-600',
    link:  'text-red-700 hover:text-red-900',
  },
}

const LIVELLO_ICON = {
  warning: AlertTriangle,
  error:   XCircle,
}

// Mostra i banner condizionali in cima alla dashboard.
// `alerts` è un array di { id, livello, messaggio, dettaglio?, href, cta }
export function AlertBanner({ alerts }) {
  if (!alerts || alerts.length === 0) return null

  return (
    <div className="space-y-3">
      {alerts.map((a) => {
        const style = LIVELLO_STYLES[a.livello] ?? LIVELLO_STYLES.warning
        const Icon = LIVELLO_ICON[a.livello] ?? AlertTriangle
        return (
          <div
            key={a.id}
            className={cn(
              'flex items-start gap-3 rounded-lg border px-4 py-3 text-sm',
              style.container,
            )}
          >
            <Icon className={cn('mt-0.5 h-5 w-5 shrink-0', style.icon)} />
            <div className="flex-1">
              <p className="font-medium">{a.messaggio}</p>
              {a.dettaglio && (
                <p className="mt-0.5 text-xs opacity-80">{a.dettaglio}</p>
              )}
            </div>
            {a.href && (
              <Link
                to={a.href}
                className={cn(
                  'inline-flex shrink-0 items-center gap-1 text-xs font-semibold',
                  style.link,
                )}
              >
                {a.cta ?? 'Apri'}
                <ArrowRight className="h-3 w-3" />
              </Link>
            )}
          </div>
        )
      })}
    </div>
  )
}
