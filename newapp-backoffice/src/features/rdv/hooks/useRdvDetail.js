import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'

import { supabase, isSupabaseConfigured } from '@/lib/supabase'
import {
  rdvMock,
  leadsMock,
  findSubCampagnaById,
  walletMovimentiMock,
  utentiRdvMock,
  generaPerformanceRdv,
} from '@/lib/mockData'

// KPI scheda RDV (sezione 9.4) calcolati da rdv + sue lead
function calcolaKpi(rdv, leadRdv) {
  const now = new Date()
  const leadMese = leadRdv.filter((l) => {
    const d = new Date(l.created_at)
    return d.getFullYear() === now.getFullYear() && d.getMonth() === now.getMonth()
  }).length
  const budgetPerc = rdv.wallet_budget_allocato > 0 ? (rdv.wallet_saldo / rdv.wallet_budget_allocato) * 100 : 0
  const conScore = leadRdv.filter((l) => typeof l.score === 'number')
  const scoreMedio = conScore.length > 0 ? conScore.reduce((a, l) => a + l.score, 0) / conScore.length : 0
  const consegnate = leadRdv.filter((l) => l.consegnata_at != null).length
  const won = leadRdv.filter((l) => l.stato === 'CHIUSA_WON').length
  const tassoConversione = consegnate > 0 ? (won / consegnate) * 100 : 0
  return { leadMese, budgetResiduo: rdv.wallet_saldo, budgetPerc, scoreMedio, tassoConversione, consegnate }
}

// Dettaglio singola RDV + KPI. Query key ['rdv', id].
export function useRdvDetail(id) {
  return useQuery({
    queryKey: ['rdv', id],
    enabled: !!id,
    queryFn: async () => {
      if (isSupabaseConfigured) {
        const { data: rdv, error } = await supabase.from('rdv').select('*').eq('id', id).single()
        if (error) throw new Error(error.message)
        const { data: lead } = await supabase.from('leads').select('score, stato, created_at, consegnata_at').eq('rdv_id', id)
        return { ...rdv, _kpi: calcolaKpi(rdv, lead ?? []) }
      }
      await new Promise((r) => setTimeout(r, 120))
      const rdv = rdvMock.find((r) => r.id === id)
      if (!rdv) throw new Error('RDV non trovata')
      return { ...rdv, _kpi: calcolaKpi(rdv, leadsMock.filter((l) => l.rdv_id === id)) }
    },
  })
}

// Ultime lead ricevute dalla RDV (default 50)
export function useRdvLeads(id, limit = 50) {
  return useQuery({
    queryKey: ['leads', { rdv_id: id, limit }],
    enabled: !!id,
    queryFn: async () => {
      if (isSupabaseConfigured) {
        const { data, error } = await supabase
          .from('leads')
          .select('*, sub_campagna:sub_campagna_id(nome)')
          .eq('rdv_id', id)
          .order('created_at', { ascending: false })
          .limit(limit)
        if (error) throw new Error(error.message)
        return data.map((l) => ({ ...l, _subCampagnaNome: l.sub_campagna?.nome ?? null }))
      }
      await new Promise((r) => setTimeout(r, 120))
      return leadsMock
        .filter((l) => l.rdv_id === id)
        .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
        .slice(0, limit)
        .map((l) => ({ ...l, _subCampagnaNome: l.sub_campagna_id ? findSubCampagnaById(l.sub_campagna_id)?.nome : null }))
    },
  })
}

// Mutation: aggiorna i campi di una RDV (anagrafica/configurazione)
export function useUpdateRdv() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async ({ rdvId, campi }) => {
      if (isSupabaseConfigured) {
        const { error } = await supabase.from('rdv').update(campi).eq('id', rdvId)
        if (error) throw new Error(error.message)
        return { id: rdvId }
      }
      await new Promise((r) => setTimeout(r, 150))
      const rdv = rdvMock.find((r) => r.id === rdvId)
      if (!rdv) throw new Error('RDV non trovata')
      Object.assign(rdv, campi)
      return rdv
    },
    onSuccess: (_data, vars) => {
      queryClient.invalidateQueries({ queryKey: ['rdv', vars.rdvId] })
      queryClient.invalidateQueries({ queryKey: ['rdv'] })
    },
  })
}

// ---------- Tab Wallet ----------
export function useRdvWallet(id) {
  return useQuery({
    queryKey: ['rdv', id, 'wallet'],
    enabled: !!id,
    queryFn: async () => {
      let rdv
      let movimenti
      if (isSupabaseConfigured) {
        const { data: r, error } = await supabase
          .from('rdv')
          .select('wallet_saldo, wallet_soglia_alert, wallet_budget_allocato')
          .eq('id', id)
          .single()
        if (error) throw new Error(error.message)
        rdv = r
        const { data: m } = await supabase
          .from('wallet_movimenti')
          .select('*')
          .eq('rdv_id', id)
          .order('created_at', { ascending: false })
        movimenti = m ?? []
      } else {
        await new Promise((r) => setTimeout(r, 120))
        rdv = rdvMock.find((r) => r.id === id)
        movimenti = walletMovimentiMock
          .filter((m) => m.rdv_id === id)
          .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
      }
      const addebiti = movimenti.filter((m) => m.importo < 0).reduce((a, m) => a + m.importo, 0)
      const ricariche = movimenti.filter((m) => m.tipo === 'ricarica').reduce((a, m) => a + m.importo, 0)
      return {
        movimenti,
        saldo: rdv?.wallet_saldo ?? 0,
        sogliaAlert: rdv?.wallet_soglia_alert ?? 0,
        budgetAllocato: rdv?.wallet_budget_allocato ?? 0,
        kpi: { addebiti, ricariche },
      }
    },
  })
}

// Mutation: registra un movimento wallet (ricarica/rettifica)
export function useMovimentoWallet() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async ({ rdvId, tipo, importo, descrizione }) => {
      if (isSupabaseConfigured) {
        const { data: rdv, error: e1 } = await supabase.from('rdv').select('wallet_saldo').eq('id', rdvId).single()
        if (e1) throw new Error(e1.message)
        const nuovoSaldo = Number((rdv.wallet_saldo + importo).toFixed(2))
        const { error: e2 } = await supabase.from('rdv').update({ wallet_saldo: nuovoSaldo }).eq('id', rdvId)
        if (e2) throw new Error(e2.message)
        const { error: e3 } = await supabase.from('wallet_movimenti').insert({
          rdv_id: rdvId, tipo, descrizione, importo, saldo_post: nuovoSaldo,
        })
        if (e3) throw new Error(e3.message)
        return { id: rdvId }
      }
      await new Promise((r) => setTimeout(r, 150))
      const rdv = rdvMock.find((r) => r.id === rdvId)
      if (!rdv) throw new Error('RDV non trovata')
      rdv.wallet_saldo = Number((rdv.wallet_saldo + importo).toFixed(2))
      walletMovimentiMock.unshift({
        id: `wm-${Date.now()}`, created_at: new Date().toISOString(),
        rdv_id: rdvId, tipo, descrizione, importo, saldo_post: rdv.wallet_saldo, lead_id: null,
      })
      return rdv
    },
    onSuccess: (_d, vars) => {
      queryClient.invalidateQueries({ queryKey: ['rdv', vars.rdvId] })
      queryClient.invalidateQueries({ queryKey: ['rdv'] })
    },
  })
}

// ---------- Tab Utenti ----------
// Nota: lo schema non prevede ancora una tabella di sub-account RDV; in
// modalità Supabase restituiamo una lista vuota finché non verrà aggiunta.
export function useRdvUtenti(id) {
  return useQuery({
    queryKey: ['rdv', id, 'utenti'],
    enabled: !!id,
    queryFn: async () => {
      if (isSupabaseConfigured) return []
      await new Promise((r) => setTimeout(r, 120))
      return utentiRdvMock.filter((u) => u.rdv_id === id)
    },
  })
}

// ---------- Tab Performance ----------
export function useRdvPerformance(id) {
  return useQuery({
    queryKey: ['rdv', id, 'performance'],
    enabled: !!id,
    queryFn: async () => {
      let leadRdv
      let andamento
      if (isSupabaseConfigured) {
        const { data, error } = await supabase
          .from('leads')
          .select('fascia, score, stato, consegnata_at')
          .eq('rdv_id', id)
        if (error) throw new Error(error.message)
        leadRdv = data ?? []
        // Andamento 30gg: consegnate per giorno
        const giorni = {}
        for (let i = 29; i >= 0; i--) {
          const d = new Date()
          d.setDate(d.getDate() - i)
          giorni[d.toISOString().slice(0, 10)] = 0
        }
        leadRdv.forEach((l) => {
          if (l.consegnata_at) {
            const k = l.consegnata_at.slice(0, 10)
            if (k in giorni) giorni[k] += 1
          }
        })
        andamento = Object.entries(giorni).map(([data, consegnate]) => ({ data, consegnate }))
      } else {
        await new Promise((r) => setTimeout(r, 120))
        leadRdv = leadsMock.filter((l) => l.rdv_id === id)
        andamento = generaPerformanceRdv(id)
      }

      const fasce = ['PLATINUM', 'GOLD', 'SILVER', 'RECYCLE']
      const distribuzioneFasce = fasce.map((f) => ({ fascia: f, count: leadRdv.filter((l) => l.fascia === f).length }))
      const consegnate = leadRdv.filter((l) => l.consegnata_at != null).length
      const conScore = leadRdv.filter((l) => typeof l.score === 'number')
      const scoreMedio = conScore.length > 0 ? conScore.reduce((a, l) => a + l.score, 0) / conScore.length : 0

      return { kpi: { totali: leadRdv.length, consegnate, scoreMedio }, distribuzioneFasce, andamento }
    },
  })
}
