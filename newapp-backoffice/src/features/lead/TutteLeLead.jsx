import { useMemo, useState } from 'react'
import { useSearchParams, useNavigate } from 'react-router-dom'
import { Upload, Send, Download, Ban, X } from 'lucide-react'
import { toast } from 'sonner'

import { ROUTES } from '@/constants/routes'
import { ScreenHeader } from '@/components/shared/ScreenHeader'
import { DataTable } from '@/components/shared/DataTable'
import { Button } from '@/components/ui/button'
import { LeadFilters } from './components/LeadFilters'
import { LEAD_COLUMNS } from './components/LeadTable'
import { LeadDrawer } from './components/LeadDrawer'
import { useLeads } from './hooks/useLead'

// Schermata "Tutte le lead" (sezione 9.5) — cuore del sistema.
// Tabella 31 colonne + filtri (base + avanzati) + selezione multipla con
// barra azioni sticky + LeadDrawer laterale.
export default function TutteLeLead() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()

  // Filtro iniziale da query param (es. "Vedi tutte" da scheda RDV → ?rdv_id=...)
  const rdvIdParam = searchParams.get('rdv_id')
  const [filtri, setFiltri] = useState(() => (rdvIdParam ? { rdv_id: rdvIdParam } : {}))

  const { data: leads = [], isLoading } = useLeads(filtri)

  // Selezione righe (controllata) e lead aperta nel drawer
  const [rowSelection, setRowSelection] = useState({})
  const [leadAperta, setLeadAperta] = useState(null)

  const idsSelezionati = useMemo(
    () => Object.keys(rowSelection).filter((id) => rowSelection[id]),
    [rowSelection],
  )
  const nSelezionati = idsSelezionati.length

  // Azioni di massa mock (in attesa del collegamento Supabase)
  const azioneMassa = (etichetta) =>
    toast.info(`"${etichetta}" su ${nSelezionati} lead — disponibile dopo Supabase.`)

  return (
    <>
      <ScreenHeader
        title="Tutte le lead"
        subtitle="31 colonne · aggiornamento real-time"
        action={
          <Button variant="brand" onClick={() => navigate(ROUTES.LEAD_IMPORTA)}>
            <Upload className="h-4 w-4" />
            Importa lista
          </Button>
        }
      />

      <LeadFilters filtri={filtri} onChange={setFiltri} />

      <DataTable
        columns={LEAD_COLUMNS}
        data={leads}
        isLoading={isLoading}
        enableSelection
        rowSelection={rowSelection}
        onRowSelectionChange={setRowSelection}
        getRowId={(row) => row.id}
        onRowClick={(lead) => setLeadAperta(lead)}
      />

      {/* Barra azioni sticky per la selezione multipla */}
      {nSelezionati > 0 && (
        <div className="sticky bottom-4 z-40 mt-4 flex items-center justify-between gap-4 rounded-lg border border-border bg-card px-4 py-3 shadow-lg">
          <span className="text-sm font-medium">
            {nSelezionati} {nSelezionati === 1 ? 'lead selezionata' : 'lead selezionate'}
          </span>
          <div className="flex items-center gap-2">
            <Button variant="brand" size="sm" onClick={() => azioneMassa('Invia / Ricicla')}>
              <Send className="h-4 w-4" />
              Invia / Ricicla
            </Button>
            <Button variant="outline" size="sm" onClick={() => azioneMassa('Esporta')}>
              <Download className="h-4 w-4" />
              Esporta
            </Button>
            <Button variant="outline" size="sm" onClick={() => azioneMassa('Blocca')}>
              <Ban className="h-4 w-4" />
              Blocca
            </Button>
            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setRowSelection({})} aria-label="Deseleziona tutto">
              <X className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}

      <LeadDrawer lead={leadAperta} onClose={() => setLeadAperta(null)} />
    </>
  )
}
