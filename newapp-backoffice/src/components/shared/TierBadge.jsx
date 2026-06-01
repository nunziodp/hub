import { cn } from '@/lib/utils'

// Badge per il tier commerciale RDV (A/B/C)
const TIER_COLORS = {
  A: 'bg-emerald-100 text-emerald-700 border-emerald-300',
  B: 'bg-sky-100 text-sky-700 border-sky-300',
  C: 'bg-slate-100 text-slate-600 border-slate-300',
}

export function TierBadge({ tier, className }) {
  if (!tier) return <span className="text-muted-foreground">—</span>
  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-semibold',
        TIER_COLORS[tier] ?? TIER_COLORS.C,
        className,
      )}
    >
      Tier {tier}
    </span>
  )
}
