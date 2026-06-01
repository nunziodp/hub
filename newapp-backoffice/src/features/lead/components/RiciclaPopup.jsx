import { useState } from 'react'
import { toast } from 'sonner'
import { RefreshCw } from 'lucide-react'

import { Dialog } from '@/components/ui/dialog'
import { Select } from '@/components/ui/select'
import { Button } from '@/components/ui/button'
import { ScoreBadge } from '@/components/shared/ScoreBadge'
import { rdvMock } from '@/lib/mockData'
import { useInviaRiciclo } from '../hooks/useRiciclo'

// Popup per inviare una lead in riciclo a una RDV (sezione 13, step 11).
// Mostra le RDV attive, dando priorità a quelle che accettano il verticale.
export function RiciclaPopup({ lead, onClose }) {
  const invia = useInviaRiciclo()
  const [rdvId, setRdvId] = useState('')

  // RDV attive compatibili con il verticale della lead (in cima), poi le altre
  const rdvAttive = rdvMock.filter((r) => r.stato === 'attiva')
  const compatibili = rdvAttive.filter((r) => r.verticali?.includes(lead?.settore))
  const altre = rdvAttive.filter((r) => !r.verticali?.includes(lead?.settore))
  const opzioni = [...compatibili, ...altre].map((r) => ({
    value: r.id,
    label: `${r.ragione_sociale}${r.verticali?.includes(lead?.settore) ? '' : ' (altro verticale)'}`,
  }))

  const chiudi = () => {
    setRdvId('')
    onClose()
  }

  const conferma = () => {
    if (!rdvId) {
      toast.error('Seleziona una RDV destinataria.')
      return
    }
    invia.mutate(
      { leadId: lead.id, rdvId },
      {
        onSuccess: () => {
          toast.success('Lead inviata in riciclo alla RDV.')
          chiudi()
        },
        onError: (e) => toast.error(e.message ?? 'Errore durante l’invio.'),
      },
    )
  }

  return (
    <Dialog
      open={!!lead}
      onClose={chiudi}
      title="Invia in riciclo"
      description="L’invio incrementa il contatore tentativi e ricalcola lo score (penalità riciclo)."
      footer={
        <>
          <Button variant="outline" onClick={chiudi}>Annulla</Button>
          <Button variant="brand" onClick={conferma} disabled={invia.isPending}>
            <RefreshCw className="h-4 w-4" />
            {invia.isPending ? 'Invio…' : 'Invia alla RDV'}
          </Button>
        </>
      }
    >
      {lead && (
        <div className="space-y-3 text-sm">
          <div className="flex items-center justify-between rounded-md bg-muted p-3">
            <span className="font-medium">
              {[lead.nome, lead.cognome].filter(Boolean).join(' ')} · {lead.settore}
            </span>
            <span className="flex items-center gap-2">
              <ScoreBadge fascia={lead.fascia} score={lead.score} />
              <span className="text-xs text-muted-foreground">{lead.riciclo_count}° tentativo</span>
            </span>
          </div>
          <label className="block">
            <span className="mb-1 block font-medium">RDV destinataria</span>
            <Select value={rdvId} onValueChange={setRdvId} options={opzioni} placeholder="— seleziona RDV —" />
          </label>
        </div>
      )}
    </Dialog>
  )
}
