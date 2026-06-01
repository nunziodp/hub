import { useQuery } from '@tanstack/react-query'

import { supabase, isSupabaseConfigured } from '@/lib/supabase'
import { rdvMock, leadsMock, walletMovimentiMock, findRdvById } from '@/lib/mockData'

const inMeseCorrente = (iso) => {
  if (!iso) return false
  const d = new Date(iso)
  const now = new Date()
  return d.getFullYear() === now.getFullYear() && d.getMonth() === now.getMonth()
}

function rigaCredito(r) {
  const perc = r.wallet_budget_allocato > 0 ? (r.wallet_saldo / r.wallet_budget_allocato) * 100 : 0
  return {
    id: r.id,
    ragione_sociale: r.ragione_sociale,
    tier: r.tier,
    stato: r.stato,
    saldo: r.wallet_saldo,
    soglia: r.wallet_soglia_alert,
    budget: r.wallet_budget_allocato,
    perc,
    sottoSoglia: r.wallet_saldo < r.wallet_soglia_alert,
  }
}

// Fatturazione (/rdv/fatturazione): stato credito + storico ricariche.
export function useFatturazione() {
  return useQuery({
    queryKey: ['rdv', 'fatturazione'],
    queryFn: async () => {
      let rdv
      let ricariche
      if (isSupabaseConfigured) {
        const { data: r, error } = await supabase.from('rdv').select('*')
        if (error) throw new Error(error.message)
        rdv = r
        const { data: m } = await supabase
          .from('wallet_movimenti')
          .select('*, rdv:rdv_id(ragione_sociale)')
          .eq('tipo', 'ricarica')
          .order('created_at', { ascending: false })
        ricariche = (m ?? []).map((x) => ({ ...x, _rdvNome: x.rdv?.ragione_sociale ?? x.rdv_id }))
      } else {
        await new Promise((r) => setTimeout(r, 120))
        rdv = rdvMock
        ricariche = walletMovimentiMock
          .filter((m) => m.tipo === 'ricarica')
          .map((m) => ({ ...m, _rdvNome: findRdvById(m.rdv_id)?.ragione_sociale ?? m.rdv_id }))
          .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
      }

      const righe = rdv.map(rigaCredito)
      const kpi = {
        creditoTotale: righe.reduce((a, r) => a + r.saldo, 0),
        rdvSottoSoglia: righe.filter((r) => r.sottoSoglia).length,
        ricaricheMese: ricariche.filter((m) => inMeseCorrente(m.created_at)).reduce((a, m) => a + m.importo, 0),
      }
      return { righe, ricariche, kpi }
    },
  })
}

// Attive nel mese (/rdv/attive): RDV con lead nel mese solare corrente.
export function useRdvAttive() {
  return useQuery({
    queryKey: ['rdv', 'attive-mese'],
    queryFn: async () => {
      let rdv
      let leads
      if (isSupabaseConfigured) {
        const { data: r, error } = await supabase.from('rdv').select('id, ragione_sociale, tier, stato, wallet_saldo')
        if (error) throw new Error(error.message)
        rdv = r
        const { data: l } = await supabase.from('leads').select('rdv_id, created_at, consegnata_at').not('rdv_id', 'is', null)
        leads = l ?? []
      } else {
        await new Promise((r) => setTimeout(r, 120))
        rdv = rdvMock
        leads = leadsMock
      }

      const righe = rdv
        .map((r) => {
          const lead = leads.filter((l) => l.rdv_id === r.id)
          const leadMese = lead.filter((l) => inMeseCorrente(l.created_at) || inMeseCorrente(l.consegnata_at)).length
          const consegnateMese = lead.filter((l) => inMeseCorrente(l.consegnata_at)).length
          return {
            id: r.id,
            ragione_sociale: r.ragione_sociale,
            tier: r.tier,
            stato: r.stato,
            leadMese,
            consegnateMese,
            budgetResiduo: r.wallet_saldo,
          }
        })
        .filter((r) => r.leadMese > 0)
        .sort((a, b) => b.leadMese - a.leadMese)

      return {
        righe,
        kpi: { rdvAttive: righe.length, leadConsegnate: righe.reduce((a, r) => a + r.consegnateMese, 0) },
      }
    },
  })
}
