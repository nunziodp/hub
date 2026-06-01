import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid } from 'recharts'

import { formatCurrency, formatNumber } from '@/lib/utils'
import { ScreenHeader } from '@/components/shared/ScreenHeader'
import { DataTable } from '@/components/shared/DataTable'
import { Skeleton } from '@/components/ui/skeleton'
import { useStatFonti } from './hooks/useStatistiche'

// Performance fonti: tabella metriche per canale + grafico lead per fonte.
export default function StatFontiPage() {
  const { data, isLoading } = useStatFonti()

  const columns = [
    { accessorKey: 'fonte', header: 'Fonte', cell: ({ getValue }) => <span className="font-medium">{getValue()}</span> },
    { accessorKey: 'lead', header: 'Lead', cell: ({ getValue }) => formatNumber(getValue()) },
    { accessorKey: 'consegnate', header: 'Consegnate', cell: ({ getValue }) => formatNumber(getValue()) },
    { accessorKey: 'scoreMedio', header: 'Score medio', cell: ({ getValue }) => (getValue() > 0 ? formatNumber(getValue(), 1) : '—') },
    { accessorKey: 'spend', header: 'Spend', cell: ({ getValue }) => formatCurrency(getValue()) },
    { accessorKey: 'cpl', header: 'CPL', cell: ({ getValue }) => formatCurrency(getValue()) },
  ]

  return (
    <>
      <ScreenHeader title="Performance fonti" subtitle="Andamento di canali, sub-campagne e creatività" />

      {isLoading ? (
        <Skeleton className="h-64 w-full" />
      ) : (
        <div className="space-y-6">
          {/* Grafico lead per fonte */}
          <div className="rounded-lg border border-border bg-card p-4">
            <h4 className="mb-3 text-sm font-semibold">Lead per fonte</h4>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={data.righe} margin={{ top: 8, right: 12, left: -16, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-border" vertical={false} />
                  <XAxis dataKey="fonte" tick={{ fontSize: 11 }} />
                  <YAxis tick={{ fontSize: 11 }} allowDecimals={false} />
                  <Tooltip formatter={(v) => [v, 'Lead']} />
                  <Bar dataKey="lead" fill="#4f46e5" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Tabella metriche */}
          <DataTable columns={columns} data={data.righe} getRowId={(r) => r.fonte} />
        </div>
      )}
    </>
  )
}
