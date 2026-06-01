import { useMemo } from 'react'
import { useQuery } from '@tanstack/react-query'

import { supabase, isSupabaseConfigured } from '@/lib/supabase'
import {
  leadsMock,
  findRdvById,
  findSubCampagnaById,
} from '@/lib/mockData'
import { STATI_LEAD, FONTI, FASCE, FORMATI } from '@/constants/dictionaries'

// Select Supabase con join per arricchire la lead con i nomi delle entità collegate
const SELECT_ENRICHED =
  '*, rdv:rdv_id(ragione_sociale), rdv_secondaria:rdv_secondaria_id(ragione_sociale), sub_campagna:sub_campagna_id(nome)'

// Normalizza una riga Supabase (con relazioni innestate) nel formato arricchito
// usato dai componenti (_rdvNome, _rdvSecondariaNome, _subCampagnaNome).
function mapRowEnriched(row) {
  const { rdv, rdv_secondaria, sub_campagna, ...lead } = row
  return {
    ...lead,
    _rdvNome: rdv?.ragione_sociale ?? null,
    _rdvSecondariaNome: rdv_secondaria?.ragione_sociale ?? null,
    _subCampagnaNome: sub_campagna?.nome ?? null,
  }
}

// ---------- Implementazione mock (fallback) ----------
function enrichLeadMock(lead) {
  const rdv = lead.rdv_id ? findRdvById(lead.rdv_id) : null
  const rdvSecondaria = lead.rdv_secondaria_id ? findRdvById(lead.rdv_secondaria_id) : null
  const subCampagna = lead.sub_campagna_id ? findSubCampagnaById(lead.sub_campagna_id) : null
  return {
    ...lead,
    _rdvNome: rdv?.ragione_sociale ?? null,
    _rdvSecondariaNome: rdvSecondaria?.ragione_sociale ?? null,
    _subCampagnaNome: subCampagna?.nome ?? null,
  }
}

function applicaFiltriMock(leads, filtri = {}) {
  return leads.filter((l) => {
    if (filtri.stato && l.stato !== filtri.stato) return false
    if (filtri.fonte && l.fonte !== filtri.fonte) return false
    if (filtri.fascia && l.fascia !== filtri.fascia) return false
    if (filtri.settore && l.settore !== filtri.settore) return false
    if (filtri.sub_campagna_id && l.sub_campagna_id !== filtri.sub_campagna_id) return false
    if (filtri.rdv_id && l.rdv_id !== filtri.rdv_id) return false
    if (filtri.parsing_ok != null && filtri.parsing_ok !== '') {
      const atteso = filtri.parsing_ok === 'true'
      if (l.parsing_ok !== atteso) return false
    }
    if (filtri.cliente && l.cliente !== filtri.cliente) return false
    if (filtri.campagna_cliente && l.campagna_cliente !== filtri.campagna_cliente) return false
    if (filtri.formato && l.formato !== filtri.formato) return false
    if (filtri.automazione && l.automazione !== filtri.automazione) return false
    if (filtri.q) {
      const q = filtri.q.toLowerCase()
      const blob = [l.id, l.nome, l.cognome, l.telefono, l.email].filter(Boolean).join(' ').toLowerCase()
      if (!blob.includes(q)) return false
    }
    return true
  })
}

// ---------- Implementazione Supabase ----------
async function fetchLeadsSupabase(filtri = {}) {
  let q = supabase.from('leads').select(SELECT_ENRICHED).order('created_at', { ascending: false })

  const eqMap = ['stato', 'fonte', 'fascia', 'settore', 'sub_campagna_id', 'rdv_id', 'cliente', 'campagna_cliente', 'formato', 'automazione']
  eqMap.forEach((campo) => {
    if (filtri[campo]) q = q.eq(campo, filtri[campo])
  })
  if (filtri.parsing_ok != null && filtri.parsing_ok !== '') {
    q = q.eq('parsing_ok', filtri.parsing_ok === 'true')
  }
  if (filtri.q) {
    const term = `%${filtri.q}%`
    q = q.or(`nome.ilike.${term},cognome.ilike.${term},telefono.ilike.${term},email.ilike.${term},id.ilike.${term}`)
  }

  const { data, error } = await q
  if (error) throw new Error(error.message)
  return (data ?? []).map(mapRowEnriched)
}

// Query delle lead filtrate. Query key conforme alla convenzione ['leads', filtri].
// Usa Supabase se configurato, altrimenti i dati mock.
export function useLeads(filtri = {}) {
  return useQuery({
    queryKey: ['leads', filtri],
    queryFn: async () => {
      if (isSupabaseConfigured) return fetchLeadsSupabase(filtri)
      await new Promise((r) => setTimeout(r, 120))
      return applicaFiltriMock(leadsMock, filtri).map(enrichLeadMock)
    },
  })
}

// Opzioni dinamiche per i Select dei filtri.
// In mock-mode derivano dai dati locali; con Supabase da una proiezione delle
// colonne rilevanti deduplicata lato client.
export function useLeadFilterOptions() {
  const enumOpts = {
    stati: STATI_LEAD,
    fonti: FONTI,
    fasce: FASCE,
    formati: FORMATI,
  }

  const { data } = useQuery({
    queryKey: ['leads', 'filter-options'],
    queryFn: async () => {
      const uniq = (arr) => [...new Set(arr.filter(Boolean))].sort()
      if (isSupabaseConfigured) {
        const { data: rows, error } = await supabase
          .from('leads')
          .select('settore, cliente, campagna_cliente, automazione, sub_campagna_id, rdv_id, sub_campagna:sub_campagna_id(nome), rdv:rdv_id(ragione_sociale)')
        if (error) throw new Error(error.message)
        const subMap = new Map()
        const rdvMap = new Map()
        rows.forEach((r) => {
          if (r.sub_campagna_id) subMap.set(r.sub_campagna_id, r.sub_campagna?.nome ?? r.sub_campagna_id)
          if (r.rdv_id) rdvMap.set(r.rdv_id, r.rdv?.ragione_sociale ?? r.rdv_id)
        })
        return {
          settori: uniq(rows.map((r) => r.settore)),
          clienti: uniq(rows.map((r) => r.cliente)),
          campagneCliente: uniq(rows.map((r) => r.campagna_cliente)),
          automazioni: uniq(rows.map((r) => r.automazione)),
          subCampagne: [...subMap].map(([value, label]) => ({ value, label })),
          rdv: [...rdvMap].map(([value, label]) => ({ value, label })),
        }
      }
      // Mock
      return {
        settori: uniq(leadsMock.map((l) => l.settore)),
        clienti: uniq(leadsMock.map((l) => l.cliente)),
        campagneCliente: uniq(leadsMock.map((l) => l.campagna_cliente)),
        automazioni: uniq(leadsMock.map((l) => l.automazione)),
        subCampagne: uniq(leadsMock.map((l) => l.sub_campagna_id)).map((id) => ({
          value: id,
          label: findSubCampagnaById(id)?.nome ?? id,
        })),
        rdv: uniq(leadsMock.map((l) => l.rdv_id)).map((id) => ({
          value: id,
          label: findRdvById(id)?.ragione_sociale ?? id,
        })),
      }
    },
  })

  // Memoizza l'unione enum + dinamici (default vuoti finché la query carica)
  return useMemo(
    () => ({
      ...enumOpts,
      settori: data?.settori ?? [],
      clienti: data?.clienti ?? [],
      campagneCliente: data?.campagneCliente ?? [],
      automazioni: data?.automazioni ?? [],
      subCampagne: data?.subCampagne ?? [],
      rdv: data?.rdv ?? [],
    }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [data],
  )
}

// Singola lead arricchita (per il drawer). Async in modalità Supabase.
export async function getLeadEnriched(id) {
  if (isSupabaseConfigured) {
    const { data, error } = await supabase.from('leads').select(SELECT_ENRICHED).eq('id', id).single()
    if (error) return null
    return mapRowEnriched(data)
  }
  const lead = leadsMock.find((l) => l.id === id)
  return lead ? enrichLeadMock(lead) : null
}
