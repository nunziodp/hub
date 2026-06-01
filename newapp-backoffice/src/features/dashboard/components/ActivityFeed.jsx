import { Link } from 'react-router-dom'
import {
  AlertTriangle,
  ArrowRight,
  Send,
  RotateCcw,
  Wallet,
  AlertOctagon,
} from 'lucide-react'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { cn, formatRelative } from '@/lib/utils'

// Icona e classi per ogni tipo di evento (sezione 9.1)
const TIPO_ICONA = {
  lead_consegnata:  { icon: Send,          color: 'text-emerald-600 bg-emerald-50' },
  parsing_fallito:  { icon: AlertTriangle, color: 'text-red-600 bg-red-50' },
  lead_riciclata:   { icon: RotateCcw,     color: 'text-violet-600 bg-violet-50' },
  credito_esaurito: { icon: AlertOctagon,  color: 'text-amber-600 bg-amber-50' },
  ricarica_wallet:  { icon: Wallet,        color: 'text-sky-600 bg-sky-50' },
}

// Calcola la destinazione di un evento (link tipo lead/rdv)
function eventHref(link) {
  if (!link?.id) return null
  if (link.tipo === 'lead') return `/lead/tutte?id=${link.id}`
  if (link.tipo === 'rdv')  return `/rdv/${link.id}`
  return null
}

// Feed eventi recenti — sezione 9.1 della spec
export function ActivityFeed({ events }) {
  return (
    <Card className="h-full">
      <CardHeader>
        <CardTitle className="text-base">Activity recente</CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        <ul className="divide-y divide-border">
          {events.map((e) => {
            const meta = TIPO_ICONA[e.tipo] ?? TIPO_ICONA.lead_consegnata
            const Icon = meta.icon
            const href = eventHref(e.link)
            const inner = (
              <div className="flex items-start gap-3 px-4 py-3">
                <span
                  className={cn(
                    'mt-0.5 inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-full',
                    meta.color,
                  )}
                >
                  <Icon className="h-3.5 w-3.5" />
                </span>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm text-foreground">
                    {e.descrizione}
                  </p>
                  <p className="mt-0.5 text-xs text-muted-foreground">
                    {formatRelative(e.at)}
                  </p>
                </div>
                {href && (
                  <ArrowRight className="mt-2 h-3.5 w-3.5 shrink-0 text-muted-foreground" />
                )}
              </div>
            )
            return (
              <li key={e.id}>
                {href ? (
                  <Link to={href} className="block hover:bg-muted/50">
                    {inner}
                  </Link>
                ) : (
                  inner
                )}
              </li>
            )
          })}
        </ul>
      </CardContent>
    </Card>
  )
}
