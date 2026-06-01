import { useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { toast } from 'sonner'
import { ChevronLeft } from 'lucide-react'

import { cn, formatCurrency, formatNumber, formatPercent } from '@/lib/utils'
import { ROUTES } from '@/constants/routes'
import { Skeleton } from '@/components/ui/skeleton'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import { EmptyState } from '@/components/shared/EmptyState'
import { useRdvDetail } from './hooks/useRdvDetail'
import { useToggleStatoRdv } from './hooks/useRdvList'
import { SchedaRdvHeader } from './components/SchedaRdvHeader'
import { TabAnagrafica } from './components/tabs/TabAnagrafica'
import { TabConfigurazione } from './components/tabs/TabConfigurazione'
import { TabLeadRicevute } from './components/tabs/TabLeadRicevute'
import { TabWallet } from './components/tabs/TabWallet'
import { TabPerformance } from './components/tabs/TabPerformance'
import { TabUtenti } from './components/tabs/TabUtenti'

// Scheda RDV (sezione 9.4): header + KPI row + 6 tab
// (Anagrafica, Configurazione, Lead ricevute, Wallet, Performance, Utenti).
export default function RdvDetailPage() {
  const { id } = useParams()
  const { data: rdv, isLoading, isError } = useRdvDetail(id)
  const toggle = useToggleStatoRdv()
  const [tab, setTab] = useState('anagrafica')

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-24 w-full" />
        <Skeleton className="h-20 w-full" />
        <Skeleton className="h-64 w-full" />
      </div>
    )
  }

  if (isError || !rdv) {
    return (
      <EmptyState
        title="RDV non trovata"
        description="La RDV richiesta non esiste."
        action={
          <Link to={ROUTES.RDV_TUTTE} className="text-sm font-medium text-brand-600 hover:underline">
            Torna alla lista
          </Link>
        }
      />
    )
  }

  const toggleStato = () => {
    const nuovoStato = rdv.stato === 'attiva' ? 'sospesa' : 'attiva'
    toggle.mutate(
      { rdvId: rdv.id, nuovoStato },
      {
        onSuccess: () => toast.success(nuovoStato === 'attiva' ? 'RDV riattivata.' : 'RDV sospesa.'),
        onError: (e) => toast.error(e.message ?? 'Errore aggiornamento stato.'),
      },
    )
  }

  const kpi = rdv._kpi

  return (
    <>
      {/* Back link */}
      <Link
        to={ROUTES.RDV_TUTTE}
        className="mb-3 inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
      >
        <ChevronLeft className="h-4 w-4" />
        Tutte le RDV
      </Link>

      <SchedaRdvHeader rdv={rdv} onModifica={() => setTab('anagrafica')} onToggleStato={toggleStato} />

      {/* KPI row sopra i tab */}
      <div className="mb-6 grid grid-cols-2 gap-4 lg:grid-cols-4">
        <KpiBox label="Lead questo mese" value={formatNumber(kpi.leadMese)} />
        <KpiBoxBudget saldo={kpi.budgetResiduo} perc={kpi.budgetPerc} />
        <KpiBox label="Score medio" value={kpi.scoreMedio > 0 ? formatNumber(kpi.scoreMedio, 1) : '—'} />
        <KpiBox
          label="Tasso conversione"
          value={kpi.consegnate > 0 ? formatPercent(kpi.tassoConversione) : '—'}
        />
      </div>

      {/* Tab */}
      <Tabs value={tab} onValueChange={setTab}>
        <TabsList>
          <TabsTrigger value="anagrafica">Anagrafica</TabsTrigger>
          <TabsTrigger value="configurazione">Configurazione</TabsTrigger>
          <TabsTrigger value="lead">Lead ricevute</TabsTrigger>
          <TabsTrigger value="wallet">Wallet</TabsTrigger>
          <TabsTrigger value="performance">Performance</TabsTrigger>
          <TabsTrigger value="utenti">Utenti</TabsTrigger>
        </TabsList>

        <TabsContent value="anagrafica">
          <TabAnagrafica rdv={rdv} />
        </TabsContent>
        <TabsContent value="configurazione">
          <TabConfigurazione rdv={rdv} />
        </TabsContent>
        <TabsContent value="lead">
          <TabLeadRicevute rdv={rdv} />
        </TabsContent>
        <TabsContent value="wallet">
          <TabWallet rdv={rdv} />
        </TabsContent>
        <TabsContent value="performance">
          <TabPerformance rdv={rdv} />
        </TabsContent>
        <TabsContent value="utenti">
          <TabUtenti rdv={rdv} />
        </TabsContent>
      </Tabs>
    </>
  )
}

// KPI generico
function KpiBox({ label, value }) {
  return (
    <div className="rounded-lg border border-border bg-card p-4">
      <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">{label}</p>
      <p className="mt-1 text-2xl font-semibold tabular-nums text-foreground">{value}</p>
    </div>
  )
}

// KPI budget con progress bar colorata (verde >50%, amber 20-50%, rosso <20%)
function KpiBoxBudget({ saldo, perc }) {
  const colore = perc > 50 ? 'bg-emerald-500' : perc >= 20 ? 'bg-amber-500' : 'bg-red-500'
  const larghezza = Math.max(0, Math.min(100, perc))
  return (
    <div className="rounded-lg border border-border bg-card p-4">
      <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Budget residuo</p>
      <p className="mt-1 text-2xl font-semibold tabular-nums text-foreground">{formatCurrency(saldo)}</p>
      <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-muted">
        <div className={cn('h-full rounded-full', colore)} style={{ width: `${larghezza}%` }} />
      </div>
    </div>
  )
}
