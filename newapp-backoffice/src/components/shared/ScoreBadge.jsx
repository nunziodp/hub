import { cn } from '@/lib/utils'

// Mappa fascia → classi Tailwind (sezione 8 della spec)
const FASCIA_COLORS = {
  PLATINUM: 'bg-violet-100 text-violet-700 border-violet-300',
  GOLD:     'bg-amber-100  text-amber-700  border-amber-300',
  SILVER:   'bg-slate-100  text-slate-600  border-slate-300',
  RECYCLE:  'bg-red-50     text-red-600    border-red-200',
}

// Badge per fascia di scoring lead
// Props: fascia ('PLATINUM' | 'GOLD' | 'SILVER' | 'RECYCLE'), score (number opzionale)
export function ScoreBadge({ fascia, score, className }) {
  if (!fascia) return null
  const colorClasses = FASCIA_COLORS[fascia] ?? FASCIA_COLORS.SILVER
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-xs font-semibold',
        colorClasses,
        className,
      )}
    >
      {fascia}
      {typeof score === 'number' && (
        <span className="font-normal opacity-75">· {score}</span>
      )}
    </span>
  )
}
