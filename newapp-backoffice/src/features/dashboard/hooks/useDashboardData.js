import { useQuery } from '@tanstack/react-query'

import { supabase, isSupabaseConfigured } from '@/lib/supabase'
import {
  activityFeedMock,
  distribuzioneFontiMock,
  getTopSubCampagne,
  leadsMock,
  rdvMock,
  volume14ggMock,
} from '@/lib/mockData'

const VUOTO = {
  kpi: {},
  alerts: [],
  volume14gg: [],
  distribuzioneFonti: [],
  topSubCampagne: [],
  activityFeed: [],
}

// Costruisce gli alert condizionali (sezione 9.1) da RDV e conteggi lead
function buildAlerts({ rdvBassoCredito, leadRevisione, erroriConsegna }) {
  const alerts = []
  if (rdvBassoCredito.length > 0) {
    alerts.push({
      id: 'credito-basso',
      livello: 'warning',
      messaggio: `${rdvBassoCredito.length} RDV con credito sotto la soglia di alert`,
      dettaglio: rdvBassoCredito.map((r) => r.ragione_sociale).join(', '),
      href: '/rdv/fatturazione',
      cta: 'Vai a fatturazione',
    })
  }
  if (leadRevisione > 0) {
    alerts.push({
      id: 'parsing-fallito',
      livello: 'error',
      messaggio: `${leadRevisione} lead in attesa di revisione (parsing fallito)`,
      dettaglio: 'Campaign name incompleto o malformato',
      href: '/lead/revisione',
      cta: 'Rivedi ora',
    })
  }
  if (erroriConsegna > 0) {
    alerts.push({
      id: 'errori-consegna',
      livello: 'error',
      messaggio: `${erroriConsegna} lead con errore di consegna nelle ultime 24h`,
      href: '/lead/riciclo',
      cta: 'Vai al riciclo',
    })
  }
  return alerts
}

// ---------- Supabase ----------
async function fetchDashboardSupabase() {
  const ora = Date.now()
  const da30 = new Date(ora - 30 * 24 * 3_600_000).toISOString()
  const da14 = new Date(ora - 14 * 24 * 3_600_000).toISOString()

  const [
    { count: leadProdotte },
    { count: leadDistribuite },
    { data: rdvAttive },
    { count: leadRevisione },
    { count: erroriConsegna },
    { data: leadScore },
    { data: lead14 },
    { data: lead30 },
    { data: subTop },
    { data: ultimeLead },
  ] = await Promise.all([
    supabase.from('leads').select('id', { count: 'exact', head: true }).gte('created_at', da30),
    supabase.from('leads').select('id', { count: 'exact', head: true }).gte('created_at', da30).not('rdv_id', 'is', null),
    supabase.from('rdv').select('ragione_sociale, wallet_budget_allocato, wallet_saldo, wallet_soglia_alert, stato').eq('stato', 'attiva'),
    supabase.from('leads').select('id', { count: 'exact', head: true }).eq('parsing_ok', false),
    supabase.from('leads').select('id', { count: 'exact', head: true }).eq('stato', 'ERRORE_CONSEGNA'),
    supabase.from('leads').select('score').not('score', 'is', null).gte('created_at', da30),
    supabase.from('leads').select('created_at, rdv_id').gte('created_at', da14),
    supabase.from('leads').select('fonte').gte('created_at', da30),
    supabase.from('sub_campagne').select('*').eq('stato', 'attiva').order('lead_30gg', { ascending: false }).limit(5),
    supabase.from('leads').select('id, nome, cognome, stato, parsing_ok, created_at, rdv_id').order('created_at', { ascending: false }).limit(10),
  ])

  const budgetAttivo = (rdvAttive ?? []).reduce((a, r) => a + Number(r.wallet_budget_allocato), 0)
  const budgetDistribuito = (rdvAttive ?? []).reduce((a, r) => a + (Number(r.wallet_budget_allocato) - Number(r.wallet_saldo)), 0)
  const scoreMedio = leadScore?.length ? leadScore.reduce((a, l) => a + l.score, 0) / leadScore.length : 0

  // volume 14gg per giorno
  const giorni = {}
  for (let i = 13; i >= 0; i--) {
    const d = new Date(ora - i * 24 * 3_600_000).toISOString().slice(0, 10)
    giorni[d] = { data: d, ricevute: 0, distribuite: 0 }
  }
  ;(lead14 ?? []).forEach((l) => {
    const k = l.created_at.slice(0, 10)
    if (giorni[k]) {
      giorni[k].ricevute += 1
      if (l.rdv_id) giorni[k].distribuite += 1
    }
  })

  // distribuzione per fonte 30gg
  const fonti = {}
  ;(lead30 ?? []).forEach((l) => {
    if (l.fonte) fonti[l.fonte] = (fonti[l.fonte] ?? 0) + 1
  })
  const totFonti = Object.values(fonti).reduce((a, n) => a + n, 0)
  const distribuzioneFonti = Object.entries(fonti)
    .map(([fonte, count]) => ({ fonte, count, percentuale: totFonti ? (count / totFonti) * 100 : 0 }))
    .sort((a, b) => b.count - a.count)

  // top sub-campagne attive + nome verticale
  const verticaleIds = [...new Set((subTop ?? []).map((s) => s.verticale_id))]
  const { data: verticali } = verticaleIds.length
    ? await supabase.from('verticali').select('id, nome').in('id', verticaleIds)
    : { data: [] }
  const vertMap = Object.fromEntries((verticali ?? []).map((v) => [v.id, v.nome]))
  const topSubCampagne = (subTop ?? []).map((s) => ({
    id: s.id,
    nome: s.nome,
    verticale: vertMap[s.verticale_id] ?? '—',
    formato: s.formato,
    lead_30gg: s.lead_30gg,
    score_medio: s.score_medio,
    tasso_contatto: s.tasso_contatto,
    cpl: s.lead_30gg > 0 ? s.spend_30gg / s.lead_30gg : 0,
  }))

  // activity feed derivato dalle ultime lead
  const activityFeed = (ultimeLead ?? []).map((l) => ({
    id: l.id,
    at: l.created_at,
    tipo: !l.parsing_ok ? 'parsing_fallito' : l.rdv_id ? 'lead_consegnata' : 'lead_riciclata',
    descrizione: !l.parsing_ok
      ? `Lead ${l.id} — parsing fallito, richiede revisione`
      : `Lead ${[l.nome, l.cognome].filter(Boolean).join(' ') || l.id} — ${l.stato}`,
    link: { tipo: 'lead', id: l.id },
  }))

  return {
    kpi: {
      leadProdotte: leadProdotte ?? 0,
      leadDistribuite: leadDistribuite ?? 0,
      cplGlobale: leadDistribuite ? budgetDistribuito / leadDistribuite : 0,
      budgetAttivo,
      scoreMedio,
    },
    alerts: buildAlerts({
      rdvBassoCredito: (rdvAttive ?? []).filter((r) => r.wallet_saldo < r.wallet_soglia_alert),
      leadRevisione: leadRevisione ?? 0,
      erroriConsegna: erroriConsegna ?? 0,
    }),
    volume14gg: Object.values(giorni),
    distribuzioneFonti,
    topSubCampagne,
    activityFeed,
  }
}

// ---------- Mock ----------
function buildDashboardMock() {
  const leadProdotte = volume14ggMock.reduce((acc, p) => acc + p.ricevute, 0) * 2.1
  const leadDistribuite = volume14ggMock.reduce((acc, p) => acc + p.distribuite, 0) * 2.1
  const rdvAttive = rdvMock.filter((r) => r.stato === 'attiva')
  const budgetAttivo = rdvAttive.reduce((acc, r) => acc + r.wallet_budget_allocato, 0)
  const budgetDistribuito = rdvAttive.reduce((acc, r) => acc + (r.wallet_budget_allocato - r.wallet_saldo), 0)
  const cplGlobale = leadDistribuite > 0 ? budgetDistribuito / leadDistribuite : 0
  const leadConScore = leadsMock.filter((l) => typeof l.score === 'number')
  const scoreMedio = leadConScore.length > 0 ? leadConScore.reduce((acc, l) => acc + l.score, 0) / leadConScore.length : 0

  return {
    kpi: {
      leadProdotte: Math.round(leadProdotte),
      leadDistribuite: Math.round(leadDistribuite),
      cplGlobale,
      budgetAttivo,
      scoreMedio,
    },
    alerts: buildAlerts({
      rdvBassoCredito: rdvMock.filter((r) => r.stato === 'attiva' && r.wallet_saldo < r.wallet_soglia_alert),
      leadRevisione: leadsMock.filter((l) => l.parsing_ok === false).length,
      erroriConsegna: leadsMock.filter((l) => l.stato === 'ERRORE_CONSEGNA').length,
    }),
    volume14gg: volume14ggMock,
    distribuzioneFonti: distribuzioneFontiMock,
    topSubCampagne: getTopSubCampagne(5),
    activityFeed: activityFeedMock,
  }
}

// Hook aggregato della Dashboard (sezione 9.1). Restituisce sempre un oggetto
// con default sicuri così i componenti non devono gestire lo stato di caricamento.
export function useDashboardData() {
  const { data } = useQuery({
    queryKey: ['dashboard'],
    queryFn: async () => {
      if (isSupabaseConfigured) return fetchDashboardSupabase()
      return buildDashboardMock()
    },
  })
  return data ?? VUOTO
}
