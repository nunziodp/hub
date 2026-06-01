import { useMemo, useState } from 'react'
import { ShieldCheck, ShieldAlert, ShieldX, Inbox, Search, FileDown, Ban } from 'lucide-react'
import { toast } from 'sonner'

import { formatDate, formatDateOnly, maskPhone } from '@/lib/utils'
import { ScreenHeader } from '@/components/shared/ScreenHeader'
import { DataTable } from '@/components/shared/DataTable'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select } from '@/components/ui/select'
import { Dialog } from '@/components/ui/dialog'
import { Skeleton } from '@/components/ui/skeleton'
import { useGdprData, useRevocaTotale, findLeadsByContatto } from './hooks/useGdpr'

// Genera un documento stampabile (PDF via stampa browser) con i dati del soggetto.
function esportaSoggetto(contatto, leads) {
  const righe = leads
    .map(
      (l) => `
      <tr>
        <td>${l.id}</td>
        <td>${[l.nome, l.cognome].filter(Boolean).join(' ')}</td>
        <td>${l.telefono ?? ''}</td>
        <td>${l.email ?? ''}</td>
        <td>${l.consent_source ?? ''}</td>
        <td>${l.consent_date ?? ''}</td>
        <td>${l.consent_expires_at ?? ''}</td>
        <td>${l.stato}</td>
      </tr>`,
    )
    .join('')

  const html = `<!doctype html><html lang="it"><head><meta charset="utf-8">
    <title>Export GDPR — ${contatto}</title>
    <style>
      body { font-family: sans-serif; padding: 24px; color: #0f172a; }
      h1 { font-size: 18px; } table { width: 100%; border-collapse: collapse; font-size: 12px; margin-top: 12px; }
      th, td { border: 1px solid #cbd5e1; padding: 6px 8px; text-align: left; }
      th { background: #f1f5f9; }
    </style></head><body>
      <h1>Export soggetto interessato</h1>
      <p>Contatto: <strong>${contatto}</strong> — generato il ${new Date().toLocaleString('it-IT')}</p>
      <table><thead><tr>
        <th>ID</th><th>Nominativo</th><th>Telefono</th><th>Email</th>
        <th>Fonte consenso</th><th>Data consenso</th><th>Scadenza</th><th>Stato</th>
      </tr></thead><tbody>${righe}</tbody></table>
    </body></html>`

  const w = window.open('', '_blank')
  if (!w) {
    toast.error('Abilita i popup per generare il PDF.')
    return
  }
  w.document.write(html)
  w.document.close()
  w.focus()
  w.print()
}

export default function StatGdprPage() {
  const { data, isLoading } = useGdprData()
  const revoca = useRevocaTotale()

  const [contatto, setContatto] = useState('')
  const [contattoExport, setContattoExport] = useState('')
  const [confermaRevoca, setConfermaRevoca] = useState(false)

  // Filtri audit trail
  const [filtroAzione, setFiltroAzione] = useState('')
  const [filtroPeriodo, setFiltroPeriodo] = useState('')

  // Lead trovate per la revoca (anteprima) — filtra sull'elenco già caricato
  const leadRevoca = useMemo(() => findLeadsByContatto(contatto, data?.leads ?? []), [contatto, data])

  const auditFiltrato = useMemo(() => {
    if (!data) return []
    const giorni = filtroPeriodo === '7' ? 7 : filtroPeriodo === '30' ? 30 : null
    const sogliaMs = giorni ? giorni * 24 * 3_600_000 : null
    return data.auditTrail.filter((e) => {
      if (filtroAzione && e.azione !== filtroAzione) return false
      if (sogliaMs && e._ageMs > sogliaMs) return false
      return true
    })
  }, [data, filtroAzione, filtroPeriodo])

  const azioniDisponibili = useMemo(
    () => [...new Set((data?.auditTrail ?? []).map((e) => e.azione))],
    [data],
  )

  const eseguiRevoca = () => {
    revoca.mutate(
      { contatto },
      {
        onSuccess: ({ count }) => {
          toast.success(`Revoca eseguita su ${count} lead.`)
          setConfermaRevoca(false)
          setContatto('')
        },
        onError: (e) => toast.error(e.message ?? 'Errore durante la revoca.'),
      },
    )
  }

  const eseguiExport = () => {
    const leads = findLeadsByContatto(contattoExport, data?.leads ?? [])
    if (leads.length === 0) {
      toast.error('Nessuna lead trovata per il contatto indicato.')
      return
    }
    esportaSoggetto(contattoExport, leads)
  }

  // Colonne tabella scadenze
  const scadenzeColumns = [
    { accessorKey: 'id', header: 'ID', cell: ({ getValue }) => <span className="font-mono text-xs">{getValue()}</span> },
    { accessorKey: 'nome', header: 'Nominativo', cell: ({ row }) => [row.original.nome, row.original.cognome].filter(Boolean).join(' ') || '—' },
    { accessorKey: 'telefono', header: 'Telefono', cell: ({ getValue }) => <span className="font-mono text-xs">{maskPhone(getValue())}</span> },
    { accessorKey: 'consent_source', header: 'Fonte consenso' },
    { accessorKey: 'consent_expires_at', header: 'Scade il', cell: ({ getValue }) => formatDateOnly(getValue()) },
  ]

  // Colonne audit trail
  const auditColumns = [
    { accessorKey: 'at', header: 'Quando', cell: ({ getValue }) => formatDate(getValue()) },
    { accessorKey: 'azione', header: 'Azione', cell: ({ getValue }) => <span className="font-medium">{getValue()}</span> },
    { accessorKey: 'source', header: 'Origine' },
    { accessorKey: 'lead_id', header: 'Lead', cell: ({ getValue }) => <span className="font-mono text-xs">{getValue()}</span> },
    { accessorKey: 'telefono', header: 'Telefono', cell: ({ getValue }) => <span className="font-mono text-xs">{maskPhone(getValue())}</span> },
  ]

  if (isLoading) {
    return (
      <>
        <ScreenHeader title="Report GDPR" subtitle="Consensi, scadenze, revoche e audit trail" />
        <Skeleton className="h-64 w-full" />
      </>
    )
  }

  return (
    <>
      <ScreenHeader title="Report GDPR" subtitle="Consensi, scadenze, revoche e audit trail" />

      {/* KPI */}
      <div className="mb-6 grid grid-cols-2 gap-4 lg:grid-cols-4">
        <Kpi label="Consensi validi" value={data.kpi.consensiValidi} icon={<ShieldCheck className="h-4 w-4 text-emerald-500" />} />
        <Kpi label="In scadenza 30gg" value={data.kpi.inScadenza30} icon={<ShieldAlert className="h-4 w-4 text-amber-500" />} />
        <Kpi label="Scaduti" value={data.kpi.scaduti} icon={<ShieldX className="h-4 w-4 text-red-500" />} />
        <Kpi label="Richieste accesso aperte" value={data.kpi.richiesteAccessoAperte} icon={<Inbox className="h-4 w-4 text-sky-500" />} />
      </div>

      {/* Azioni: revoca + export */}
      <div className="mb-6 grid grid-cols-1 gap-4 lg:grid-cols-2">
        {/* Revoca totale */}
        <div className="rounded-lg border border-border bg-card p-4">
          <h4 className="mb-1 text-sm font-semibold">Revoca totale consenso</h4>
          <p className="mb-3 text-xs text-muted-foreground">
            Cerca per telefono o email e revoca il consenso su tutte le lead del contatto.
          </p>
          <div className="flex gap-2">
            <div className="relative flex-1">
              <Search className="pointer-events-none absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input value={contatto} onChange={(e) => setContatto(e.target.value)} placeholder="Telefono o email" className="pl-8" />
            </div>
            <Button variant="destructive" disabled={leadRevoca.length === 0} onClick={() => setConfermaRevoca(true)}>
              <Ban className="h-4 w-4" />
              Revoca totale
            </Button>
          </div>
          {contatto && (
            <p className="mt-2 text-xs text-muted-foreground">
              {leadRevoca.length} lead trovate per «{contatto}».
            </p>
          )}
        </div>

        {/* Export soggetto */}
        <div className="rounded-lg border border-border bg-card p-4">
          <h4 className="mb-1 text-sm font-semibold">Export soggetto interessato</h4>
          <p className="mb-3 text-xs text-muted-foreground">
            Genera un PDF con tutti i dati del contatto (stampa browser).
          </p>
          <div className="flex gap-2">
            <div className="relative flex-1">
              <Search className="pointer-events-none absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input value={contattoExport} onChange={(e) => setContattoExport(e.target.value)} placeholder="Telefono o email" className="pl-8" />
            </div>
            <Button variant="outline" onClick={eseguiExport}>
              <FileDown className="h-4 w-4" />
              Esporta PDF
            </Button>
          </div>
        </div>
      </div>

      {/* Tabella scadenze */}
      <div className="mb-6">
        <h4 className="mb-2 text-sm font-semibold">Consensi in scadenza (30 giorni)</h4>
        <DataTable columns={scadenzeColumns} data={data.scadenze} getRowId={(r) => r.id} />
      </div>

      {/* Audit trail */}
      <div>
        <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
          <h4 className="text-sm font-semibold">Audit trail</h4>
          <div className="flex gap-2">
            <Select value={filtroAzione} onValueChange={setFiltroAzione} options={azioniDisponibili} placeholder="Tutte le azioni" className="w-[180px]" />
            <Select
              value={filtroPeriodo}
              onValueChange={setFiltroPeriodo}
              options={[{ value: '7', label: 'Ultimi 7 giorni' }, { value: '30', label: 'Ultimi 30 giorni' }]}
              placeholder="Tutto il periodo"
              className="w-[170px]"
            />
          </div>
        </div>
        <DataTable columns={auditColumns} data={auditFiltrato} getRowId={(r) => `${r.lead_id}-${r.at}-${r.azione}`} />
      </div>

      {/* Conferma revoca */}
      <Dialog
        open={confermaRevoca}
        onClose={() => setConfermaRevoca(false)}
        title="Conferma revoca totale"
        footer={
          <>
            <Button variant="outline" onClick={() => setConfermaRevoca(false)}>Annulla</Button>
            <Button variant="destructive" onClick={eseguiRevoca} disabled={revoca.isPending}>
              {revoca.isPending ? 'Revoca…' : 'Esegui revoca totale'}
            </Button>
          </>
        }
      >
        <p className="text-sm">
          Verrà revocato il consenso su <strong>{leadRevoca.length}</strong> lead del contatto «{contatto}».
          Tutte passeranno allo stato <strong>BLOCCATA</strong>. L'operazione è irreversibile.
        </p>
      </Dialog>
    </>
  )
}

function Kpi({ label, value, icon }) {
  return (
    <div className="rounded-lg border border-border bg-card p-4">
      <div className="flex items-center justify-between">
        <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">{label}</p>
        {icon}
      </div>
      <p className="mt-1 text-2xl font-semibold tabular-nums text-foreground">{value}</p>
    </div>
  )
}
