import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { toast } from 'sonner'

import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { useUpdateRdv } from '../../hooks/useRdvDetail'

// Validazione minima: ragione sociale obbligatoria, email valida se presente
const schema = z.object({
  ragione_sociale: z.string().min(2, 'Obbligatoria'),
  piva: z.string().optional(),
  codice_fiscale: z.string().optional(),
  sdi: z.string().optional(),
  pec: z.string().optional(),
  sede_via: z.string().optional(),
  sede_cap: z.string().optional(),
  sede_citta: z.string().optional(),
  telefono: z.string().optional(),
  email_amministrativa: z.string().email('Email non valida').optional().or(z.literal('')),
  referente_nome: z.string().optional(),
  referente_email: z.string().email('Email non valida').optional().or(z.literal('')),
  referente_telefono: z.string().optional(),
})

const CAMPI = [
  ['ragione_sociale', 'Ragione sociale'],
  ['piva', 'P.IVA'],
  ['codice_fiscale', 'Codice fiscale'],
  ['sdi', 'Codice SDI'],
  ['pec', 'PEC'],
  ['sede_via', 'Sede — via'],
  ['sede_cap', 'Sede — CAP'],
  ['sede_citta', 'Sede — città'],
  ['telefono', 'Telefono'],
  ['email_amministrativa', 'Email amministrativa'],
  ['referente_nome', 'Referente — nome'],
  ['referente_email', 'Referente — email'],
  ['referente_telefono', 'Referente — telefono'],
]

// Tab Anagrafica (sezione 9.4): tutti i campi identificativi, editabili con Salva.
export function TabAnagrafica({ rdv }) {
  const update = useUpdateRdv()

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isDirty },
  } = useForm({
    resolver: zodResolver(schema),
    values: CAMPI.reduce((acc, [campo]) => {
      acc[campo] = rdv[campo] ?? ''
      return acc
    }, {}),
  })

  const onSubmit = (campi) => {
    update.mutate(
      { rdvId: rdv.id, campi },
      {
        onSuccess: () => {
          toast.success('Anagrafica aggiornata.')
          reset(campi)
        },
        onError: (e) => toast.error(e.message ?? 'Errore durante il salvataggio.'),
      },
    )
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {CAMPI.map(([campo, label]) => (
          <label key={campo} className="block text-sm">
            <span className="mb-1 block font-medium text-foreground">{label}</span>
            <Input {...register(campo)} />
            {errors[campo] && (
              <span className="mt-1 block text-xs text-destructive">{errors[campo].message}</span>
            )}
          </label>
        ))}
      </div>

      <div className="flex justify-end">
        <Button type="submit" variant="brand" disabled={!isDirty || update.isPending}>
          {update.isPending ? 'Salvataggio…' : 'Salva modifiche'}
        </Button>
      </div>
    </form>
  )
}
