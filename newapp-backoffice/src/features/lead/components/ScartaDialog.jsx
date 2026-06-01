import { useState } from 'react'
import { toast } from 'sonner'
import { AlertTriangle } from 'lucide-react'

import { Dialog } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { useScartaLead } from '../hooks/useRevisione'

// Dialog "Scarta" (sezione 9.6): motivazione obbligatoria → stato BLOCCATA.
export function ScartaDialog({ lead, onClose }) {
  const scarta = useScartaLead()
  const [motivazione, setMotivazione] = useState('')
  const [errore, setErrore] = useState(false)

  const chiudi = () => {
    setMotivazione('')
    setErrore(false)
    onClose()
  }

  const conferma = () => {
    if (!motivazione.trim()) {
      setErrore(true)
      return
    }
    scarta.mutate(
      { leadId: lead.id, motivazione: motivazione.trim() },
      {
        onSuccess: () => {
          toast.success('Lead scartata e bloccata.')
          chiudi()
        },
        onError: (e) => toast.error(e.message ?? 'Errore durante lo scarto.'),
      },
    )
  }

  return (
    <Dialog
      open={!!lead}
      onClose={chiudi}
      title="Scarta lead"
      description="La lead verrà bloccata e non rientrerà in distribuzione."
      footer={
        <>
          <Button variant="outline" onClick={chiudi}>Annulla</Button>
          <Button variant="destructive" onClick={conferma} disabled={scarta.isPending}>
            {scarta.isPending ? 'Scarto…' : 'Scarta e blocca'}
          </Button>
        </>
      }
    >
      {lead && (
        <div className="space-y-3">
          <div className="flex items-start gap-2 rounded-md bg-amber-50 p-3 text-sm text-amber-800">
            <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
            <span>
              Stai per scartare la lead <span className="font-mono">{lead.id}</span>. L'azione
              imposta lo stato su <strong>BLOCCATA</strong>.
            </span>
          </div>

          <label className="block text-sm">
            <span className="mb-1 block font-medium text-foreground">Motivazione *</span>
            <textarea
              value={motivazione}
              onChange={(e) => {
                setMotivazione(e.target.value)
                if (errore) setErrore(false)
              }}
              rows={3}
              placeholder="Indica il motivo dello scarto (obbligatorio)…"
              className={cn(
                'flex w-full rounded-md border bg-background px-3 py-2 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
                errore ? 'border-destructive' : 'border-input',
              )}
            />
            {errore && (
              <span className="mt-1 block text-xs text-destructive">
                La motivazione è obbligatoria.
              </span>
            )}
          </label>
        </div>
      )}
    </Dialog>
  )
}
