import { useForm, Controller } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { toast } from 'sonner'

import { Dialog } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Select } from '@/components/ui/select'
import { Slider } from '@/components/ui/slider'
import { Switch } from '@/components/ui/switch'
import { Button } from '@/components/ui/button'
import { FORMATI } from '@/constants/dictionaries'
import { useCreaSubCampagna } from '../hooks/useCampagne'

// Schema form nuova sub-campagna (sezione 9.2)
const schema = z.object({
  nome: z.string().min(2, 'Inserisci un nome (min. 2 caratteri)'),
  formato: z.string().min(1, 'Seleziona un formato'),
  punteggio_base: z.number().min(1).max(100),
  soglia_alert_ore: z.number().min(1, 'Min. 1 ora').max(72, 'Max. 72 ore'),
  stato: z.enum(['attiva', 'in_pausa']),
})

// Dialog di creazione sub-campagna sotto un verticale specifico.
// Props: verticale ({id, nome}) | null, onClose()
export function NuovaSubCampagnaForm({ verticale, onClose }) {
  const crea = useCreaSubCampagna()

  const {
    register,
    handleSubmit,
    control,
    reset,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(schema),
    defaultValues: {
      nome: '',
      formato: '',
      punteggio_base: 50,
      soglia_alert_ore: 4,
      stato: 'attiva',
    },
  })

  const chiudi = () => {
    reset()
    onClose()
  }

  const onSubmit = (valori) => {
    crea.mutate(
      { verticale_id: verticale.id, ...valori },
      {
        onSuccess: () => {
          toast.success(`Sub-campagna "${valori.nome}" creata.`)
          chiudi()
        },
        onError: (e) => toast.error(e.message ?? 'Errore durante la creazione.'),
      },
    )
  }

  return (
    <Dialog
      open={!!verticale}
      onClose={chiudi}
      title="Nuova sub-campagna"
      description={verticale ? `Verticale: ${verticale.nome}` : undefined}
      footer={
        <>
          <Button variant="outline" onClick={chiudi}>Annulla</Button>
          <Button variant="brand" onClick={handleSubmit(onSubmit)} disabled={crea.isPending}>
            {crea.isPending ? 'Creazione…' : 'Crea sub-campagna'}
          </Button>
        </>
      }
    >
      {verticale && (
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          {/* Nome */}
          <label className="block text-sm">
            <span className="mb-1 block font-medium">Nome</span>
            <Input {...register('nome')} placeholder="Es. Energia Chatbot Premium" />
            {errors.nome && <span className="mt-1 block text-xs text-destructive">{errors.nome.message}</span>}
          </label>

          {/* Formato */}
          <label className="block text-sm">
            <span className="mb-1 block font-medium">Formato</span>
            <Select {...register('formato')} placeholder="— seleziona —" options={FORMATI} />
            {errors.formato && <span className="mt-1 block text-xs text-destructive">{errors.formato.message}</span>}
          </label>

          {/* Punteggio base (Slider 1-100) */}
          <Controller
            control={control}
            name="punteggio_base"
            render={({ field }) => (
              <div className="text-sm">
                <div className="mb-1 flex items-center justify-between">
                  <span className="font-medium">Punteggio base</span>
                  <span className="font-semibold tabular-nums text-brand-600">{field.value}</span>
                </div>
                <Slider value={field.value} onValueChange={field.onChange} min={1} max={100} />
              </div>
            )}
          />

          {/* Soglia alert ore */}
          <label className="block text-sm">
            <span className="mb-1 block font-medium">Soglia alert (ore senza lead)</span>
            <Input type="number" min={1} max={72} {...register('soglia_alert_ore', { valueAsNumber: true })} />
            {errors.soglia_alert_ore && <span className="mt-1 block text-xs text-destructive">{errors.soglia_alert_ore.message}</span>}
          </label>

          {/* Stato (Switch attiva / in pausa) */}
          <Controller
            control={control}
            name="stato"
            render={({ field }) => (
              <div className="flex items-center justify-between text-sm">
                <span className="font-medium">Attiva alla creazione</span>
                <Switch
                  checked={field.value === 'attiva'}
                  onCheckedChange={(v) => field.onChange(v ? 'attiva' : 'in_pausa')}
                  aria-label="Stato sub-campagna"
                />
              </div>
            )}
          />
        </form>
      )}
    </Dialog>
  )
}
