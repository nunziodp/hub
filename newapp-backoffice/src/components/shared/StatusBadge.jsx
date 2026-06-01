import { cn } from '@/lib/utils'

// Mappa stato → classi Tailwind (sezione 8 della spec)
// Copre stati RDV (attiva/sospesa/in_prova/archiviata) e stati lead
const STATO_COLORS = {
  // Stati RDV
  attiva:      'bg-green-100 text-green-700',
  sospesa:     'bg-amber-100 text-amber-700',
  in_prova:    'bg-blue-100 text-blue-700',
  archiviata:  'bg-slate-100 text-slate-600',

  // Stati sub-campagna
  in_pausa:    'bg-amber-100 text-amber-700',

  // Stati lead
  RICEVUTA:        'bg-slate-100 text-slate-600',
  DISPONIBILE:     'bg-blue-100 text-blue-700',
  ASSEGNATA:       'bg-indigo-100 text-indigo-700',
  CONSEGNATA:      'bg-green-100 text-green-700',
  ERRORE_CONSEGNA: 'bg-red-100 text-red-700',
  IN_LAVORAZIONE:  'bg-sky-100 text-sky-700',
  CONTATTATA:      'bg-teal-100 text-teal-700',
  CHIUSA_WON:      'bg-emerald-100 text-emerald-700',
  CHIUSA_LOST:     'bg-rose-100 text-rose-700',
  NON_CONTATTATA:  'bg-orange-100 text-orange-700',
  IN_RICICLO:      'bg-violet-100 text-violet-700',
  RICICLATA:       'bg-purple-100 text-purple-700',
  LISTA_FREDDA:    'bg-slate-100 text-slate-600',
  SCADUTA:         'bg-zinc-100 text-zinc-600',
  BLOCCATA:        'bg-red-100 text-red-700',

  // Stati pacchetto freddo
  attivo:      'bg-green-100 text-green-700',
  venduto:     'bg-emerald-100 text-emerald-700',
  scaduto:     'bg-zinc-100 text-zinc-600',
}

// Etichette leggibili in italiano per gli stati (alcuni enum sono UPPER_SNAKE)
const STATO_LABELS = {
  in_prova:        'In prova',
  in_pausa:        'In pausa',
  ERRORE_CONSEGNA: 'Errore consegna',
  IN_LAVORAZIONE:  'In lavorazione',
  CHIUSA_WON:      'Chiusa (won)',
  CHIUSA_LOST:     'Chiusa (lost)',
  NON_CONTATTATA:  'Non contattata',
  IN_RICICLO:      'In riciclo',
  LISTA_FREDDA:    'Lista fredda',
  in_attesa:       'In attesa',
}

function humanize(stato) {
  if (STATO_LABELS[stato]) return STATO_LABELS[stato]
  return stato
    .toLowerCase()
    .replace(/_/g, ' ')
    .replace(/^./, (c) => c.toUpperCase())
}

// Pill colorata: <StatusBadge stato="CONSEGNATA" />
export function StatusBadge({ stato, className }) {
  if (!stato) return null
  const colorClasses = STATO_COLORS[stato] ?? 'bg-slate-100 text-slate-600'
  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium',
        colorClasses,
        className,
      )}
    >
      {humanize(stato)}
    </span>
  )
}
