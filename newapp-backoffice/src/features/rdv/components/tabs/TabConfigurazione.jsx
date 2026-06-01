import { useState } from 'react'
import { toast } from 'sonner'

import { cn } from '@/lib/utils'
import { Input } from '@/components/ui/input'
import { Select } from '@/components/ui/select'
import { Button } from '@/components/ui/button'
import { VERTICALI, FONTI, ALGORITMI_DISTRIBUZIONE } from '@/constants/dictionaries'
import { useUpdateRdv } from '../../hooks/useRdvDetail'
import { SubCampagneConfig } from '../SubCampagneConfig'
import { CrmWebhookConfig } from '../CrmWebhookConfig'

// Chip selezionabile (toggle) per verticali/fonti
function ChipToggle({ label, attivo, onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        'rounded-full border px-3 py-1 text-xs font-medium transition-colors',
        attivo
          ? 'border-brand-600 bg-brand-50 text-brand-600'
          : 'border-border bg-card text-muted-foreground hover:bg-muted',
      )}
    >
      {label}
    </button>
  )
}

// Tab Configurazione (sezione 9.4): parametri base + sub-campagne + CRM webhook.
export function TabConfigurazione({ rdv }) {
  const update = useUpdateRdv()

  // Stato locale del blocco "parametri base"
  const [base, setBase] = useState({
    verticali: rdv.verticali ?? [],
    fonti_accettate: rdv.fonti_accettate ?? [],
    volume_max_giornaliero: rdv.volume_max_giornaliero ?? 0,
    score_minimo: rdv.score_minimo ?? 0,
    algoritmo_distribuzione: rdv.algoritmo_distribuzione ?? 'proporzionale',
  })

  const toggleInArray = (campo, valore) =>
    setBase((b) => {
      const corr = b[campo]
      const nuovo = corr.includes(valore) ? corr.filter((x) => x !== valore) : [...corr, valore]
      return { ...b, [campo]: nuovo }
    })

  const salvaBase = () => {
    update.mutate(
      { rdvId: rdv.id, campi: base },
      {
        onSuccess: () => toast.success('Parametri base salvati.'),
        onError: (e) => toast.error(e.message ?? 'Errore durante il salvataggio.'),
      },
    )
  }

  return (
    <div className="space-y-6">
      {/* Blocco 1 — Parametri base */}
      <Blocco titolo="Parametri base">
        <div className="space-y-4">
          <div>
            <span className="mb-2 block text-sm font-medium">Verticali abilitati</span>
            <div className="flex flex-wrap gap-2">
              {VERTICALI.map((v) => (
                <ChipToggle
                  key={v}
                  label={v}
                  attivo={base.verticali.includes(v)}
                  onClick={() => toggleInArray('verticali', v)}
                />
              ))}
            </div>
          </div>

          <div>
            <span className="mb-2 block text-sm font-medium">Fonti accettate</span>
            <div className="flex flex-wrap gap-2">
              {FONTI.map((f) => (
                <ChipToggle
                  key={f}
                  label={f}
                  attivo={base.fonti_accettate.includes(f)}
                  onClick={() => toggleInArray('fonti_accettate', f)}
                />
              ))}
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <label className="block text-sm">
              <span className="mb-1 block font-medium">Volume max giornaliero</span>
              <Input
                type="number"
                min={0}
                value={base.volume_max_giornaliero}
                onChange={(e) => setBase((b) => ({ ...b, volume_max_giornaliero: Number(e.target.value) }))}
              />
            </label>
            <label className="block text-sm">
              <span className="mb-1 block font-medium">Score minimo</span>
              <Input
                type="number"
                min={0}
                max={100}
                value={base.score_minimo}
                onChange={(e) => setBase((b) => ({ ...b, score_minimo: Number(e.target.value) }))}
              />
            </label>
            <label className="block text-sm">
              <span className="mb-1 block font-medium">Algoritmo distribuzione</span>
              <Select
                value={base.algoritmo_distribuzione}
                onValueChange={(v) => setBase((b) => ({ ...b, algoritmo_distribuzione: v }))}
                options={ALGORITMI_DISTRIBUZIONE}
              />
            </label>
          </div>

          <div className="flex justify-end">
            <Button variant="brand" size="sm" onClick={salvaBase} disabled={update.isPending}>
              {update.isPending ? 'Salvataggio…' : 'Salva parametri'}
            </Button>
          </div>
        </div>
      </Blocco>

      {/* Blocco 2 — Sub-campagne */}
      <Blocco titolo="Sub-campagne attive">
        <SubCampagneConfig rdv={rdv} />
      </Blocco>

      {/* Blocco 3 — CRM webhook */}
      <Blocco titolo="Webhook CRM">
        <CrmWebhookConfig rdv={rdv} />
      </Blocco>
    </div>
  )
}

function Blocco({ titolo, children }) {
  return (
    <section className="rounded-lg border border-border bg-card p-4">
      <h4 className="mb-3 text-sm font-semibold text-foreground">{titolo}</h4>
      {children}
    </section>
  )
}
