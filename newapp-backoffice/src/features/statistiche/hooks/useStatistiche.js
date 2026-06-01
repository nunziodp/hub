import { useQuery } from '@tanstack/react-query'

import { supabase, isSupabaseConfigured } from '@/lib/supabase'
import { leadsMock, rdvMock, subCampagneMock } from '@/lib/mockData'

// Spend per fonte ricavato dalle campagne collegate delle sub-campagne
function spendPerFonteDa(subCampagne) {
  const out = {}
  subCampagne.forEach((s) => {
    ;(s.campagne_collegate ?? []).forEach((c) => {
      out[c.piattaforma] = (out[c.piattaforma] ?? 0) + c.spend
    })
  })
  return out
}

function aggregaFonti(leads, subCampagne) {
  const spendPerFonte = spendPerFonteDa(subCampagne)
  const map = {}
  leads.forEach((l) => {
    if (!l.fonte) return
    const f = (map[l.fonte] ??= { fonte: l.fonte, lead: 0, sommaScore: 0, conScore: 0, consegnate: 0 })
    f.lead += 1
    if (typeof l.score === 'number') {
      f.sommaScore += l.score
      f.conScore += 1
    }
    if (l.consegnata_at) f.consegnate += 1
  })
  const righe = Object.values(map)
    .map((f) => {
      const spend = spendPerFonte[f.fonte] ?? 0
      return {
        fonte: f.fonte,
        lead: f.lead,
        consegnate: f.consegnate,
        scoreMedio: f.conScore > 0 ? f.sommaScore / f.conScore : 0,
        spend,
        cpl: f.lead > 0 ? spend / f.lead : 0,
      }
    })
    .sort((a, b) => b.lead - a.lead)
  const totali = {
    lead: righe.reduce((a, r) => a + r.lead, 0),
    spend: righe.reduce((a, r) => a + r.spend, 0),
  }
  totali.cpl = totali.lead > 0 ? totali.spend / totali.lead : 0
  return { righe, totali }
}

// Performance fonti
export function useStatFonti() {
  return useQuery({
    queryKey: ['stat', 'fonti'],
    queryFn: async () => {
      if (isSupabaseConfigured) {
        const [{ data: leads }, { data: sub }] = await Promise.all([
          supabase.from('leads').select('fonte, score, consegnata_at'),
          supabase.from('sub_campagne').select('campagne_collegate'),
        ])
        return aggregaFonti(leads ?? [], sub ?? [])
      }
      await new Promise((r) => setTimeout(r, 120))
      return aggregaFonti(leadsMock, subCampagneMock)
    },
  })
}

function aggregaRdv(rdv, leads) {
  const righe = rdv
    .map((r) => {
      const lead = leads.filter((l) => l.rdv_id === r.id)
      const consegnate = lead.filter((l) => l.consegnata_at != null).length
      const won = lead.filter((l) => l.stato === 'CHIUSA_WON').length
      const conScore = lead.filter((l) => typeof l.score === 'number')
      const scoreMedio = conScore.length > 0 ? conScore.reduce((a, l) => a + l.score, 0) / conScore.length : 0
      return {
        id: r.id,
        ragione_sociale: r.ragione_sociale,
        tier: r.tier,
        stato: r.stato,
        lead: lead.length,
        consegnate,
        tassoConversione: consegnate > 0 ? (won / consegnate) * 100 : 0,
        scoreMedio,
        budgetResiduo: r.wallet_saldo,
      }
    })
    .sort((a, b) => b.lead - a.lead)
  return { righe }
}

// Performance RDV
export function useStatRdv() {
  return useQuery({
    queryKey: ['stat', 'rdv'],
    queryFn: async () => {
      if (isSupabaseConfigured) {
        const [{ data: rdv }, { data: leads }] = await Promise.all([
          supabase.from('rdv').select('id, ragione_sociale, tier, stato, wallet_saldo'),
          supabase.from('leads').select('rdv_id, score, stato, consegnata_at'),
        ])
        return aggregaRdv(rdv ?? [], leads ?? [])
      }
      await new Promise((r) => setTimeout(r, 120))
      return aggregaRdv(rdvMock, leadsMock)
    },
  })
}
