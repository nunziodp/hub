import { ChevronRight, AlertTriangle } from 'lucide-react'

import { cn, formatCurrency, formatNumber, formatRelative } from '@/lib/utils'
import { StatusBadge } from '@/components/shared/StatusBadge'
import { SubCampagnaDetail } from './SubCampagnaDetail'

// Riga di livello 2 (sezione 9.2): sub-campagna espandibile.
// Mostra formato, lead, CPL, stato e l'eventuale alert di anomalia.
export function SubCampagnaRow({ subCampagna, isOpen, onToggle }) {
  return (
    <div className="border-t border-border first:border-t-0">
      <button
        type="button"
        onClick={onToggle}
        aria-expanded={isOpen}
        className="flex w-full items-center gap-3 px-4 py-3 text-left transition-colors hover:bg-muted/40"
      >
        <ChevronRight
          className={cn('h-4 w-4 shrink-0 text-muted-foreground transition-transform', isOpen && 'rotate-90')}
        />

        <span className="min-w-0 flex-1 truncate font-medium text-foreground">
          {subCampagna.nome}
        </span>

        {/* Alert anomalia: nessuna lead oltre la soglia ore */}
        {subCampagna.anomalia && (
          <span
            className="inline-flex items-center text-amber-500"
            title={
              subCampagna.ultimo_lead_at
                ? `Ultima lead ${formatRelative(subCampagna.ultimo_lead_at)} (soglia ${subCampagna.soglia_alert_ore}h)`
                : `Nessuna lead ricevuta (soglia ${subCampagna.soglia_alert_ore}h)`
            }
          >
            <AlertTriangle className="h-4 w-4" />
          </span>
        )}

        <span className="inline-flex rounded-full bg-indigo-100 px-2 py-0.5 text-xs font-medium text-indigo-700">
          {subCampagna.formato}
        </span>
        <span className="hidden w-24 text-right text-sm tabular-nums text-muted-foreground sm:block">
          {formatNumber(subCampagna.lead_30gg)} lead
        </span>
        <span className="hidden w-28 text-right text-sm tabular-nums text-muted-foreground sm:block">
          CPL {formatCurrency(subCampagna.cpl)}
        </span>
        <StatusBadge stato={subCampagna.stato} />
      </button>

      {/* Espansione animata */}
      <div
        className={cn(
          'grid transition-all duration-200 ease-out',
          isOpen ? 'grid-rows-[1fr] opacity-100' : 'grid-rows-[0fr] opacity-0',
        )}
      >
        <div className="overflow-hidden">{isOpen && <SubCampagnaDetail subCampagna={subCampagna} />}</div>
      </div>
    </div>
  )
}
