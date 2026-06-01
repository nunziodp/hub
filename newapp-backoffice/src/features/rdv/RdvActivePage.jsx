import { useNavigate } from 'react-router-dom'

import { formatCurrency, formatNumber } from '@/lib/utils'
import { ROUTES } from '@/constants/routes'
import { ScreenHeader } from '@/components/shared/ScreenHeader'
import { DataTable } from '@/components/shared/DataTable'
import { StatusBadge } from '@/components/shared/StatusBadge'
import { TierBadge } from '@/components/shared/TierBadge'
import { EmptyState } from '@/components/shared/EmptyState'
import { Skeleton } from '@/components/ui/skeleton'
import { useRdvAttive } from './hooks/useRdvReport'

// RDV attive nel mese (/rdv/attive): RDV con lead nel mese solare corrente.
export default function RdvActivePage() {
  const navigate = useNavigate()
  const { data, isLoading } = useRdvAttive()

  const columns = [
    { accessorKey: 'ragione_sociale', header: 'RDV', cell: ({ getValue }) => <span className="font-medium">{getValue()}</span> },
    { accessorKey: 'tier', header: 'Tier', cell: ({ getValue }) => <TierBadge tier={getValue()} /> },
    { accessorKey: 'stato', header: 'Stato', cell: ({ getValue }) => <StatusBadge stato={getValue()} /> },
    { accessorKey: 'leadMese', header: 'Lead nel mese', cell: ({ getValue }) => formatNumber(getValue()) },
    { accessorKey: 'consegnateMese', header: 'Consegnate', cell: ({ getValue }) => formatNumber(getValue()) },
    { accessorKey: 'budgetResiduo', header: 'Budget residuo', cell: ({ getValue }) => formatCurrency(getValue()) },
  ]

  return (
    <>
      <ScreenHeader title="RDV attive nel mese" subtitle="RDV con lead nel mese solare corrente" />

      {isLoading ? (
        <Skeleton className="h-64 w-full" />
      ) : (
        <div className="space-y-6">
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-2 lg:max-w-md">
            <Kpi label="RDV attive nel mese" value={formatNumber(data.kpi.rdvAttive)} />
            <Kpi label="Lead consegnate (mese)" value={formatNumber(data.kpi.leadConsegnate)} />
          </div>

          {data.righe.length === 0 ? (
            <EmptyState title="Nessuna RDV attiva nel mese" description="Non risultano lead distribuite nel mese corrente." />
          ) : (
            <DataTable columns={columns} data={data.righe} getRowId={(r) => r.id} onRowClick={(r) => navigate(ROUTES.rdvDettaglio(r.id))} />
          )}
        </div>
      )}
    </>
  )
}

function Kpi({ label, value }) {
  return (
    <div className="rounded-lg border border-border bg-card p-4">
      <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">{label}</p>
      <p className="mt-1 text-2xl font-semibold tabular-nums text-foreground">{value}</p>
    </div>
  )
}
