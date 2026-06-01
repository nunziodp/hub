import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'

import { supabase, isSupabaseConfigured } from '@/lib/supabase'
import {
  leadsMock,
  findSubCampagnaById,
  findVerticaleByNome,
} from '@/lib/mockData'
import { parseCampaignName } from '@/lib/parseCampaignName'
import { calcolaScore } from '@/lib/scoring'

// Campi essenziali al parsing (sezione 10.1): senza questi il parsing fallisce
const CAMPI_ESSENZIALI = [
  ['settore', 'Settore'],
  ['cliente', 'Cliente'],
  ['campagna_cliente', 'Campagna cliente'],
  ['formato', 'Formato'],
  ['fonte', 'Fonte'],
]

// Determina il motivo per cui una lead è finita in revisione
function calcolaMotivoFlag(lead) {
  const parsed = parseCampaignName(lead.campaign_name_raw)
  const parts = (lead.campaign_name_raw ?? '').split(' | ')
  if (!lead.campaign_name_raw || parts.length < 4) {
    return 'Campaign name assente o con meno di 4 segmenti'
  }
  const mancanti = CAMPI_ESSENZIALI.filter(([campo]) => !parsed.fields[campo]).map(([, label]) => label)
  if (mancanti.length > 0) return `Campi essenziali mancanti: ${mancanti.join(', ')}`
  return 'Parsing incompleto'
}

// Lista delle lead in attesa di revisione (parsing_ok = false), col motivo
export function useRevisioneLeads() {
  return useQuery({
    queryKey: ['leads', 'revisione'],
    queryFn: async () => {
      if (isSupabaseConfigured) {
        const { data, error } = await supabase
          .from('leads')
          .select('*')
          .eq('parsing_ok', false)
          .order('created_at', { ascending: false })
        if (error) throw new Error(error.message)
        return data.map((l) => ({ ...l, motivo_flag: calcolaMotivoFlag(l) }))
      }
      await new Promise((r) => setTimeout(r, 120))
      return leadsMock
        .filter((l) => l.parsing_ok === false)
        .map((l) => ({ ...l, motivo_flag: calcolaMotivoFlag(l) }))
    },
  })
}

// Conteggio per il badge in sidebar (chiave dedicata, sezioni 4 e 11)
export function useRevisioneCount() {
  const { data = 0 } = useQuery({
    queryKey: ['leads', 'revisione-count'],
    queryFn: async () => {
      if (isSupabaseConfigured) {
        const { count, error } = await supabase
          .from('leads')
          .select('id', { count: 'exact', head: true })
          .eq('parsing_ok', false)
        if (error) throw new Error(error.message)
        return count ?? 0
      }
      return leadsMock.filter((l) => l.parsing_ok === false).length
    },
  })
  return data
}

// Mutation: correggi i campi parsati e ricalcola lo score
export function useCorreggiLead() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async ({ leadId, campi }) => {
      if (isSupabaseConfigured) {
        const { data: lead, error: e1 } = await supabase.from('leads').select('*').eq('id', leadId).single()
        if (e1) throw new Error(e1.message)
        const merged = { ...lead, ...campi }

        const { data: sub } = lead.sub_campagna_id
          ? await supabase.from('sub_campagne').select('*').eq('id', lead.sub_campagna_id).single()
          : { data: null }
        const { data: vert } = merged.settore
          ? await supabase.from('verticali').select('*').eq('nome', merged.settore).single()
          : { data: null }

        const { score, fascia, breakdown } = calcolaScore(merged, sub, vert)
        const stato = lead.stato === 'RICEVUTA' ? 'DISPONIBILE' : lead.stato
        const { error: e2 } = await supabase
          .from('leads')
          .update({ ...campi, parsing_ok: true, score, fascia, score_breakdown: breakdown, stato })
          .eq('id', leadId)
        if (e2) throw new Error(e2.message)
        return { id: leadId }
      }

      // Mock
      await new Promise((r) => setTimeout(r, 150))
      const lead = leadsMock.find((l) => l.id === leadId)
      if (!lead) throw new Error('Lead non trovata')
      Object.assign(lead, campi)
      lead.parsing_ok = true
      const subCampagna = lead.sub_campagna_id ? findSubCampagnaById(lead.sub_campagna_id) : null
      const verticale = lead.settore ? findVerticaleByNome(lead.settore) : null
      const { score, fascia, breakdown } = calcolaScore(lead, subCampagna, verticale)
      lead.score = score
      lead.fascia = fascia
      lead.score_breakdown = breakdown
      if (lead.stato === 'RICEVUTA') lead.stato = 'DISPONIBILE'
      return lead
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['leads'] }),
  })
}

// Mutation: scarta una lead → stato BLOCCATA con motivazione obbligatoria
export function useScartaLead() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async ({ leadId, motivazione }) => {
      if (isSupabaseConfigured) {
        // Nota: lo schema leads non ha un campo per la motivazione; viene
        // tracciata nel gdpr_audit_log come evento di scarto.
        const { data: lead } = await supabase.from('leads').select('gdpr_audit_log').eq('id', leadId).single()
        const log = [
          ...(lead?.gdpr_audit_log ?? []),
          { at: new Date().toISOString(), azione: 'lead_scartata', motivo: motivazione, source: 'BACKOFFICE' },
        ]
        const { error } = await supabase.from('leads').update({ stato: 'BLOCCATA', gdpr_audit_log: log }).eq('id', leadId)
        if (error) throw new Error(error.message)
        return { id: leadId }
      }

      await new Promise((r) => setTimeout(r, 150))
      const lead = leadsMock.find((l) => l.id === leadId)
      if (!lead) throw new Error('Lead non trovata')
      lead.stato = 'BLOCCATA'
      lead.motivo_scarto = motivazione
      return lead
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['leads'] }),
  })
}
