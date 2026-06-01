import { useState } from 'react'
import { toast } from 'sonner'

import { Input } from '@/components/ui/input'
import { Select } from '@/components/ui/select'
import { Switch } from '@/components/ui/switch'
import { Button } from '@/components/ui/button'
import { WEBHOOK_AUTH_TYPES } from '@/constants/dictionaries'
import { useUpdateRdv } from '../hooks/useRdvDetail'

// Campi del mapping CRM (lead NewApp → campo CRM RDV)
const MAPPING_FIELDS = ['nome', 'cognome', 'telefono', 'email', 'verticale', 'fascia']

// Configurazione webhook CRM della RDV (sezione 9.4, blocco 3).
// Toggle master + URL + tipo auth + field mapping + anteprima payload.
export function CrmWebhookConfig({ rdv }) {
  const update = useUpdateRdv()
  // Stato locale editabile inizializzato dal crm_webhook (può essere null)
  const iniziale = rdv.crm_webhook ?? {
    url: '',
    method: 'POST',
    auth_type: 'none',
    auth_token: '',
    mapping: {},
    attivo: false,
  }
  const [cfg, setCfg] = useState(iniziale)

  const set = (campo, valore) => setCfg((c) => ({ ...c, [campo]: valore }))
  const setMapping = (campo, valore) =>
    setCfg((c) => ({ ...c, mapping: { ...c.mapping, [campo]: valore } }))

  const salva = () => {
    update.mutate(
      { rdvId: rdv.id, campi: { crm_webhook: cfg } },
      {
        onSuccess: () => toast.success('Configurazione CRM salvata.'),
        onError: (e) => toast.error(e.message ?? 'Errore durante il salvataggio.'),
      },
    )
  }

  // Anteprima payload costruita dal mapping
  const payloadPreview = MAPPING_FIELDS.reduce((acc, campo) => {
    const chiave = cfg.mapping?.[campo]
    if (chiave) acc[chiave] = `{{${campo}}}`
    return acc
  }, {})

  return (
    <div className="space-y-4">
      {/* Toggle master */}
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium">Inoltro al CRM attivo</span>
        <Switch checked={!!cfg.attivo} onCheckedChange={(on) => set('attivo', on)} aria-label="Attiva inoltro CRM" />
      </div>

      {/* URL + metodo + auth */}
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <label className="block text-sm sm:col-span-2">
          <span className="mb-1 block font-medium">URL endpoint</span>
          <Input value={cfg.url ?? ''} onChange={(e) => set('url', e.target.value)} placeholder="https://crm.example.com/hooks/newapp" />
        </label>
        <label className="block text-sm">
          <span className="mb-1 block font-medium">Tipo autenticazione</span>
          <Select value={cfg.auth_type ?? 'none'} onValueChange={(v) => set('auth_type', v)} options={WEBHOOK_AUTH_TYPES} />
        </label>
        <label className="block text-sm">
          <span className="mb-1 block font-medium">Token / Secret</span>
          <Input
            value={cfg.auth_token ?? ''}
            onChange={(e) => set('auth_token', e.target.value)}
            disabled={cfg.auth_type === 'none'}
            placeholder={cfg.auth_type === 'none' ? 'Nessuna auth' : '••••••'}
          />
        </label>
      </div>

      {/* Field mapping */}
      <div>
        <h5 className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
          Mapping campi (NewApp → CRM)
        </h5>
        <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-3">
          {MAPPING_FIELDS.map((campo) => (
            <label key={campo} className="block text-sm">
              <span className="mb-1 block text-xs text-muted-foreground">{campo}</span>
              <Input
                value={cfg.mapping?.[campo] ?? ''}
                onChange={(e) => setMapping(campo, e.target.value)}
                placeholder={`campo CRM per ${campo}`}
              />
            </label>
          ))}
        </div>
      </div>

      {/* Anteprima payload */}
      <div>
        <h5 className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
          Anteprima payload
        </h5>
        <pre className="overflow-x-auto rounded-md bg-muted p-3 font-mono text-xs">
          {JSON.stringify(payloadPreview, null, 2)}
        </pre>
      </div>

      <div className="flex justify-end">
        <Button variant="brand" size="sm" onClick={salva} disabled={update.isPending}>
          {update.isPending ? 'Salvataggio…' : 'Salva configurazione CRM'}
        </Button>
      </div>
    </div>
  )
}
