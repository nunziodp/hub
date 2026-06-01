import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from 'recharts'

import { formatNumber, formatDateOnly } from '@/lib/utils'
import { ScoreBadge } from '@/components/shared/ScoreBadge'
import { Skeleton } from '@/components/ui/skeleton'
import { useRdvPerformance } from '../../hooks/useRdvDetail'

// Tab Performance (sezione 9.4): KPI 30gg + distribuzione fasce + andamento.
export function TabPerformance({ rdv }) {
  const { data, isLoading } = useRdvPerformance(rdv.id)

  if (isLoading) return <Skeleton className="h-64 w-full" />
  if (!data) return null

  const maxFascia = Math.max(1, ...data.distribuzioneFasce.map((f) => f.count))

  return (
    <div className="space-y-6">
      {/* KPI 30gg */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-3">
        <Kpi label="Lead totali" value={formatNumber(data.kpi.totali)} />
        <Kpi label="Consegnate" value={formatNumber(data.kpi.consegnate)} />
        <Kpi label="Score medio" value={data.kpi.scoreMedio > 0 ? formatNumber(data.kpi.scoreMedio, 1) : '—'} />
      </div>

      {/* Distribuzione fasce */}
      <div className="rounded-lg border border-border bg-card p-4">
        <h4 className="mb-3 text-sm font-semibold">Distribuzione per fascia</h4>
        <div className="space-y-2">
          {data.distribuzioneFasce.map((f) => (
            <div key={f.fascia} className="flex items-center gap-3">
              <div className="w-24 shrink-0">
                <ScoreBadge fascia={f.fascia} />
              </div>
              <div className="h-2 flex-1 overflow-hidden rounded-full bg-muted">
                <div
                  className="h-full rounded-full bg-brand-600"
                  style={{ width: `${(f.count / maxFascia) * 100}%` }}
                />
              </div>
              <span className="w-8 text-right text-sm tabular-nums text-muted-foreground">{f.count}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Andamento 30gg */}
      <div className="rounded-lg border border-border bg-card p-4">
        <h4 className="mb-3 text-sm font-semibold">Andamento lead consegnate (30 giorni)</h4>
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={data.andamento} margin={{ top: 8, right: 12, left: -16, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" className="stroke-border" vertical={false} />
              <XAxis
                dataKey="data"
                tickFormatter={(d) => formatDateOnly(d).slice(0, 5)}
                tick={{ fontSize: 11 }}
                interval={4}
              />
              <YAxis tick={{ fontSize: 11 }} allowDecimals={false} />
              <Tooltip
                labelFormatter={(d) => formatDateOnly(d)}
                formatter={(v) => [v, 'Consegnate']}
              />
              <Line type="monotone" dataKey="consegnate" stroke="#4f46e5" strokeWidth={2} dot={false} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  )
}

function Kpi({ label, value }) {
  return (
    <div className="rounded-lg border border-border bg-card p-4">
      <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">{label}</p>
      <p className="mt-1 text-xl font-semibold tabular-nums">{value}</p>
    </div>
  )
}
