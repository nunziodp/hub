import { useNavigate } from 'react-router-dom'

import { formatCurrency, formatNumber, formatPercent } from '@/lib/utils'
import { ROUTES } from '@/constants/routes'
import { ScreenHeader } from '@/components/shared/ScreenHeader'
import { DataTable } from '@/components/shared/DataTable'
import { StatusBadge } from '@/components/shared/StatusBadge'
import { TierBadge } from '@/components/shared/TierBadge'
import { Skeleton } from '@/components/ui/skeleton'
import { useStatRdv } from './hooks/useStatistiche'

// Performance RDV: tabella metriche per RDV (lead, consegnate, conversione, score, budget).
export default function StatRdvPage() {
  const navigate = useNavigate()
  const { data, isLoading } = useStatRdv()

  const columns = [
    { accessorKey: 'ragione_sociale', header: 'RDV', cell: ({ getValue }) => <span className="font-medium">{getValue()}</span> },
    { accessorKey: 'tier', header: 'Tier', cell: ({ getValue }) => <TierBadge tier={getValue()} /> },
    { accessorKey: 'stato', header: 'Stato', cell: ({ getValue }) => <StatusBadge stato={getValue()} /> },
    { accessorKey: 'lead', header: 'Lead', cell: ({ getValue }) => formatNumber(getValue()) },
    { accessorKey: 'consegnate', header: 'Consegnate', cell: ({ getValue }) => formatNumber(getValue()) },
    { accessorKey: 'tassoConversione', header: 'Conversione', cell: ({ row }) => (row.original.consegnate > 0 ? formatPercent(row.original.tassoConversione) : '—') },
    { accessorKey: 'scoreMedio', header: 'Score medio', cell: ({ getValue }) => (getValue() > 0 ? formatNumber(getValue(), 1) : '—') },
    { accessorKey: 'budgetResiduo', header: 'Budget residuo', cell: ({ getValue }) => formatCurrency(getValue()) },
  ]

  return (
    <>
      <ScreenHeader title="Performance RDV" subtitle="Metriche di distribuzione e conversione per RDV" />

      {isLoading ? (
        <Skeleton className="h-64 w-full" />
      ) : (
        <DataTable
          columns={columns}
          data={data.righe}
          getRowId={(r) => r.id}
          onRowClick={(r) => navigate(ROUTES.rdvDettaglio(r.id))}
        />
      )}
    </>
  )
}
