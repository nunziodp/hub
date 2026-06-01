import { useState } from 'react'
import { Zap, Euro, Gauge, CheckCircle2 } from 'lucide-react'

import { ScreenHeader } from '@/components/shared/ScreenHeader'
import { KpiCard } from '@/components/shared/KpiCard'
import { Skeleton } from '@/components/ui/skeleton'
import { formatCurrency, formatNumber } from '@/lib/utils'
import { useCampagne } from './hooks/useCampagne'
import { VerticaleAccordion } from './components/VerticaleAccordion'
import { NuovaSubCampagnaForm } from './components/NuovaSubCampagnaForm'

// Schermata Campagne (sezione 9.2): KPI globali + accordion verticali a due
// livelli. Il form di creazione si apre dal pulsante interno a ogni verticale.
export default function CampagnePage() {
  const { data, isLoading } = useCampagne()
  // Verticale target del dialog "Nuova sub-campagna"
  const [verticaleNuova, setVerticaleNuova] = useState(null)

  return (
    <>
      <ScreenHeader
        title="Campagne"
        subtitle="Verticali e sub-campagne · webhook, KPI e sorgenti"
      />

      {/* KPI globali (4 card) */}
      {isLoading ? (
        <div className="mb-6 grid grid-cols-2 gap-4 lg:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-24" />
          ))}
        </div>
      ) : (
        <div className="mb-6 grid grid-cols-2 gap-4 lg:grid-cols-4">
          <KpiCard
            label="Lead 30gg"
            value={formatNumber(data.kpi.lead30gg)}
            icon={<Zap className="h-4 w-4 text-violet-500" />}
          />
          <KpiCard
            label="Spend 30gg"
            value={formatCurrency(data.kpi.spend30gg)}
            icon={<Euro className="h-4 w-4 text-emerald-500" />}
          />
          <KpiCard
            label="CPL medio"
            value={formatCurrency(data.kpi.cplMedio)}
            icon={<Gauge className="h-4 w-4 text-amber-500" />}
          />
          <KpiCard
            label="Sub-campagne attive"
            value={`${data.kpi.attive}/${data.kpi.totale}`}
            icon={<CheckCircle2 className="h-4 w-4 text-sky-500" />}
          />
        </div>
      )}

      {/* Accordion verticali */}
      {isLoading ? (
        <div className="space-y-4">
          <Skeleton className="h-40" />
          <Skeleton className="h-40" />
        </div>
      ) : (
        <div className="space-y-4">
          {data.verticali.map((v) => (
            <VerticaleAccordion
              key={v.id}
              verticale={v}
              onNuovaSubCampagna={setVerticaleNuova}
            />
          ))}
        </div>
      )}

      <NuovaSubCampagnaForm verticale={verticaleNuova} onClose={() => setVerticaleNuova(null)} />
    </>
  )
}
