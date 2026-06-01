import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'

import { supabase, isSupabaseConfigured } from '@/lib/supabase'
import { rdvMock, leadsMock } from '@/lib/mockData'

// Stati lead considerati "in coda" (assegnate ma non ancora consegnate)
const STATI_CODA = ['ASSEGNATA', 'DISPONIBILE', 'RICEVUTA']

// Conta le lead in coda per una RDV (mock)
export function leadInCoda(rdvId) {
  return leadsMock.filter((l) => l.rdv_id === rdvId && STATI_CODA.includes(l.stato)).length
}

function applicaFiltriMock(rdv, filtri = {}) {
  return rdv.filter((r) => {
    if (filtri.tier && r.tier !== filtri.tier) return false
    if (filtri.stato && r.stato !== filtri.stato) return false
    if (filtri.verticale && !r.verticali?.includes(filtri.verticale)) return false
    if (filtri.q) {
      const q = filtri.q.toLowerCase()
      const blob = [r.ragione_sociale, r.piva, r.referente_nome].filter(Boolean).join(' ').toLowerCase()
      if (!blob.includes(q)) return false
    }
    return true
  })
}

// Lista RDV filtrata. Query key ['rdv', filtri].
export function useRdvList(filtri = {}) {
  return useQuery({
    queryKey: ['rdv', filtri],
    queryFn: async () => {
      if (isSupabaseConfigured) {
        let q = supabase.from('rdv').select('*').order('created_at', { ascending: false })
        if (filtri.tier) q = q.eq('tier', filtri.tier)
        if (filtri.stato) q = q.eq('stato', filtri.stato)
        if (filtri.verticale) q = q.contains('verticali', [filtri.verticale])
        if (filtri.q) {
          const term = `%${filtri.q}%`
          q = q.or(`ragione_sociale.ilike.${term},piva.ilike.${term},referente_nome.ilike.${term}`)
        }
        const { data, error } = await q
        if (error) throw new Error(error.message)

        // Conteggio lead in coda per RDV (una query aggregata lato client)
        const ids = data.map((r) => r.id)
        const coda = {}
        if (ids.length) {
          const { data: lead } = await supabase
            .from('leads')
            .select('rdv_id')
            .in('rdv_id', ids)
            .in('stato', STATI_CODA)
          ;(lead ?? []).forEach((l) => {
            coda[l.rdv_id] = (coda[l.rdv_id] ?? 0) + 1
          })
        }
        return data.map((r) => ({ ...r, _leadInCoda: coda[r.id] ?? 0 }))
      }

      await new Promise((r) => setTimeout(r, 120))
      return applicaFiltriMock(rdvMock, filtri).map((r) => ({ ...r, _leadInCoda: leadInCoda(r.id) }))
    },
  })
}

// Mutation: sospendi / riattiva una RDV (toggle stato).
export function useToggleStatoRdv() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async ({ rdvId, nuovoStato }) => {
      if (isSupabaseConfigured) {
        const { error } = await supabase
          .from('rdv')
          .update({ stato: nuovoStato, distribuzione_attiva: nuovoStato === 'attiva' })
          .eq('id', rdvId)
        if (error) throw new Error(error.message)
        return { id: rdvId }
      }
      await new Promise((r) => setTimeout(r, 150))
      const rdv = rdvMock.find((x) => x.id === rdvId)
      if (!rdv) throw new Error('RDV non trovata')
      rdv.stato = nuovoStato
      rdv.distribuzione_attiva = nuovoStato === 'attiva'
      return rdv
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['rdv'] }),
  })
}
