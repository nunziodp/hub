import { toast } from 'sonner'

import { Switch } from '@/components/ui/switch'
import { StatusBadge } from '@/components/shared/StatusBadge'
import { verticaliMock, subCampagneMock } from '@/lib/mockData'
import { useUpdateRdv } from '../hooks/useRdvDetail'

// Configurazione sub-campagne attive per la RDV (sezione 9.4, blocco 2).
// Mostra una sezione per ogni verticale abilitato con un toggle per ciascuna
// sub-campagna; il toggle aggiorna l'array sub_campagne_attive.
export function SubCampagneConfig({ rdv }) {
  const update = useUpdateRdv()
  const attive = rdv.sub_campagne_attive ?? []

  const toggle = (subId, on) => {
    const nuove = on ? [...new Set([...attive, subId])] : attive.filter((id) => id !== subId)
    update.mutate(
      { rdvId: rdv.id, campi: { sub_campagne_attive: nuove } },
      { onError: (e) => toast.error(e.message ?? 'Errore aggiornamento.') },
    )
  }

  // Verticali abilitati sulla RDV (per nome) → relativi id
  const verticaliAbilitati = verticaliMock.filter((v) => rdv.verticali?.includes(v.nome))

  if (verticaliAbilitati.length === 0) {
    return (
      <p className="text-sm text-muted-foreground">
        Nessun verticale abilitato. Attiva almeno un verticale nei parametri base.
      </p>
    )
  }

  return (
    <div className="space-y-4">
      {verticaliAbilitati.map((v) => {
        const subs = subCampagneMock.filter((s) => s.verticale_id === v.id)
        return (
          <div key={v.id}>
            <h5 className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              {v.nome}
            </h5>
            <div className="divide-y divide-border rounded-md border border-border">
              {subs.length === 0 ? (
                <p className="p-3 text-sm text-muted-foreground">Nessuna sub-campagna.</p>
              ) : (
                subs.map((s) => (
                  <div key={s.id} className="flex items-center justify-between gap-3 p-3">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium">{s.nome}</span>
                      <StatusBadge stato={s.stato} />
                    </div>
                    <Switch
                      checked={attive.includes(s.id)}
                      onCheckedChange={(on) => toggle(s.id, on)}
                      aria-label={`Attiva ${s.nome}`}
                    />
                  </div>
                ))
              )}
            </div>
          </div>
        )
      })}
    </div>
  )
}
