import { cn } from '@/lib/utils'

// Header standard di ogni schermata: H1 + sottotitolo + azione primaria opzionale
// Sezione 8 della spec
export function ScreenHeader({ title, subtitle, action, className }) {
  return (
    <div className={cn('mb-6 flex items-start justify-between gap-4', className)}>
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-foreground">
          {title}
        </h1>
        {subtitle && (
          <p className="mt-1 text-sm text-muted-foreground">{subtitle}</p>
        )}
      </div>
      {action && <div className="shrink-0">{action}</div>}
    </div>
  )
}
