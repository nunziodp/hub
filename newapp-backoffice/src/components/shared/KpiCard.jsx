import { Card, CardContent } from '@/components/ui/card'
import { cn } from '@/lib/utils'

// Card KPI standard usata in Dashboard, Campagne, RDV detail, ecc.
// Props: label, value, icon (ReactNode), delta (string), deltaPositive (bool)
// Esempio: <KpiCard label="Lead prodotte" value="8.190" icon={<Zap .../>} delta="+12% vs mese prec." deltaPositive />
export function KpiCard({ label, value, icon, delta, deltaPositive, className }) {
  return (
    <Card className={cn('overflow-hidden', className)}>
      <CardContent className="p-5">
        <div className="flex items-center justify-between gap-2">
          <span className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
            {label}
          </span>
          {icon && (
            <span className="rounded-md bg-muted p-1.5 text-muted-foreground">
              {icon}
            </span>
          )}
        </div>
        <div className="mt-2 text-2xl font-semibold tabular-nums text-foreground">
          {value}
        </div>
        {delta && (
          <div
            className={cn(
              'mt-1 text-xs font-medium',
              deltaPositive ? 'text-emerald-600' : 'text-rose-600',
            )}
          >
            {delta}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
