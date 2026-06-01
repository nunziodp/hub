import { useState } from 'react'
import { Search, SlidersHorizontal, X, ChevronDown } from 'lucide-react'

import { cn } from '@/lib/utils'
import { Input } from '@/components/ui/input'
import { Select } from '@/components/ui/select'
import { Button } from '@/components/ui/button'
import { useLeadFilterOptions } from '../hooks/useLead'

// Pannello filtri per "Tutte le lead" (sezione 9.5).
// Filtri base sempre visibili + filtri avanzati in accordion.
// Stato sollevato nel parent: riceve `filtri` e `onChange(nuoviFiltri)`.
export function LeadFilters({ filtri, onChange }) {
  const [avanzatiAperti, setAvanzatiAperti] = useState(false)
  const opts = useLeadFilterOptions()

  // Aggiorna un singolo campo del filtro
  const set = (campo) => (valore) => onChange({ ...filtri, [campo]: valore })

  // Conteggio filtri attivi (per badge "Azzera")
  const attivi = Object.entries(filtri).filter(
    ([, v]) => v != null && v !== '',
  ).length

  const azzera = () => onChange({})

  return (
    <div className="mb-4 rounded-lg border border-border bg-card p-4">
      {/* Riga ricerca + base */}
      <div className="flex flex-wrap items-center gap-2">
        <div className="relative min-w-[220px] flex-1">
          <Search className="pointer-events-none absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={filtri.q ?? ''}
            onChange={(e) => set('q')(e.target.value)}
            placeholder="Cerca per nome, telefono, email, id…"
            className="pl-8"
          />
        </div>

        <Select
          value={filtri.stato ?? ''}
          onValueChange={set('stato')}
          options={opts.stati}
          placeholder="Stato"
          className="w-[150px]"
          aria-label="Filtra per stato"
        />
        <Select
          value={filtri.fonte ?? ''}
          onValueChange={set('fonte')}
          options={opts.fonti}
          placeholder="Fonte"
          className="w-[130px]"
          aria-label="Filtra per fonte"
        />
        <Select
          value={filtri.fascia ?? ''}
          onValueChange={set('fascia')}
          options={opts.fasce}
          placeholder="Fascia"
          className="w-[130px]"
          aria-label="Filtra per fascia"
        />
        <Select
          value={filtri.settore ?? ''}
          onValueChange={set('settore')}
          options={opts.settori}
          placeholder="Verticale"
          className="w-[140px]"
          aria-label="Filtra per verticale"
        />
        <Select
          value={filtri.sub_campagna_id ?? ''}
          onValueChange={set('sub_campagna_id')}
          options={opts.subCampagne}
          placeholder="Sub-campagna"
          className="w-[180px]"
          aria-label="Filtra per sub-campagna"
        />
        <Select
          value={filtri.rdv_id ?? ''}
          onValueChange={set('rdv_id')}
          options={opts.rdv}
          placeholder="RDV"
          className="w-[170px]"
          aria-label="Filtra per RDV"
        />
        <Select
          value={filtri.parsing_ok ?? ''}
          onValueChange={set('parsing_ok')}
          options={[
            { value: 'true', label: 'Parsing OK' },
            { value: 'false', label: 'Parsing fallito' },
          ]}
          placeholder="Parsing"
          className="w-[150px]"
          aria-label="Filtra per esito parsing"
        />

        <Button
          variant="outline"
          size="sm"
          onClick={() => setAvanzatiAperti((v) => !v)}
          aria-expanded={avanzatiAperti}
        >
          <SlidersHorizontal className="h-4 w-4" />
          Avanzati
          <ChevronDown
            className={cn('h-4 w-4 transition-transform', avanzatiAperti && 'rotate-180')}
          />
        </Button>

        {attivi > 0 && (
          <Button variant="ghost" size="sm" onClick={azzera}>
            <X className="h-4 w-4" />
            Azzera ({attivi})
          </Button>
        )}
      </div>

      {/* Filtri avanzati in accordion (pos. campaign_name 3,4,7,10).
          Il settore/verticale (pos.2) è già coperto dal filtro base. */}
      <div
        className={cn(
          'grid transition-all duration-200 ease-out',
          avanzatiAperti ? 'mt-3 grid-rows-[1fr] opacity-100' : 'grid-rows-[0fr] opacity-0',
        )}
      >
        <div className="overflow-hidden">
          <div className="flex flex-wrap items-center gap-2 border-t border-border pt-3">
            <Select
              value={filtri.cliente ?? ''}
              onValueChange={set('cliente')}
              options={opts.clienti}
              placeholder="Cliente"
              className="w-[170px]"
              aria-label="Filtra per cliente"
            />
            <Select
              value={filtri.campagna_cliente ?? ''}
              onValueChange={set('campagna_cliente')}
              options={opts.campagneCliente}
              placeholder="Campagna cliente"
              className="w-[190px]"
              aria-label="Filtra per campagna cliente"
            />
            <Select
              value={filtri.formato ?? ''}
              onValueChange={set('formato')}
              options={opts.formati}
              placeholder="Formato"
              className="w-[150px]"
              aria-label="Filtra per formato"
            />
            <Select
              value={filtri.automazione ?? ''}
              onValueChange={set('automazione')}
              options={opts.automazioni}
              placeholder="Automazione"
              className="w-[170px]"
              aria-label="Filtra per automazione"
            />
          </div>
        </div>
      </div>
    </div>
  )
}
