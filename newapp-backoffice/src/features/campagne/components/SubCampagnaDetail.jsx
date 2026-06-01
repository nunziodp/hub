import { Gauge, Webhook, Radio } from 'lucide-react'

import { formatCurrency, formatNumber, formatPercent } from '@/lib/utils'
import { WebhookConfig } from './WebhookConfig'

// Dettaglio espanso di una sub-campagna (sezione 9.2): 3 sezioni — KPI,
// configurazione webhook, sorgenti (campagne collegate).
export function SubCampagnaDetail({ subCampagna }) {
  return (
    <div className="space-y-5 border-t border-border bg-muted/30 p-4">
      {/* Sezione 1 — KPI */}
      <Sezione icon={Gauge} titolo="KPI (30 giorni)">
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          <Kpi label="Lead" value={formatNumber(subCampagna.lead_30gg)} />
          <Kpi label="Score medio" value={formatNumber(subCampagna.score_medio, 1)} />
          <Kpi label="Tasso contatto" value={formatPercent(subCampagna.tasso_contatto)} />
          <Kpi label="CPL" value={formatCurrency(subCampagna.cpl)} />
        </div>
      </Sezione>

      {/* Sezione 2 — Webhook */}
      <Sezione icon={Webhook} titolo="Configurazione webhook">
        <WebhookConfig subCampagna={subCampagna} />
      </Sezione>

      {/* Sezione 3 — Sorgenti (campagne collegate) */}
      <Sezione icon={Radio} titolo="Sorgenti collegate">
        {subCampagna.campagne_collegate?.length > 0 ? (
          <div className="overflow-hidden rounded-md border border-border bg-card">
            <table className="w-full text-sm">
              <thead className="border-b border-border bg-muted/40 text-xs text-muted-foreground">
                <tr>
                  <th className="px-3 py-2 text-left font-semibold">Piattaforma</th>
                  <th className="px-3 py-2 text-left font-semibold">Campaign ID</th>
                  <th className="px-3 py-2 text-right font-semibold">Spend</th>
                  <th className="px-3 py-2 text-right font-semibold">Lead generate</th>
                </tr>
              </thead>
              <tbody>
                {subCampagna.campagne_collegate.map((c, i) => (
                  <tr key={i} className="border-b border-border/60 last:border-0">
                    <td className="px-3 py-2">
                      <span className="inline-flex rounded-full bg-purple-100 px-2 py-0.5 text-xs font-medium text-purple-700">
                        {c.piattaforma}
                      </span>
                    </td>
                    <td className="px-3 py-2 font-mono text-xs">{c.campaign_id}</td>
                    <td className="px-3 py-2 text-right tabular-nums">{formatCurrency(c.spend)}</td>
                    <td className="px-3 py-2 text-right tabular-nums">{formatNumber(c.lead_generate)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="text-sm text-muted-foreground">Nessuna sorgente collegata.</p>
        )}
      </Sezione>
    </div>
  )
}

function Sezione({ icon: Icon, titolo, children }) {
  return (
    <section>
      <h4 className="mb-2 flex items-center gap-2 text-sm font-semibold text-foreground">
        <Icon className="h-4 w-4 text-brand-600" />
        {titolo}
      </h4>
      {children}
    </section>
  )
}

function Kpi({ label, value }) {
  return (
    <div className="rounded-md border border-border bg-card p-3">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="mt-0.5 text-lg font-semibold tabular-nums">{value}</p>
    </div>
  )
}
