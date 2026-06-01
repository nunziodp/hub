import { useState } from 'react'
import { Search, X } from 'lucide-react'

import { ScreenHeader } from '@/components/shared/ScreenHeader'
import { Input } from '@/components/ui/input'
import { Select } from '@/components/ui/select'
import { Button } from '@/components/ui/button'
import { TIER_RDV, STATI_RDV, VERTICALI } from '@/constants/dictionaries'
import { useRdvList } from './hooks/useRdvList'
import { RdvTable } from './components/RdvTable'

// Schermata "Tutte le RDV" (sezione 9.3): tabella + filtri tier/stato/verticale + ricerca.
export default function RdvListPage() {
  const [filtri, setFiltri] = useState({})
  const { data = [], isLoading } = useRdvList(filtri)

  const set = (campo) => (valore) => setFiltri((f) => ({ ...f, [campo]: valore }))
  const attivi = Object.values(filtri).filter((v) => v != null && v !== '').length

  return (
    <>
      <ScreenHeader
        title="Tutte le RDV"
        subtitle="Anagrafica e stato delle RDV in piattaforma"
      />

      {/* Filtri */}
      <div className="mb-4 flex flex-wrap items-center gap-2 rounded-lg border border-border bg-card p-4">
        <div className="relative min-w-[240px] flex-1">
          <Search className="pointer-events-none absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={filtri.q ?? ''}
            onChange={(e) => set('q')(e.target.value)}
            placeholder="Cerca per ragione sociale, P.IVA, referente…"
            className="pl-8"
          />
        </div>
        <Select
          value={filtri.tier ?? ''}
          onValueChange={set('tier')}
          options={TIER_RDV.map((t) => ({ value: t, label: `Tier ${t}` }))}
          placeholder="Tier"
          className="w-[130px]"
          aria-label="Filtra per tier"
        />
        <Select
          value={filtri.stato ?? ''}
          onValueChange={set('stato')}
          options={STATI_RDV}
          placeholder="Stato"
          className="w-[150px]"
          aria-label="Filtra per stato"
        />
        <Select
          value={filtri.verticale ?? ''}
          onValueChange={set('verticale')}
          options={VERTICALI}
          placeholder="Verticale"
          className="w-[160px]"
          aria-label="Filtra per verticale"
        />
        {attivi > 0 && (
          <Button variant="ghost" size="sm" onClick={() => setFiltri({})}>
            <X className="h-4 w-4" />
            Azzera ({attivi})
          </Button>
        )}
      </div>

      <RdvTable data={data} isLoading={isLoading} />
    </>
  )
}
