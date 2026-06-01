import { useState } from 'react'
import { Wrench, Trash2, CheckCircle2 } from 'lucide-react'

import { ScreenHeader } from '@/components/shared/ScreenHeader'
import { DataTable } from '@/components/shared/DataTable'
import { EmptyState } from '@/components/shared/EmptyState'
import { Button } from '@/components/ui/button'
import { formatDate } from '@/lib/utils'
import { useRevisioneLeads } from './hooks/useRevisione'
import { CorreggiDialog } from './components/CorreggiDialog'
import { ScartaDialog } from './components/ScartaDialog'

// Schermata "In attesa di revisione" (sezione 9.6).
// Lista delle lead con parsing_ok = false + azioni Correggi / Scarta.
export default function InAttesaRevisione() {
  const { data: leads = [], isLoading } = useRevisioneLeads()

  // Lead target dei due dialog (mutuamente esclusivi)
  const [daCorreggere, setDaCorreggere] = useState(null)
  const [daScartare, setDaScartare] = useState(null)

  // Colonne: id | created_at | campaign_name_raw | motivo_flag | azioni
  const columns = [
    {
      accessorKey: 'id',
      header: 'ID',
      cell: ({ getValue }) => <span className="font-mono text-xs">{getValue()}</span>,
    },
    {
      accessorKey: 'created_at',
      header: 'Ricezione',
      cell: ({ getValue }) => formatDate(getValue()),
    },
    {
      accessorKey: 'campaign_name_raw',
      header: 'Campaign name (raw)',
      cell: ({ getValue }) => (
        <span title={getValue()} className="block max-w-[320px] truncate font-mono text-xs">
          {getValue() || '—'}
        </span>
      ),
    },
    {
      accessorKey: 'motivo_flag',
      header: 'Motivo',
      cell: ({ getValue }) => (
        <span className="inline-flex rounded-md bg-red-50 px-2 py-0.5 text-xs font-medium text-red-700">
          {getValue()}
        </span>
      ),
      enableSorting: false,
    },
    {
      id: 'azioni',
      header: 'Azioni',
      enableSorting: false,
      cell: ({ row }) => (
        <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
          <Button variant="outline" size="sm" onClick={() => setDaCorreggere(row.original)}>
            <Wrench className="h-3.5 w-3.5" />
            Correggi
          </Button>
          <Button variant="ghost" size="sm" onClick={() => setDaScartare(row.original)}>
            <Trash2 className="h-3.5 w-3.5" />
            Scarta
          </Button>
        </div>
      ),
    },
  ]

  return (
    <>
      <ScreenHeader
        title="In attesa di revisione"
        subtitle="Lead con parsing fallito · correggi i campi o scarta"
      />

      {!isLoading && leads.length === 0 ? (
        <EmptyState
          icon={CheckCircle2}
          title="Nessuna lead in revisione"
          description="Tutte le lead sono state parsate correttamente. Il badge in sidebar si aggiorna in tempo reale."
        />
      ) : (
        <DataTable columns={columns} data={leads} isLoading={isLoading} getRowId={(r) => r.id} />
      )}

      <CorreggiDialog lead={daCorreggere} onClose={() => setDaCorreggere(null)} />
      <ScartaDialog lead={daScartare} onClose={() => setDaScartare(null)} />
    </>
  )
}
