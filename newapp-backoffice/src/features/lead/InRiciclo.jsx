import { useState } from 'react'
import { Send, Snowflake, CheckCircle2 } from 'lucide-react'
import { toast } from 'sonner'

import { formatDate, maskPhone } from '@/lib/utils'
import { ScreenHeader } from '@/components/shared/ScreenHeader'
import { DataTable } from '@/components/shared/DataTable'
import { EmptyState } from '@/components/shared/EmptyState'
import { ScoreBadge } from '@/components/shared/ScoreBadge'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { useRicicloLeads, useSpostaListaFredda, MAX_RICICLI } from './hooks/useRiciclo'
import { RiciclaPopup } from './components/RiciclaPopup'

// Schermata "In riciclo" (sezione 13, step 11): contatori live + tabella + azioni.
export default function InRiciclo() {
  const { data, isLoading } = useRicicloLeads()
  const raffredda = useSpostaListaFredda()
  const [leadDaInviare, setLeadDaInviare] = useState(null)

  const counters = data?.counters
  const leads = data?.leads ?? []

  const spostaFredda = (lead) => {
    raffredda.mutate(
      { leadId: lead.id },
      {
        onSuccess: () => toast.success('Lead spostata in lista fredda.'),
        onError: (e) => toast.error(e.message ?? 'Errore durante lo spostamento.'),
      },
    )
  }

  const columns = [
    { accessorKey: 'id', header: 'ID', cell: ({ getValue }) => <span className="font-mono text-xs">{getValue()}</span> },
    { accessorKey: 'created_at', header: 'Ricezione', cell: ({ getValue }) => formatDate(getValue()) },
    { accessorKey: 'nome', header: 'Nome', cell: ({ row }) => [row.original.nome, row.original.cognome].filter(Boolean).join(' ') || '—' },
    { accessorKey: 'telefono', header: 'Telefono', cell: ({ getValue }) => <span className="font-mono text-xs">{maskPhone(getValue())}</span> },
    { accessorKey: 'settore', header: 'Settore' },
    { accessorKey: 'fascia', header: 'Fascia', cell: ({ getValue }) => <ScoreBadge fascia={getValue()} /> },
    {
      accessorKey: 'riciclo_count',
      header: 'Tentativi',
      cell: ({ getValue }) => {
        const v = getValue() ?? 0
        const esaurito = v >= MAX_RICICLI
        return (
          <span className={esaurito ? 'font-semibold text-red-600' : 'font-medium'}>
            {v}/{MAX_RICICLI}
          </span>
        )
      },
    },
    {
      id: 'azioni',
      header: 'Azioni',
      enableSorting: false,
      cell: ({ row }) => {
        const esaurito = (row.original.riciclo_count ?? 0) >= MAX_RICICLI
        return (
          <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
            <Button variant="outline" size="sm" disabled={esaurito} onClick={() => setLeadDaInviare(row.original)}>
              <Send className="h-3.5 w-3.5" />
              Invia
            </Button>
            <Button variant="ghost" size="sm" onClick={() => spostaFredda(row.original)}>
              <Snowflake className="h-3.5 w-3.5" />
              Lista fredda
            </Button>
          </div>
        )
      },
    },
  ]

  return (
    <>
      <ScreenHeader
        title="Lead in riciclo"
        subtitle="Lead rientrate in pool dopo errori consegna o non contatto"
      />

      {/* Contatori live */}
      {isLoading ? (
        <div className="mb-6 grid grid-cols-2 gap-4 lg:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-20" />)}
        </div>
      ) : (
        <div className="mb-6 grid grid-cols-2 gap-4 lg:grid-cols-4">
          <Counter label="In riciclo" value={counters.totali} />
          <Counter label="1° tentativo" value={counters.tentativo1} />
          <Counter label="2° tentativo" value={counters.tentativo2} />
          <Counter label="Da raffreddare" value={counters.daRaffreddare} accent={counters.daRaffreddare > 0} />
        </div>
      )}

      {!isLoading && leads.length === 0 ? (
        <EmptyState
          icon={CheckCircle2}
          title="Nessuna lead in riciclo"
          description="Non ci sono lead da reinviare al momento."
        />
      ) : (
        <DataTable columns={columns} data={leads} isLoading={isLoading} getRowId={(r) => r.id} />
      )}

      <RiciclaPopup lead={leadDaInviare} onClose={() => setLeadDaInviare(null)} />
    </>
  )
}

function Counter({ label, value, accent = false }) {
  return (
    <div className="rounded-lg border border-border bg-card p-4">
      <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">{label}</p>
      <p className={`mt-1 text-2xl font-semibold tabular-nums ${accent ? 'text-red-600' : 'text-foreground'}`}>
        {value}
      </p>
    </div>
  )
}
