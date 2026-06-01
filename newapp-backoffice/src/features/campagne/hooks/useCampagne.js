import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'

import { supabase, isSupabaseConfigured } from '@/lib/supabase'
import { verticaliMock, subCampagneMock, leadsMock } from '@/lib/mockData'

// Arricchisce una sub-campagna con CPL, ultima lead e flag anomalia.
// ultimoBySub: mappa sub_campagna_id → ISO della lead più recente.
function enrichSubCampagna(s, ultimoBySub) {
  const cpl = s.lead_30gg > 0 ? s.spend_30gg / s.lead_30gg : 0
  const ultimo = ultimoBySub[s.id] ?? null
  let anomalia = false
  if (s.stato === 'attiva') {
    if (!ultimo) anomalia = true
    else anomalia = (Date.now() - new Date(ultimo).getTime()) / 3_600_000 > s.soglia_alert_ore
  }
  return { ...s, cpl, ultimo_lead_at: ultimo, anomalia }
}

function raggruppa(verticali, subCampagne, ultimoBySub) {
  const vert = verticali.map((v) => {
    const subs = subCampagne.filter((s) => s.verticale_id === v.id).map((s) => enrichSubCampagna(s, ultimoBySub))
    return { ...v, subCampagne: subs, totale: subs.length, attive: subs.filter((s) => s.stato === 'attiva').length }
  })
  const lead30gg = subCampagne.reduce((a, s) => a + (s.lead_30gg ?? 0), 0)
  const spend30gg = subCampagne.reduce((a, s) => a + (s.spend_30gg ?? 0), 0)
  return {
    verticali: vert,
    kpi: {
      lead30gg,
      spend30gg,
      cplMedio: lead30gg > 0 ? spend30gg / lead30gg : 0,
      attive: subCampagne.filter((s) => s.stato === 'attiva').length,
      totale: subCampagne.length,
    },
  }
}

// Query principale: verticali con sub-campagne arricchite + KPI globali.
export function useCampagne() {
  return useQuery({
    queryKey: ['campagne'],
    queryFn: async () => {
      if (isSupabaseConfigured) {
        const [{ data: verticali }, { data: subCampagne }, { data: leads }] = await Promise.all([
          supabase.from('verticali').select('*'),
          supabase.from('sub_campagne').select('*'),
          supabase.from('leads').select('sub_campagna_id, created_at').not('sub_campagna_id', 'is', null),
        ])
        const ultimoBySub = {}
        ;(leads ?? []).forEach((l) => {
          if (!ultimoBySub[l.sub_campagna_id] || l.created_at > ultimoBySub[l.sub_campagna_id]) {
            ultimoBySub[l.sub_campagna_id] = l.created_at
          }
        })
        return raggruppa(verticali ?? [], subCampagne ?? [], ultimoBySub)
      }

      await new Promise((r) => setTimeout(r, 120))
      const ultimoBySub = {}
      leadsMock.forEach((l) => {
        if (!l.sub_campagna_id) return
        if (!ultimoBySub[l.sub_campagna_id] || l.created_at > ultimoBySub[l.sub_campagna_id]) {
          ultimoBySub[l.sub_campagna_id] = l.created_at
        }
      })
      return raggruppa(verticaliMock, subCampagneMock, ultimoBySub)
    },
  })
}

// Mutation: crea una nuova sub-campagna sotto un verticale.
export function useCreaSubCampagna() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async ({ verticale_id, nome, formato, punteggio_base, soglia_alert_ore, stato }) => {
      if (isSupabaseConfigured) {
        const { data, error } = await supabase
          .from('sub_campagne')
          .insert({ verticale_id, nome, formato, punteggio_base, soglia_alert_ore, stato })
          .select('id')
          .single()
        if (error) throw new Error(error.message)
        return data
      }
      await new Promise((r) => setTimeout(r, 150))
      const nuova = {
        id: `sub-${Date.now()}`,
        created_at: new Date().toISOString(),
        verticale_id, nome, formato, punteggio_base, soglia_alert_ore, stato,
        webhook_url: null, webhook_secret: null, webhook_ultimo_test: null, webhook_ultimo_esito: null,
        lead_30gg: 0, score_medio: 0, tasso_contatto: 0, spend_30gg: 0, campagne_collegate: [],
      }
      subCampagneMock.push(nuova)
      return nuova
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['campagne'] }),
  })
}
