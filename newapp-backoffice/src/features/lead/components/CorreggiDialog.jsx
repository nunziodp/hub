import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { toast } from 'sonner'

import { Dialog } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Select } from '@/components/ui/select'
import { Button } from '@/components/ui/button'
import { SETTORI, FORMATI, FONTI } from '@/constants/dictionaries'
import { parseCampaignName } from '@/lib/parseCampaignName'
import { useCorreggiLead } from '../hooks/useRevisione'

// Schema di validazione: i campi essenziali al parsing sono obbligatori,
// gli altri opzionali (sezione 10.1)
const schema = z.object({
  settore: z.string().min(1, 'Obbligatorio'),
  cliente: z.string().min(1, 'Obbligatorio'),
  campagna_cliente: z.string().min(1, 'Obbligatorio'),
  formato: z.string().min(1, 'Obbligatorio'),
  fonte: z.string().min(1, 'Obbligatorio'),
  offerta: z.string().optional(),
  creativita: z.string().optional(),
  versione: z.string().optional(),
  automazione: z.string().optional(),
})

// Dialog "Correggi" (sezione 9.6): form 10 campi campaign precompilati dal
// parsing parziale. Al salvataggio aggiorna parsing_ok e ricalcola lo score.
export function CorreggiDialog({ lead, onClose }) {
  const correggi = useCorreggiLead()
  const parsed = lead ? parseCampaignName(lead.campaign_name_raw) : { fields: {} }

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm({
    resolver: zodResolver(schema),
    // Precompila con i valori già estratti (o quelli presenti sulla lead)
    values: {
      settore: lead?.settore ?? parsed.fields.settore ?? '',
      cliente: lead?.cliente ?? parsed.fields.cliente ?? '',
      campagna_cliente: lead?.campagna_cliente ?? parsed.fields.campagna_cliente ?? '',
      offerta: lead?.offerta ?? parsed.fields.offerta ?? '',
      creativita: lead?.creativita ?? parsed.fields.creativita ?? '',
      formato: lead?.formato ?? parsed.fields.formato ?? '',
      fonte: lead?.fonte ?? parsed.fields.fonte ?? '',
      versione: lead?.versione ?? parsed.fields.versione ?? '',
      automazione: lead?.automazione ?? parsed.fields.automazione ?? '',
    },
  })

  const onSubmit = (campi) => {
    correggi.mutate(
      { leadId: lead.id, campi },
      {
        onSuccess: () => {
          toast.success('Lead corretta e ripristinata in distribuzione.')
          reset()
          onClose()
        },
        onError: (e) => toast.error(e.message ?? 'Errore durante la correzione.'),
      },
    )
  }

  return (
    <Dialog
      open={!!lead}
      onClose={onClose}
      size="lg"
      title="Correggi lead"
      description="Verifica e completa i campi estratti dal campaign name."
      footer={
        <>
          <Button variant="outline" onClick={onClose}>Annulla</Button>
          <Button variant="brand" onClick={handleSubmit(onSubmit)} disabled={correggi.isPending}>
            {correggi.isPending ? 'Salvataggio…' : 'Salva e ricalcola score'}
          </Button>
        </>
      }
    >
      {lead && (
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          {/* Raw originale come riferimento */}
          <div className="rounded-md bg-muted p-3 font-mono text-xs break-all">
            {lead.campaign_name_raw || '—'}
          </div>

          <div className="grid grid-cols-2 gap-3">
            <CampoSelect label="Settore *" options={SETTORI} error={errors.settore} {...register('settore')} />
            <CampoInput label="Cliente *" error={errors.cliente} {...register('cliente')} />
            <CampoInput label="Campagna cliente *" error={errors.campagna_cliente} {...register('campagna_cliente')} />
            <CampoInput label="Offerta" {...register('offerta')} />
            <CampoInput label="Creatività" {...register('creativita')} />
            <CampoSelect label="Formato *" options={FORMATI} error={errors.formato} {...register('formato')} />
            <CampoSelect label="Fonte *" options={FONTI} error={errors.fonte} {...register('fonte')} />
            <CampoInput label="Versione" {...register('versione')} />
            <CampoInput label="Automazione" {...register('automazione')} />
          </div>
        </form>
      )}
    </Dialog>
  )
}

// Campo testo con label ed errore
function CampoInput({ label, error, ...props }) {
  return (
    <label className="block text-sm">
      <span className="mb-1 block font-medium text-foreground">{label}</span>
      <Input {...props} />
      {error && <span className="mt-1 block text-xs text-destructive">{error.message}</span>}
    </label>
  )
}

// Campo select con label ed errore. Usa il <select> nativo via register,
// quindi accetta options come array di stringhe e include l'opzione vuota.
function CampoSelect({ label, options, error, ...props }) {
  return (
    <label className="block text-sm">
      <span className="mb-1 block font-medium text-foreground">{label}</span>
      <Select {...props} placeholder="— seleziona —" options={options} />
      {error && <span className="mt-1 block text-xs text-destructive">{error.message}</span>}
    </label>
  )
}
