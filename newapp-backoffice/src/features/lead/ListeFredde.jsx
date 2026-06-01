import { useMemo, useState } from 'react'
import { Snowflake, PackagePlus, Tag } from 'lucide-react'
import { toast } from 'sonner'

import { formatCurrency, formatDate, formatDateOnly, formatNumber, maskPhone } from '@/lib/utils'
import { ScreenHeader } from '@/components/shared/ScreenHeader'
import { DataTable } from '@/components/shared/DataTable'
import { ScoreBadge } from '@/components/shared/ScoreBadge'
import { StatusBadge } from '@/components/shared/StatusBadge'
import { EmptyState } from '@/components/shared/EmptyState'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import { useListeFredde, useVendiPacchetto } from './hooks/useListeFredde'
import { CreaPacchettoDialog } from './components/CreaPacchettoDialog'

// Schermata "Liste fredde" (sezione 9.7): KPI + pool + pacchetti + storico.
export default function ListeFredde() {
  const { data, isLoading } = useListeFredde()
  const vendi = useVendiPacchetto()

  const [tab, setTab] = useState('pool')
  const [rowSelection, setRowSelection] = useState({})
  const [leadIdsPacchetto, setLeadIdsPacchetto] = useState(null)

  const pool = data?.pool ?? []
  const pacchetti = data?.pacchetti ?? []
  const kpi = data?.kpi
  const attivi = pacchetti.filter((p) => p.stato !== 'venduto')
  const venduti = pacchetti.filter((p) => p.stato === 'venduto')

  const idsSelezionati = useMemo(
    () => Object.keys(rowSelection).filter((id) => rowSelection[id]),
    [rowSelection],
  )

  // ----- Colonne pool -----
  const poolColumns = [
    { accessorKey: 'id', header: 'ID', cell: ({ getValue }) => <span className="font-mono text-xs">{getValue()}</span> },
    { accessorKey: 'nome', header: 'Nome', cell: ({ row }) => [row.original.nome, row.original.cognome].filter(Boolean).join(' ') || '—' },
    { accessorKey: 'telefono', header: 'Telefono', cell: ({ getValue }) => <span className="font-mono text-xs">{maskPhone(getValue())}</span> },
    { accessorKey: 'settore', header: 'Settore' },
    { accessorKey: 'fascia', header: 'Fascia', cell: ({ getValue }) => <ScoreBadge fascia={getValue()} /> },
    { accessorKey: 'lista_fredda_at', header: 'In lista dal', cell: ({ getValue }) => formatDateOnly(getValue()) },
  ]

  // ----- Colonne pacchetti (attivi) -----
  const vendiPacchetto = (p) =>
    vendi.mutate(
      { pacchettoId: p.id },
      {
        onSuccess: () => toast.success(`Pacchetto "${p.nome}" segnato come venduto.`),
        onError: (e) => toast.error(e.message ?? 'Errore.'),
      },
    )

  const pacchettiColumns = [
    { accessorKey: 'nome', header: 'Nome', cell: ({ getValue }) => <span className="font-medium">{getValue()}</span> },
    { accessorKey: '_rdvNome', header: 'Destinataria' },
    { accessorKey: '_nLead', header: 'Lead', cell: ({ getValue }) => formatNumber(getValue()) },
    { accessorKey: 'prezzo_per_lead', header: 'Prezzo/lead', cell: ({ getValue }) => formatCurrency(getValue()) },
    { accessorKey: '_ricavo', header: 'Valore', cell: ({ getValue }) => formatCurrency(getValue()) },
    { accessorKey: 'scadenza_at', header: 'Scadenza', cell: ({ getValue }) => formatDateOnly(getValue()) },
    { accessorKey: 'stato', header: 'Stato', cell: ({ getValue }) => <StatusBadge stato={getValue()} /> },
    {
      id: 'azioni',
      header: 'Azioni',
      enableSorting: false,
      cell: ({ row }) => (
        <div onClick={(e) => e.stopPropagation()}>
          <Button variant="outline" size="sm" onClick={() => vendiPacchetto(row.original)}>
            <Tag className="h-3.5 w-3.5" />
            Segna venduto
          </Button>
        </div>
      ),
    },
  ]

  // ----- Colonne storico vendite -----
  const storicoColumns = [
    { accessorKey: 'nome', header: 'Pacchetto', cell: ({ getValue }) => <span className="font-medium">{getValue()}</span> },
    { accessorKey: '_rdvNome', header: 'Acquirente' },
    { accessorKey: '_nLead', header: 'Lead', cell: ({ getValue }) => formatNumber(getValue()) },
    { accessorKey: 'prezzo_per_lead', header: 'Prezzo/lead', cell: ({ getValue }) => formatCurrency(getValue()) },
    { accessorKey: '_ricavo', header: 'Ricavo', cell: ({ getValue }) => formatCurrency(getValue()) },
    { accessorKey: 'venduto_at', header: 'Venduto il', cell: ({ getValue }) => formatDate(getValue()) },
  ]

  return (
    <>
      <ScreenHeader title="Liste fredde" subtitle="Pool di lead disponibili per vendita a pacchetto" />

      {/* KPI */}
      {isLoading ? (
        <div className="mb-6 grid grid-cols-2 gap-4 lg:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-20" />)}
        </div>
      ) : (
        <div className="mb-6 grid grid-cols-2 gap-4 lg:grid-cols-4">
          <Kpi label="Lead disponibili" value={formatNumber(kpi.leadDisponibili)} />
          <Kpi label="Valore potenziale" value={formatCurrency(kpi.valorePotenziale)} />
          <Kpi label="Pacchetti venduti (mese)" value={formatNumber(kpi.pacchettiVendutiMese)} />
          <Kpi label="Ricavo generato (mese)" value={formatCurrency(kpi.ricavoGenerato)} />
        </div>
      )}

      <Tabs value={tab} onValueChange={setTab}>
        <TabsList>
          <TabsTrigger value="pool">Pool disponibile</TabsTrigger>
          <TabsTrigger value="attivi">Pacchetti attivi</TabsTrigger>
          <TabsTrigger value="storico">Storico vendite</TabsTrigger>
        </TabsList>

        {/* Pool disponibile */}
        <TabsContent value="pool">
          {idsSelezionati.length > 0 && (
            <div className="mb-3 flex items-center justify-between rounded-lg border border-border bg-card px-4 py-2">
              <span className="text-sm font-medium">{idsSelezionati.length} lead selezionate</span>
              <Button variant="brand" size="sm" onClick={() => setLeadIdsPacchetto(idsSelezionati)}>
                <PackagePlus className="h-4 w-4" />
                Crea pacchetto
              </Button>
            </div>
          )}
          {!isLoading && pool.length === 0 ? (
            <EmptyState icon={Snowflake} title="Pool vuoto" description="Nessuna lead fredda disponibile al momento." />
          ) : (
            <DataTable
              columns={poolColumns}
              data={pool}
              isLoading={isLoading}
              enableSelection
              rowSelection={rowSelection}
              onRowSelectionChange={setRowSelection}
              getRowId={(r) => r.id}
            />
          )}
        </TabsContent>

        {/* Pacchetti attivi */}
        <TabsContent value="attivi">
          {!isLoading && attivi.length === 0 ? (
            <EmptyState icon={Snowflake} title="Nessun pacchetto attivo" />
          ) : (
            <DataTable columns={pacchettiColumns} data={attivi} isLoading={isLoading} getRowId={(r) => r.id} />
          )}
        </TabsContent>

        {/* Storico vendite */}
        <TabsContent value="storico">
          {!isLoading && venduti.length === 0 ? (
            <EmptyState icon={Tag} title="Nessuna vendita registrata" />
          ) : (
            <DataTable columns={storicoColumns} data={venduti} isLoading={isLoading} getRowId={(r) => r.id} />
          )}
        </TabsContent>
      </Tabs>

      <CreaPacchettoDialog
        leadIds={leadIdsPacchetto}
        onClose={() => {
          setLeadIdsPacchetto(null)
          setRowSelection({})
        }}
      />
    </>
  )
}

function Kpi({ label, value }) {
  return (
    <div className="rounded-lg border border-border bg-card p-4">
      <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">{label}</p>
      <p className="mt-1 text-2xl font-semibold tabular-nums text-foreground">{value}</p>
    </div>
  )
}
