import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'

import { supabase, isSupabaseConfigured } from '@/lib/supabase'
import {
  leadsMock,
  findRdvById,
  findSubCampagnaById,
  findVerticaleByNome,
} from '@/lib/mockData'
import { calcolaScore } from '@/lib/scoring'

// Dopo questo numero di tentativi una lead va spostata in lista fredda
export const MAX_RICICLI = 3

function calcolaCounters(leads) {
  return {
    totali: leads.length,
    tentativo1: leads.filter((l) => l.riciclo_count <= 1).length,
    tentativo2: leads.filter((l) => l.riciclo_count === 2).length,
    tentativo3plus: leads.filter((l) => l.riciclo_count >= 3).length,
    riciclabili: leads.filter((l) => l.riciclo_count < MAX_RICICLI).length,
    daRaffreddare: leads.filter((l) => l.riciclo_count >= MAX_RICICLI).length,
  }
}

// Lista delle lead in riciclo con contatori live (sezione 13, step 11).
export function useRicicloLeads() {
  return useQuery({
    queryKey: ['leads', 'riciclo'],
    queryFn: async () => {
      if (isSupabaseConfigured) {
        const { data, error } = await supabase
          .from('leads')
          .select('*, rdv:rdv_id(ragione_sociale)')
          .eq('stato', 'IN_RICICLO')
          .order('created_at', { ascending: false })
        if (error) throw new Error(error.message)
        const leads = data.map((l) => ({ ...l, _rdvNome: l.rdv?.ragione_sociale ?? null }))
        return { leads, counters: calcolaCounters(leads) }
      }
      await new Promise((r) => setTimeout(r, 120))
      const leads = leadsMock
        .filter((l) => l.stato === 'IN_RICICLO')
        .map((l) => ({ ...l, _rdvNome: l.rdv_id ? findRdvById(l.rdv_id)?.ragione_sociale : null }))
      return { leads, counters: calcolaCounters(leads) }
    },
  })
}

// Mutation: invia una lead in riciclo a una RDV (incrementa tentativi, ricalcola score)
export function useInviaRiciclo() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async ({ leadId, rdvId }) => {
      if (isSupabaseConfigured) {
        const { data: lead, error: e1 } = await supabase.from('leads').select('*').eq('id', leadId).single()
        if (e1) throw new Error(e1.message)
        const merged = { ...lead, riciclo_count: (lead.riciclo_count ?? 0) + 1 }
        const { data: sub } = lead.sub_campagna_id
          ? await supabase.from('sub_campagne').select('*').eq('id', lead.sub_campagna_id).single()
          : { data: null }
        const { data: vert } = merged.settore
          ? await supabase.from('verticali').select('*').eq('nome', merged.settore).single()
          : { data: null }
        const { score, fascia, breakdown } = calcolaScore(merged, sub, vert)
        const { error: e2 } = await supabase
          .from('leads')
          .update({
            riciclo_count: merged.riciclo_count,
            score, fascia, score_breakdown: breakdown,
            rdv_id: rdvId, stato: 'RICICLATA', consegnata_at: new Date().toISOString(),
          })
          .eq('id', leadId)
        if (e2) throw new Error(e2.message)
        return { id: leadId }
      }

      await new Promise((r) => setTimeout(r, 150))
      const lead = leadsMock.find((l) => l.id === leadId)
      if (!lead) throw new Error('Lead non trovata')
      lead.riciclo_count = (lead.riciclo_count ?? 0) + 1
      const subCampagna = lead.sub_campagna_id ? findSubCampagnaById(lead.sub_campagna_id) : null
      const verticale = lead.settore ? findVerticaleByNome(lead.settore) : null
      const { score, fascia, breakdown } = calcolaScore(lead, subCampagna, verticale)
      lead.score = score
      lead.fascia = fascia
      lead.score_breakdown = breakdown
      lead.rdv_id = rdvId
      lead.stato = 'RICICLATA'
      lead.consegnata_at = new Date().toISOString()
      return lead
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['leads'] }),
  })
}

// Mutation: sposta una lead in lista fredda (ponte verso lo step 12)
export function useSpostaListaFredda() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async ({ leadId }) => {
      const at = new Date().toISOString()
      if (isSupabaseConfigured) {
        const { error } = await supabase
          .from('leads')
          .update({ lista_fredda: true, lista_fredda_at: at, stato: 'LISTA_FREDDA' })
          .eq('id', leadId)
        if (error) throw new Error(error.message)
        return { id: leadId }
      }
      await new Promise((r) => setTimeout(r, 150))
      const lead = leadsMock.find((l) => l.id === leadId)
      if (!lead) throw new Error('Lead non trovata')
      lead.lista_fredda = true
      lead.lista_fredda_at = at
      lead.stato = 'LISTA_FREDDA'
      return lead
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['leads'] }),
  })
}
