import { useNavigate } from 'react-router-dom'
import { AlertTriangle } from 'lucide-react'

import { cn, formatCurrency, formatDate } from '@/lib/utils'
import { ROUTES } from '@/constants/routes'
import { ScreenHeader } from '@/components/shared/ScreenHeader'
import { DataTable } from '@/components/shared/DataTable'
import { StatusBadge } from '@/components/shared/StatusBadge'
import { TierBadge } from '@/components/shared/TierBadge'
import { Skeleton } from '@/components/ui/skeleton'
import { useFatturazione } from './hooks/useRdvReport'

// Fatturazione RDV (/rdv/fatturazione): stato credito + ricariche.
export default function FatturazionePage() {
  const navigate = useNavigate()
  const { data, isLoading } = useFatturazione()

  const creditoColumns = [
    { accessorKey: 'ragione_sociale', header: 'RDV', cell: ({ getValue }) => <span className="font-medium">{getValue()}</span> },
    { accessorKey: 'tier', header: 'Tier', cell: ({ getValue }) => <TierBadge tier={getValue()} /> },
    { accessorKey: 'stato', header: 'Stato', cell: ({ getValue }) => <StatusBadge stato={getValue()} /> },
    { accessorKey: 'saldo', header: 'Saldo', cell: ({ getValue }) => formatCurrency(getValue()) },
    { accessorKey: 'soglia', header: 'Soglia alert', cell: ({ getValue }) => formatCurrency(getValue()) },
    {
      accessorKey: 'perc',
      header: 'Budget residuo',
      cell: ({ row }) => {
        const perc = Math.max(0, Math.min(100, row.original.perc))
        const colore = perc > 50 ? 'bg-emerald-500' : perc >= 20 ? 'bg-amber-500' : 'bg-red-500'
        return (
          <div className="flex items-center gap-2">
            <div className="h-1.5 w-24 overflow-hidden rounded-full bg-muted">
              <div className={cn('h-full rounded-full', colore)} style={{ width: `${perc}%` }} />
            </div>
            <span className="text-xs tabular-nums text-muted-foreground">{Math.round(perc)}%</span>
          </div>
        )
      },
    },
    {
      id: 'alert',
      header: '',
      enableSorting: false,
      cell: ({ row }) =>
        row.original.sottoSoglia ? (
          <span className="inline-flex items-center gap-1 text-xs font-medium text-amber-600">
            <AlertTriangle className="h-3.5 w-3.5" /> Sotto soglia
          </span>
        ) : null,
    },
  ]

  const ricaricheColumns = [
    { accessorKey: 'created_at', header: 'Data', cell: ({ getValue }) => formatDate(getValue()) },
    { accessorKey: '_rdvNome', header: 'RDV' },
    { accessorKey: 'descrizione', header: 'Descrizione', cell: ({ getValue }) => getValue() || '—' },
    { accessorKey: 'importo', header: 'Importo', cell: ({ getValue }) => <span className="font-semibold text-emerald-600 tabular-nums">+{formatCurrency(getValue())}</span> },
  ]

  return (
    <>
      <ScreenHeader title="Fatturazione RDV" subtitle="Wallet, ricariche e crediti in esaurimento" />

      {isLoading ? (
        <Skeleton className="h-64 w-full" />
      ) : (
        <div className="space-y-6">
          {/* KPI */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <Kpi label="Credito totale piattaforma" value={formatCurrency(data.kpi.creditoTotale)} />
            <Kpi label="RDV sotto soglia" value={data.kpi.rdvSottoSoglia} accent={data.kpi.rdvSottoSoglia > 0 ? 'text-amber-600' : undefined} />
            <Kpi label="Ricariche (mese)" value={formatCurrency(data.kpi.ricaricheMese)} />
          </div>

          {/* Stato credito */}
          <div>
            <h4 className="mb-2 text-sm font-semibold">Stato credito RDV</h4>
            <DataTable columns={creditoColumns} data={data.righe} getRowId={(r) => r.id} onRowClick={(r) => navigate(ROUTES.rdvDettaglio(r.id))} />
          </div>

          {/* Storico ricariche */}
          <div>
            <h4 className="mb-2 text-sm font-semibold">Storico ricariche</h4>
            <DataTable columns={ricaricheColumns} data={data.ricariche} getRowId={(r) => r.id} />
          </div>
        </div>
      )}
    </>
  )
}

function Kpi({ label, value, accent }) {
  return (
    <div className="rounded-lg border border-border bg-card p-4">
      <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">{label}</p>
      <p className={cn('mt-1 text-2xl font-semibold tabular-nums', accent ?? 'text-foreground')}>{value}</p>
    </div>
  )
}
