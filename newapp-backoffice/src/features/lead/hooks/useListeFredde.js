import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'

import { supabase, isSupabaseConfigured } from '@/lib/supabase'
import { leadsMock, pacchettiFreddiMock, leadInPacchetto, findRdvById } from '@/lib/mockData'

// Prezzo di stima per lead fredda, usato solo per il KPI "valore potenziale"
export const PREZZO_STIMA_FREDDA = 3.0

const inMeseCorrente = (iso) => {
  if (!iso) return false
  const d = new Date(iso)
  const now = new Date()
  return d.getFullYear() === now.getFullYear() && d.getMonth() === now.getMonth()
}

function nLeadPacchettoMock(p) {
  return p.n_lead ?? (p.lead_ids?.length ?? 0)
}

// Dati della sezione Liste fredde (sezione 9.7): pool + pacchetti + KPI.
export function useListeFredde() {
  return useQuery({
    queryKey: ['leads', 'liste-fredde'],
    queryFn: async () => {
      if (isSupabaseConfigured) {
        // Lead già in un pacchetto (da escludere dal pool)
        const { data: pl } = await supabase.from('pacchetti_freddi_leads').select('lead_id')
        const inPkg = new Set((pl ?? []).map((r) => r.lead_id))

        const { data: leads, error: eLead } = await supabase
          .from('leads')
          .select('*')
          .eq('lista_fredda', true)
          .in('stato', ['LISTA_FREDDA', 'DISPONIBILE'])
        if (eLead) throw new Error(eLead.message)
        const pool = (leads ?? []).filter((l) => !inPkg.has(l.id))

        const { data: pkgs, error: ePkg } = await supabase
          .from('pacchetti_freddi')
          .select('*, leads:pacchetti_freddi_leads(lead_id), rdv:rdv_id(ragione_sociale)')
        if (ePkg) throw new Error(ePkg.message)
        const pacchetti = (pkgs ?? []).map((p) => {
          const _nLead = p.leads?.length ?? 0
          return {
            ...p,
            _nLead,
            _ricavo: _nLead * p.prezzo_per_lead,
            _rdvNome: p.rdv?.ragione_sociale ?? 'Tutte le RDV',
          }
        })

        // Lo schema non ha venduto_at: per "venduti nel mese" usiamo created_at come proxy
        const vendutiMese = pacchetti.filter((p) => p.stato === 'venduto' && inMeseCorrente(p.created_at))
        return {
          pool,
          pacchetti,
          kpi: {
            leadDisponibili: pool.length,
            valorePotenziale: pool.length * PREZZO_STIMA_FREDDA,
            pacchettiVendutiMese: vendutiMese.length,
            ricavoGenerato: vendutiMese.reduce((a, p) => a + p._ricavo, 0),
          },
        }
      }

      // ---------- Mock ----------
      await new Promise((r) => setTimeout(r, 120))
      const inPacchetto = leadInPacchetto()
      const pool = leadsMock.filter(
        (l) =>
          l.lista_fredda === true &&
          ['LISTA_FREDDA', 'DISPONIBILE'].includes(l.stato) &&
          !inPacchetto.has(l.id),
      )
      const pacchetti = pacchettiFreddiMock.map((p) => ({
        ...p,
        _nLead: nLeadPacchettoMock(p),
        _ricavo: nLeadPacchettoMock(p) * p.prezzo_per_lead,
        _rdvNome: p.rdv_id ? findRdvById(p.rdv_id)?.ragione_sociale : 'Tutte le RDV',
      }))
      const vendutiMese = pacchetti.filter((p) => p.stato === 'venduto' && inMeseCorrente(p.venduto_at))
      return {
        pool,
        pacchetti,
        kpi: {
          leadDisponibili: pool.length,
          valorePotenziale: pool.length * PREZZO_STIMA_FREDDA,
          pacchettiVendutiMese: vendutiMese.length,
          ricavoGenerato: vendutiMese.reduce((a, p) => a + p._ricavo, 0),
        },
      }
    },
  })
}

// Mutation: crea un pacchetto dalle lead selezionate.
export function useCreaPacchetto() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async ({ nome, rdv_id, prezzo_per_lead, scadenza_at, note, leadIds }) => {
      if (isSupabaseConfigured) {
        const { data: pkg, error: e1 } = await supabase
          .from('pacchetti_freddi')
          .insert({ nome, rdv_id: rdv_id || null, prezzo_per_lead, scadenza_at: scadenza_at || null, note: note || null, stato: 'attivo' })
          .select('id')
          .single()
        if (e1) throw new Error(e1.message)
        if (leadIds?.length) {
          const righe = leadIds.map((lead_id) => ({ pacchetto_id: pkg.id, lead_id }))
          const { error: e2 } = await supabase.from('pacchetti_freddi_leads').insert(righe)
          if (e2) throw new Error(e2.message)
        }
        return pkg
      }

      await new Promise((r) => setTimeout(r, 150))
      const nuovo = {
        id: `pkg-${Date.now()}`,
        created_at: new Date().toISOString(),
        nome,
        rdv_id: rdv_id || null,
        prezzo_per_lead,
        scadenza_at: scadenza_at || null,
        stato: 'attivo',
        note: note || null,
        lead_ids: leadIds,
        venduto_at: null,
      }
      pacchettiFreddiMock.push(nuovo)
      return nuovo
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['leads'] }),
  })
}

// Mutation: segna un pacchetto come venduto.
export function useVendiPacchetto() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async ({ pacchettoId }) => {
      if (isSupabaseConfigured) {
        const { error } = await supabase.from('pacchetti_freddi').update({ stato: 'venduto' }).eq('id', pacchettoId)
        if (error) throw new Error(error.message)
        return { id: pacchettoId }
      }
      await new Promise((r) => setTimeout(r, 150))
      const p = pacchettiFreddiMock.find((x) => x.id === pacchettoId)
      if (!p) throw new Error('Pacchetto non trovato')
      p.stato = 'venduto'
      p.venduto_at = new Date().toISOString()
      return p
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['leads'] }),
  })
}
