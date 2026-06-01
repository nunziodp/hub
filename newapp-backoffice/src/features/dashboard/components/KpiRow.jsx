import { Zap, Send, Wallet, Euro, Target } from 'lucide-react'

import { KpiCard } from '@/components/shared/KpiCard'
import { formatCurrency, formatNumber } from '@/lib/utils'

// Riga di 5 KPI principali — sezione 9.1
export function KpiRow({ kpi }) {
  return (
    <div className="grid grid-cols-2 gap-4 lg:grid-cols-5">
      <KpiCard
        label="Lead prodotte 30gg"
        value={formatNumber(kpi.leadProdotte)}
        icon={<Zap className="h-4 w-4 text-violet-500" />}
        delta="+12% vs mese prec."
        deltaPositive
      />
      <KpiCard
        label="Lead distribuite 30gg"
        value={formatNumber(kpi.leadDistribuite)}
        icon={<Send className="h-4 w-4 text-emerald-500" />}
        delta="+8% vs mese prec."
        deltaPositive
      />
      <KpiCard
        label="CPL globale"
        value={formatCurrency(kpi.cplGlobale)}
        icon={<Euro className="h-4 w-4 text-amber-500" />}
        delta="-3% vs mese prec."
        deltaPositive
      />
      <KpiCard
        label="Budget attivo"
        value={formatCurrency(kpi.budgetAttivo)}
        icon={<Wallet className="h-4 w-4 text-sky-500" />}
      />
      <KpiCard
        label="Score medio"
        value={formatNumber(kpi.scoreMedio, 1)}
        icon={<Target className="h-4 w-4 text-rose-500" />}
        delta="+2,1 vs mese prec."
        deltaPositive
      />
    </div>
  )
}
