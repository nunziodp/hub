import { useState } from 'react'
import { AlertTriangle, Plus, Pencil } from 'lucide-react'
import { toast } from 'sonner'

import { formatCurrency } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Dialog } from '@/components/ui/dialog'
import { Skeleton } from '@/components/ui/skeleton'
import { useRdvWallet, useMovimentoWallet } from '../../hooks/useRdvDetail'
import { WalletMovements } from '../WalletMovements'

// Tab Wallet (sezione 9.4): alert credito + KPI + tabella movimenti + azioni.
export function TabWallet({ rdv }) {
  const { data, isLoading } = useRdvWallet(rdv.id)
  const movimento = useMovimentoWallet()
  // Dialog azione: { tipo: 'ricarica' | 'rettifica' } | null
  const [azione, setAzione] = useState(null)
  const [importo, setImporto] = useState('')
  const [descrizione, setDescrizione] = useState('')

  if (isLoading) return <Skeleton className="h-64 w-full" />
  if (!data) return null

  const sottoSoglia = data.saldo < data.sogliaAlert

  const apri = (tipo) => {
    setAzione({ tipo })
    setImporto('')
    setDescrizione('')
  }

  const conferma = () => {
    const val = Number(importo)
    if (!val || Number.isNaN(val)) {
      toast.error('Inserisci un importo valido.')
      return
    }
    // La ricarica è positiva; la rettifica può essere positiva o negativa
    const importoFinale = azione.tipo === 'ricarica' ? Math.abs(val) : val
    movimento.mutate(
      { rdvId: rdv.id, tipo: azione.tipo, importo: importoFinale, descrizione: descrizione || (azione.tipo === 'ricarica' ? 'Ricarica manuale' : 'Rettifica manuale') },
      {
        onSuccess: () => {
          toast.success(azione.tipo === 'ricarica' ? 'Ricarica registrata.' : 'Rettifica registrata.')
          setAzione(null)
        },
        onError: (e) => toast.error(e.message ?? 'Errore durante il movimento.'),
      },
    )
  }

  return (
    <div className="space-y-6">
      {/* Alert credito */}
      {sottoSoglia && (
        <div className="flex items-center gap-2 rounded-md bg-amber-50 p-3 text-sm text-amber-800">
          <AlertTriangle className="h-4 w-4 shrink-0" />
          Credito sotto la soglia di alert ({formatCurrency(data.sogliaAlert)}). Valuta una ricarica.
        </div>
      )}

      {/* KPI + azioni */}
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div className="grid grid-cols-3 gap-4">
          <Kpi label="Saldo attuale" value={formatCurrency(data.saldo)} />
          <Kpi label="Addebiti" value={formatCurrency(data.kpi.addebiti)} />
          <Kpi label="Ricariche" value={formatCurrency(data.kpi.ricariche)} />
        </div>
        <div className="flex gap-2">
          <Button variant="brand" size="sm" onClick={() => apri('ricarica')}>
            <Plus className="h-4 w-4" />
            Ricarica
          </Button>
          <Button variant="outline" size="sm" onClick={() => apri('rettifica')}>
            <Pencil className="h-4 w-4" />
            Rettifica
          </Button>
        </div>
      </div>

      {/* Movimenti */}
      <div>
        <h4 className="mb-2 text-sm font-semibold">Movimenti</h4>
        <WalletMovements movimenti={data.movimenti} />
      </div>

      {/* Dialog azione */}
      <Dialog
        open={!!azione}
        onClose={() => setAzione(null)}
        title={azione?.tipo === 'ricarica' ? 'Ricarica wallet' : 'Rettifica wallet'}
        description={
          azione?.tipo === 'rettifica'
            ? 'Importo positivo per accreditare, negativo per addebitare.'
            : undefined
        }
        footer={
          <>
            <Button variant="outline" onClick={() => setAzione(null)}>Annulla</Button>
            <Button variant="brand" onClick={conferma} disabled={movimento.isPending}>
              {movimento.isPending ? 'Registrazione…' : 'Conferma'}
            </Button>
          </>
        }
      >
        <div className="space-y-3">
          <label className="block text-sm">
            <span className="mb-1 block font-medium">Importo (€)</span>
            <Input type="number" step="0.01" value={importo} onChange={(e) => setImporto(e.target.value)} placeholder="0,00" />
          </label>
          <label className="block text-sm">
            <span className="mb-1 block font-medium">Descrizione</span>
            <Input value={descrizione} onChange={(e) => setDescrizione(e.target.value)} placeholder="Opzionale" />
          </label>
        </div>
      </Dialog>
    </div>
  )
}

function Kpi({ label, value }) {
  return (
    <div className="rounded-lg border border-border bg-card p-4">
      <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">{label}</p>
      <p className="mt-1 text-xl font-semibold tabular-nums">{value}</p>
    </div>
  )
}
