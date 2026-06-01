import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { formatNumber, formatPercent } from '@/lib/utils'

// Palette per le fonti (riusabile in tutta la sezione lead)
const COLORI_FONTE = {
  GOOGLE:    '#4285f4',
  META:      '#0866ff',
  TIKTOK:    '#000000',
  AFFILIATO: '#a855f7',
  ROBOCALL:  '#f59e0b',
  IMPORT:    '#64748b',
}

// BarChart orizzontale con la distribuzione percentuale per fonte
export function SourceChart({ data }) {
  return (
    <Card className="h-full">
      <CardHeader>
        <CardTitle className="text-base">Distribuzione per fonte (30gg)</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="h-72 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={data}
              layout="vertical"
              margin={{ top: 10, right: 24, left: 16, bottom: 0 }}
            >
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" horizontal={false} />
              <XAxis
                type="number"
                tick={{ fontSize: 11, fill: '#64748b' }}
                axisLine={false}
                tickLine={false}
              />
              <YAxis
                type="category"
                dataKey="fonte"
                tick={{ fontSize: 11, fill: '#475569' }}
                axisLine={false}
                tickLine={false}
                width={80}
              />
              <Tooltip
                formatter={(v, _name, p) => [
                  `${formatNumber(v)} lead (${formatPercent(p.payload.percentuale)})`,
                  'Volume',
                ]}
                contentStyle={{
                  borderRadius: 8,
                  border: '1px solid #e2e8f0',
                  fontSize: 12,
                }}
              />
              <Bar dataKey="count" radius={[0, 6, 6, 0]}>
                {data.map((row) => (
                  <Cell key={row.fonte} fill={COLORI_FONTE[row.fonte] ?? '#94a3b8'} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  )
}
