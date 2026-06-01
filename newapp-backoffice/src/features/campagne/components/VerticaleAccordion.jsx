import { useState } from 'react'
import { ChevronDown, Plus } from 'lucide-react'

import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { EmptyState } from '@/components/shared/EmptyState'
import { SubCampagnaRow } from './SubCampagnaRow'

// Accordion di livello 1 (sezione 9.2): un verticale con le sue sub-campagne.
// Props: verticale (arricchito con subCampagne/totale/attive), onNuovaSubCampagna(verticale)
export function VerticaleAccordion({ verticale, onNuovaSubCampagna }) {
  const [aperto, setAperto] = useState(true)
  // Sub-campagna espansa (una alla volta per verticale)
  const [openSubId, setOpenSubId] = useState(null)

  const toggleSub = (id) => setOpenSubId((prev) => (prev === id ? null : id))

  return (
    <div className="overflow-hidden rounded-lg border border-border bg-card">
      {/* Header verticale */}
      <div className="flex items-center gap-3 bg-muted/40 px-4 py-3">
        <button
          type="button"
          onClick={() => setAperto((v) => !v)}
          aria-expanded={aperto}
          className="flex flex-1 items-center gap-2 text-left"
        >
          <ChevronDown className={cn('h-4 w-4 transition-transform', !aperto && '-rotate-90')} />
          <span className="text-sm font-semibold tracking-wide text-foreground">{verticale.nome}</span>
          <span className="text-xs text-muted-foreground">
            {verticale.totale} sub-campagne · {verticale.attive} attive
          </span>
        </button>
        <Button variant="outline" size="sm" onClick={() => onNuovaSubCampagna(verticale)}>
          <Plus className="h-4 w-4" />
          Nuova sub-campagna
        </Button>
      </div>

      {/* Lista sub-campagne */}
      <div
        className={cn(
          'grid transition-all duration-200 ease-out',
          aperto ? 'grid-rows-[1fr]' : 'grid-rows-[0fr]',
        )}
      >
        <div className="overflow-hidden">
          {verticale.subCampagne.length === 0 ? (
            <div className="p-4">
              <EmptyState
                title="Nessuna sub-campagna"
                description="Crea la prima sub-campagna per questo verticale."
              />
            </div>
          ) : (
            verticale.subCampagne.map((s) => (
              <SubCampagnaRow
                key={s.id}
                subCampagna={s}
                isOpen={openSubId === s.id}
                onToggle={() => toggleSub(s.id)}
              />
            ))
          )}
        </div>
      </div>
    </div>
  )
}
