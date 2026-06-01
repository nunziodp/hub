import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { toast } from 'sonner'

import { Dialog } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Select } from '@/components/ui/select'
import { Button } from '@/components/ui/button'
import { rdvMock } from '@/lib/mockData'
import { useCreaPacchetto } from '../hooks/useListeFredde'

const schema = z.object({
  nome: z.string().min(2, 'Inserisci un nome (min. 2 caratteri)'),
  rdv_id: z.string().optional(),
  prezzo_per_lead: z.number().positive('Inserisci un prezzo maggiore di 0'),
  scadenza_at: z.string().optional(),
  note: z.string().optional(),
})

// Dialog "Crea pacchetto" (sezione 9.7) dalle lead selezionate.
// Props: leadIds (string[]) | null, onClose()
export function CreaPacchettoDialog({ leadIds, onClose }) {
  const crea = useCreaPacchetto()
  const aperto = Array.isArray(leadIds) && leadIds.length > 0

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(schema),
    defaultValues: { nome: '', rdv_id: '', prezzo_per_lead: 3, scadenza_at: '', note: '' },
  })

  const chiudi = () => {
    reset()
    onClose()
  }

  const onSubmit = (valori) => {
    crea.mutate(
      { ...valori, leadIds },
      {
        onSuccess: () => {
          toast.success(`Pacchetto "${valori.nome}" creato con ${leadIds.length} lead.`)
          chiudi()
        },
        onError: (e) => toast.error(e.message ?? 'Errore durante la creazione.'),
      },
    )
  }

  // Opzioni RDV: "Tutte" (value vuoto via placeholder) + RDV esistenti
  const rdvOptions = rdvMock.map((r) => ({ value: r.id, label: r.ragione_sociale }))

  return (
    <Dialog
      open={aperto}
      onClose={chiudi}
      title="Crea pacchetto"
      description={aperto ? `${leadIds.length} lead selezionate` : undefined}
      footer={
        <>
          <Button variant="outline" onClick={chiudi}>Annulla</Button>
          <Button variant="brand" onClick={handleSubmit(onSubmit)} disabled={crea.isPending}>
            {crea.isPending ? 'Creazione…' : 'Crea pacchetto'}
          </Button>
        </>
      }
    >
      {aperto && (
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <label className="block text-sm">
            <span className="mb-1 block font-medium">Nome pacchetto</span>
            <Input {...register('nome')} placeholder="Es. Energia Silver Giugno" />
            {errors.nome && <span className="mt-1 block text-xs text-destructive">{errors.nome.message}</span>}
          </label>

          <div className="grid grid-cols-2 gap-3">
            <label className="block text-sm">
              <span className="mb-1 block font-medium">RDV destinataria</span>
              <Select {...register('rdv_id')} placeholder="Tutte le RDV" options={rdvOptions} />
            </label>
            <label className="block text-sm">
              <span className="mb-1 block font-medium">Prezzo per lead (€)</span>
              <Input type="number" step="0.01" {...register('prezzo_per_lead', { valueAsNumber: true })} />
              {errors.prezzo_per_lead && (
                <span className="mt-1 block text-xs text-destructive">{errors.prezzo_per_lead.message}</span>
              )}
            </label>
          </div>

          <label className="block text-sm">
            <span className="mb-1 block font-medium">Scadenza</span>
            <Input type="date" {...register('scadenza_at')} />
          </label>

          <label className="block text-sm">
            <span className="mb-1 block font-medium">Note</span>
            <Input {...register('note')} placeholder="Opzionale" />
          </label>
        </form>
      )}
    </Dialog>
  )
}
