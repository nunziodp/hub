import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Pause, Play, AlertTriangle } from 'lucide-react'
import { toast } from 'sonner'

import { formatDate } from '@/lib/utils'
import { ROUTES } from '@/constants/routes'
import { DataTable } from '@/components/shared/DataTable'
import { StatusBadge } from '@/components/shared/StatusBadge'
import { TierBadge } from '@/components/shared/TierBadge'
import { Dialog } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { useToggleStatoRdv } from '../hooks/useRdvList'

// Chip dei verticali abilitati
function VerticaliChips({ verticali }) {
  if (!verticali?.length) return <span className="text-muted-foreground">—</span>
  return (
    <div className="flex flex-wrap gap-1">
      {verticali.map((v) => (
        <span key={v} className="inline-flex rounded bg-muted px-1.5 py-0.5 text-xs font-medium text-foreground">
          {v}
        </span>
      ))}
    </div>
  )
}

// Tabella RDV (sezione 9.3) con click su riga → scheda e toggle sospendi/riattiva.
export function RdvTable({ data, isLoading }) {
  const navigate = useNavigate()
  const toggle = useToggleStatoRdv()
  // RDV target del dialog di conferma
  const [confermaRdv, setConfermaRdv] = useState(null)

  const sospendendo = confermaRdv?.stato === 'attiva'
  const nuovoStato = sospendendo ? 'sospesa' : 'attiva'

  const conferma = () => {
    toggle.mutate(
      { rdvId: confermaRdv.id, nuovoStato },
      {
        onSuccess: () => {
          toast.success(sospendendo ? 'RDV sospesa.' : 'RDV riattivata.')
          setConfermaRdv(null)
        },
        onError: (e) => toast.error(e.message ?? 'Errore aggiornamento stato.'),
      },
    )
  }

  const columns = [
    {
      accessorKey: 'ragione_sociale',
      header: 'Ragione sociale',
      cell: ({ getValue }) => <span className="font-medium">{getValue()}</span>,
    },
    { accessorKey: 'tier', header: 'Tier', cell: ({ getValue }) => <TierBadge tier={getValue()} /> },
    { accessorKey: 'stato', header: 'Stato', cell: ({ getValue }) => <StatusBadge stato={getValue()} /> },
    { accessorKey: 'piva', header: 'P.IVA', cell: ({ getValue }) => <span className="font-mono text-xs">{getValue() || '—'}</span> },
    { accessorKey: 'referente_nome', header: 'Referente', cell: ({ getValue }) => getValue() || '—' },
    {
      accessorKey: 'verticali',
      header: 'Verticali',
      enableSorting: false,
      cell: ({ getValue }) => <VerticaliChips verticali={getValue()} />,
    },
    { accessorKey: 'created_at', header: 'Iscrizione', cell: ({ getValue }) => formatDate(getValue()) },
    {
      id: 'azioni',
      header: 'Azioni',
      enableSorting: false,
      cell: ({ row }) => {
        const attiva = row.original.stato === 'attiva'
        // L'azione ha senso solo per RDV attive/sospese (non archiviate/in_prova chiuse)
        const toggleabile = attiva || row.original.stato === 'sospesa'
        if (!toggleabile) return <span className="text-muted-foreground">—</span>
        return (
          <div onClick={(e) => e.stopPropagation()}>
            <Button variant="outline" size="sm" onClick={() => setConfermaRdv(row.original)}>
              {attiva ? <Pause className="h-3.5 w-3.5" /> : <Play className="h-3.5 w-3.5" />}
              {attiva ? 'Sospendi' : 'Riattiva'}
            </Button>
          </div>
        )
      },
    },
  ]

  return (
    <>
      <DataTable
        columns={columns}
        data={data}
        isLoading={isLoading}
        getRowId={(r) => r.id}
        onRowClick={(r) => navigate(ROUTES.rdvDettaglio(r.id))}
      />

      {/* Dialog conferma con messaggio dinamico sulle lead in coda */}
      <Dialog
        open={!!confermaRdv}
        onClose={() => setConfermaRdv(null)}
        title={sospendendo ? 'Sospendi RDV' : 'Riattiva RDV'}
        footer={
          <>
            <Button variant="outline" onClick={() => setConfermaRdv(null)}>Annulla</Button>
            <Button
              variant={sospendendo ? 'destructive' : 'brand'}
              onClick={conferma}
              disabled={toggle.isPending}
            >
              {toggle.isPending ? 'Aggiornamento…' : sospendendo ? 'Sospendi' : 'Riattiva'}
            </Button>
          </>
        }
      >
        {confermaRdv && (
          <div className="flex items-start gap-2 text-sm">
            {sospendendo && <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-amber-500" />}
            <p>
              {sospendendo ? (
                <>
                  Stai per sospendere <strong>{confermaRdv.ragione_sociale}</strong>.{' '}
                  {confermaRdv._leadInCoda > 0 ? (
                    <>
                      Ci sono <strong>{confermaRdv._leadInCoda}</strong>{' '}
                      {confermaRdv._leadInCoda === 1 ? 'lead in coda' : 'lead in coda'} che
                      non verranno più distribuite finché resta sospesa.
                    </>
                  ) : (
                    <>Non ci sono lead in coda al momento.</>
                  )}
                </>
              ) : (
                <>
                  Stai per riattivare <strong>{confermaRdv.ragione_sociale}</strong>. La
                  distribuzione delle lead riprenderà secondo la configurazione attuale.
                </>
              )}
            </p>
          </div>
        )}
      </Dialog>
    </>
  )
}
