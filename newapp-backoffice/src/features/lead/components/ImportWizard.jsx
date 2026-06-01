import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Upload, FileText, CheckCircle2, AlertTriangle, Copy, ArrowLeft, ArrowRight } from 'lucide-react'
import { toast } from 'sonner'

import { cn } from '@/lib/utils'
import { ROUTES } from '@/constants/routes'
import { DataTable } from '@/components/shared/DataTable'
import { ScoreBadge } from '@/components/shared/ScoreBadge'
import { Button } from '@/components/ui/button'
import { parseCsv, preparaRighe, useCommitImport, COLONNE_IMPORT } from '../hooks/useImport'

// Template CSV di esempio mostrato all'utente
const TEMPLATE_CSV = `${COLONNE_IMPORT.join(',')}
Luca,Bianchi,+393480001122,luca.bianchi@email.it,20100,CMP001.V01 | ENERGIA | EnergiaPro | PromoGiugno | LuceGas10 | cr_01 | LANDING | META | v1 | ELEFANTE,FORM_NATIVO,form_ref_001
Anna,Rossi,+393490002233,anna.rossi@email.it,00100,,IMPORT,lista_giugno`

const STEPS = ['Carica', 'Anteprima e validazione', 'Esito']

// Wizard di import liste lead (sezione 13, step 6 / logica sez. 10 e 12).
export function ImportWizard() {
  const commit = useCommitImport()
  const [step, setStep] = useState(0)
  const [testo, setTesto] = useState('')
  const [righe, setRighe] = useState([])
  const [esito, setEsito] = useState(null)

  // ----- Step 0: caricamento -----
  const caricaFile = (e) => {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = () => setTesto(String(reader.result))
    reader.readAsText(file)
  }

  const analizza = () => {
    const rows = parseCsv(testo)
    if (rows.length === 0) {
      toast.error('CSV vuoto o privo di righe dati (serve almeno l’header + 1 riga).')
      return
    }
    setRighe(preparaRighe(rows))
    setStep(1)
  }

  // ----- Step 1: conferma import -----
  const confermaImport = () => {
    commit.mutate(righe, {
      onSuccess: ({ count }) => {
        const daRevisione = righe.filter((r) => !r.parsing_ok).length
        setEsito({ count, daRevisione })
        setStep(2)
        toast.success(`Importate ${count} lead.`)
      },
      onError: (e) => toast.error(e.message ?? 'Errore durante l’import.'),
    })
  }

  const reset = () => {
    setTesto('')
    setRighe([])
    setEsito(null)
    setStep(0)
  }

  // Contatori di validazione
  const validi = righe.filter((r) => r.parsing_ok).length
  const daRevisione = righe.length - validi
  const duplicati = righe.filter((r) => r.duplicato).length

  const previewColumns = [
    { accessorKey: '_riga', header: 'Riga', cell: ({ getValue }) => <span className="font-mono text-xs">{getValue()}</span> },
    { accessorKey: 'nome', header: 'Nome', cell: ({ row }) => [row.original.nome, row.original.cognome].filter(Boolean).join(' ') || '—' },
    { accessorKey: 'telefono', header: 'Telefono', cell: ({ getValue }) => <span className="font-mono text-xs">{getValue() || '—'}</span> },
    { accessorKey: 'settore', header: 'Settore', cell: ({ getValue }) => getValue() || '—' },
    {
      accessorKey: 'parsing_ok',
      header: 'Parsing',
      enableSorting: false,
      cell: ({ getValue }) => (
        <span className={cn('inline-flex rounded-full px-2 py-0.5 text-xs font-medium', getValue() ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700')}>
          {getValue() ? 'OK' : 'Revisione'}
        </span>
      ),
    },
    {
      accessorKey: 'duplicato',
      header: 'Duplicato',
      enableSorting: false,
      cell: ({ getValue }) =>
        getValue() ? (
          <span className="inline-flex items-center gap-1 text-xs font-medium text-amber-600">
            <AlertTriangle className="h-3.5 w-3.5" /> -20
          </span>
        ) : (
          <span className="text-muted-foreground">—</span>
        ),
    },
    { accessorKey: 'score', header: 'Score', cell: ({ getValue }) => (getValue() == null ? '—' : <span className="font-semibold tabular-nums">{getValue()}</span>) },
    { accessorKey: 'fascia', header: 'Fascia', cell: ({ getValue }) => <ScoreBadge fascia={getValue()} /> },
  ]

  return (
    <div className="space-y-6">
      {/* Indicatore step */}
      <ol className="flex items-center gap-2 text-sm">
        {STEPS.map((label, i) => (
          <li key={label} className="flex items-center gap-2">
            <span
              className={cn(
                'flex h-6 w-6 items-center justify-center rounded-full text-xs font-semibold',
                i === step ? 'bg-brand-600 text-white' : i < step ? 'bg-brand-100 text-brand-600' : 'bg-muted text-muted-foreground',
              )}
            >
              {i + 1}
            </span>
            <span className={cn(i === step ? 'font-medium text-foreground' : 'text-muted-foreground')}>{label}</span>
            {i < STEPS.length - 1 && <span className="mx-1 text-muted-foreground">›</span>}
          </li>
        ))}
      </ol>

      {/* Step 0 — Carica */}
      {step === 0 && (
        <div className="space-y-4">
          <div className="rounded-lg border border-border bg-card p-4">
            <h4 className="mb-2 flex items-center gap-2 text-sm font-semibold">
              <Upload className="h-4 w-4 text-brand-600" /> Carica file CSV
            </h4>
            <input type="file" accept=".csv,text/csv" onChange={caricaFile} className="block text-sm" />
          </div>

          <div className="rounded-lg border border-border bg-card p-4">
            <div className="mb-2 flex items-center justify-between">
              <h4 className="flex items-center gap-2 text-sm font-semibold">
                <FileText className="h-4 w-4 text-brand-600" /> Oppure incolla il CSV
              </h4>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setTesto(TEMPLATE_CSV)
                  toast.info('Template di esempio inserito.')
                }}
              >
                <Copy className="h-3.5 w-3.5" /> Usa template
              </Button>
            </div>
            <textarea
              value={testo}
              onChange={(e) => setTesto(e.target.value)}
              rows={8}
              placeholder={`Header richiesto: ${COLONNE_IMPORT.join(', ')}`}
              className="w-full rounded-md border border-input bg-background p-3 font-mono text-xs shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            />
            <p className="mt-2 text-xs text-muted-foreground">
              Le lead vengono importate con consenso <code>IMPORT</code> (salvo colonna diversa). Il
              <code> campaign_name</code> viene parsato; se incompleto la lead va in revisione.
            </p>
          </div>

          <div className="flex justify-end">
            <Button variant="brand" onClick={analizza} disabled={!testo.trim()}>
              Analizza <ArrowRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}

      {/* Step 1 — Anteprima */}
      {step === 1 && (
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
            <Stat label="Righe totali" value={righe.length} />
            <Stat label="Valide" value={validi} accent="text-emerald-600" />
            <Stat label="Da revisione" value={daRevisione} accent={daRevisione > 0 ? 'text-red-600' : undefined} />
            <Stat label="Duplicati" value={duplicati} accent={duplicati > 0 ? 'text-amber-600' : undefined} />
          </div>

          <DataTable columns={previewColumns} data={righe} getRowId={(r) => String(r._riga)} />

          <div className="flex justify-between">
            <Button variant="outline" onClick={() => setStep(0)}>
              <ArrowLeft className="h-4 w-4" /> Indietro
            </Button>
            <Button variant="brand" onClick={confermaImport} disabled={commit.isPending || righe.length === 0}>
              {commit.isPending ? 'Import in corso…' : `Importa ${righe.length} lead`}
            </Button>
          </div>
        </div>
      )}

      {/* Step 2 — Esito */}
      {step === 2 && esito && (
        <div className="rounded-lg border border-dashed border-border bg-card/50 p-8 text-center">
          <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-emerald-100 text-emerald-600">
            <CheckCircle2 className="h-6 w-6" />
          </div>
          <h3 className="text-base font-semibold">Import completato</h3>
          <p className="mt-1 text-sm text-muted-foreground">
            {esito.count} lead importate
            {esito.daRevisione > 0 ? `, di cui ${esito.daRevisione} in attesa di revisione.` : '.'}
          </p>
          <div className="mt-4 flex justify-center gap-2">
            <Button variant="outline" asChild>
              <Link to={ROUTES.LEAD_TUTTE}>Vai a tutte le lead</Link>
            </Button>
            {esito.daRevisione > 0 && (
              <Button variant="outline" asChild>
                <Link to={ROUTES.LEAD_REVISIONE}>Vai alla revisione</Link>
              </Button>
            )}
            <Button variant="brand" onClick={reset}>Importa altra lista</Button>
          </div>
        </div>
      )}
    </div>
  )
}

function Stat({ label, value, accent }) {
  return (
    <div className="rounded-lg border border-border bg-card p-4">
      <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">{label}</p>
      <p className={cn('mt-1 text-2xl font-semibold tabular-nums', accent ?? 'text-foreground')}>{value}</p>
    </div>
  )
}
