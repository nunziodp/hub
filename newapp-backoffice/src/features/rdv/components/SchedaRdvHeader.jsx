import { Pencil, Pause, Play, Archive } from 'lucide-react'
import { toast } from 'sonner'

import { formatDateOnly } from '@/lib/utils'
import { StatusBadge } from '@/components/shared/StatusBadge'
import { TierBadge } from '@/components/shared/TierBadge'
import { Button } from '@/components/ui/button'

// Iniziali (2 lettere) dalla ragione sociale per l'avatar
function iniziali(nome) {
  if (!nome) return '—'
  const parole = nome.trim().split(/\s+/)
  const a = parole[0]?.[0] ?? ''
  const b = parole[1]?.[0] ?? parole[0]?.[1] ?? ''
  return (a + b).toUpperCase()
}

// Header scheda RDV (sezione 9.4): avatar + identità + meta + azioni.
// Props: rdv, onModifica(), onToggleStato()
export function SchedaRdvHeader({ rdv, onModifica, onToggleStato }) {
  const attiva = rdv.stato === 'attiva'
  // Archivia disponibile solo se nessuna lead è stata consegnata
  const archiviabile = (rdv._kpi?.consegnate ?? 0) === 0

  return (
    <div className="mb-6 rounded-lg border border-border bg-card p-5">
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-start gap-4">
          {/* Avatar iniziali */}
          <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-brand-600 text-lg font-semibold text-white">
            {iniziali(rdv.ragione_sociale)}
          </div>
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="text-xl font-semibold tracking-tight text-foreground">
                {rdv.ragione_sociale}
              </h1>
              <TierBadge tier={rdv.tier} />
              <StatusBadge stato={rdv.stato} />
            </div>
            <p className="mt-1 text-sm text-muted-foreground">
              P.IVA {rdv.piva || '—'} · iscritta il {formatDateOnly(rdv.created_at)} ·
              referente {rdv.referente_nome || '—'} ·{' '}
              {rdv.commerciale_id ? 'commerciale assegnato' : 'nessun commerciale'}
            </p>
          </div>
        </div>

        {/* Azioni */}
        <div className="flex shrink-0 items-center gap-2">
          <Button variant="outline" size="sm" onClick={onModifica}>
            <Pencil className="h-4 w-4" />
            Modifica
          </Button>
          <Button variant="outline" size="sm" onClick={onToggleStato}>
            {attiva ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
            {attiva ? 'Sospendi' : 'Riattiva'}
          </Button>
          {archiviabile && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => toast.info('Archiviazione disponibile dopo il collegamento a Supabase.')}
            >
              <Archive className="h-4 w-4" />
              Archivia
            </Button>
          )}
        </div>
      </div>
    </div>
  )
}
