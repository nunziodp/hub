import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { formatCurrency, formatNumber, formatPercent } from '@/lib/utils'

// Tabella compatta con le top sub-campagne attive
export function ActiveSourcesTable({ rows }) {
  return (
    <Card className="h-full">
      <CardHeader>
        <CardTitle className="text-base">Sub-campagne attive (top 5)</CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border text-xs uppercase tracking-wide text-muted-foreground">
                <th className="px-4 py-2 text-left font-medium">Sub-campagna</th>
                <th className="px-4 py-2 text-right font-medium">Lead 30gg</th>
                <th className="px-4 py-2 text-right font-medium">Score</th>
                <th className="px-4 py-2 text-right font-medium">Contatto</th>
                <th className="px-4 py-2 text-right font-medium">CPL</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <tr
                  key={r.id}
                  className="border-b border-border last:border-0 hover:bg-muted/50"
                >
                  <td className="px-4 py-3">
                    <div className="font-medium text-foreground">{r.nome}</div>
                    <div className="text-xs text-muted-foreground">
                      {r.verticale} · {r.formato}
                    </div>
                  </td>
                  <td className="px-4 py-3 text-right tabular-nums">
                    {formatNumber(r.lead_30gg)}
                  </td>
                  <td className="px-4 py-3 text-right tabular-nums">
                    {formatNumber(r.score_medio, 1)}
                  </td>
                  <td className="px-4 py-3 text-right tabular-nums">
                    {formatPercent(r.tasso_contatto)}
                  </td>
                  <td className="px-4 py-3 text-right tabular-nums">
                    {formatCurrency(r.cpl)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  )
}
