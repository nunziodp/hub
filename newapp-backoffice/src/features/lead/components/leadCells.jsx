import { Check, X, Copy } from 'lucide-react'

import { cn } from '@/lib/utils'

// Componenti-cella riutilizzabili dalle colonne di LeadTable (sezione 9.5).
// Tenuti in un file separato così LeadTable.jsx esporta solo le definizioni
// colonna (LEAD_COLUMNS), evitando il warning react-refresh.

// Valore monospaziato, opzionalmente con pulsante copia (per gli id)
export function MonoCell({ value, copyable = false }) {
  if (!value) return <span className="text-muted-foreground">—</span>
  return (
    <span className="inline-flex items-center gap-1 font-mono text-xs text-foreground">
      {value}
      {copyable && (
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation()
            navigator.clipboard?.writeText(value)
          }}
          className="text-muted-foreground hover:text-foreground"
          aria-label="Copia"
        >
          <Copy className="h-3 w-3" />
        </button>
      )}
    </span>
  )
}

// Testo troncato con tooltip nativo (title) sul valore completo
export function TruncCell({ value, width = 'max-w-[160px]', mono = false }) {
  if (!value) return <span className="text-muted-foreground">—</span>
  return (
    <span title={value} className={cn('block truncate', width, mono && 'font-mono text-xs')}>
      {value}
    </span>
  )
}

// Valore semplice con fallback "—"
export function TextCell({ value }) {
  if (value == null || value === '') return <span className="text-muted-foreground">—</span>
  return <span>{value}</span>
}

// Pill generica colorata per settore/formato/fonte
export function Pill({ value, colorClass = 'bg-slate-100 text-slate-600' }) {
  if (!value) return <span className="text-muted-foreground">—</span>
  return (
    <span className={cn('inline-flex rounded-full px-2 py-0.5 text-xs font-medium', colorClass)}>
      {value}
    </span>
  )
}

// Icona booleana verde/rosso per consent_given
export function BoolIcon({ value }) {
  return value ? (
    <Check className="h-4 w-4 text-green-600" aria-label="Sì" />
  ) : (
    <X className="h-4 w-4 text-red-600" aria-label="No" />
  )
}

// Badge verde/rosso per esito parsing
export function ParsingBadge({ ok }) {
  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium',
        ok ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700',
      )}
    >
      {ok ? 'OK' : 'FAIL'}
    </span>
  )
}

// Badge contatore ricicli (neutro a 0, ambra/rosso crescente)
export function RicicloBadge({ n }) {
  const v = n ?? 0
  const color =
    v === 0 ? 'bg-slate-100 text-slate-600' : v < 3 ? 'bg-amber-100 text-amber-700' : 'bg-red-100 text-red-700'
  return (
    <span className={cn('inline-flex min-w-[1.5rem] justify-center rounded-full px-2 py-0.5 text-xs font-semibold', color)}>
      {v}
    </span>
  )
}
