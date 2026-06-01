import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'

import { supabase, isSupabaseConfigured } from '@/lib/supabase'
import { leadsMock } from '@/lib/mockData'

const GIORNI_30_MS = 30 * 24 * 3_600_000

// Filtra le lead di un contatto (telefono o email) su un elenco già caricato.
// Lavora su un array in memoria → utilizzabile in modo sincrono dal componente.
export function findLeadsByContatto(valore, leads = []) {
  if (!valore || !valore.trim()) return []
  const v = valore.trim().toLowerCase()
  return leads.filter(
    (l) =>
      (l.telefono && l.telefono.toLowerCase().includes(v)) ||
      (l.email && l.email.toLowerCase().includes(v)),
  )
}

// Costruisce KPI, scadenze e audit trail a partire dall'elenco lead.
function buildReport(leads) {
  const now = Date.now()
  const attive = leads.filter((l) => l.consent_given && !l.consent_revoked_at)

  const consensiValidi = attive.filter(
    (l) => l.consent_expires_at && new Date(l.consent_expires_at).getTime() > now,
  ).length

  const scadenze = attive
    .filter((l) => {
      if (!l.consent_expires_at) return false
      const exp = new Date(l.consent_expires_at).getTime()
      return exp > now && exp <= now + GIORNI_30_MS
    })
    .sort((a, b) => new Date(a.consent_expires_at) - new Date(b.consent_expires_at))

  const scaduti = attive.filter(
    (l) => l.consent_expires_at && new Date(l.consent_expires_at).getTime() < now,
  ).length

  const richiesteAccessoAperte = leads.reduce(
    (acc, l) => acc + (l.gdpr_audit_log ?? []).filter((e) => e.azione === 'access_request' && !e.evasa).length,
    0,
  )

  const auditTrail = leads
    .flatMap((l) =>
      (l.gdpr_audit_log ?? []).map((e) => ({
        ...e,
        lead_id: l.id,
        telefono: l.telefono,
        _ageMs: now - new Date(e.at).getTime(),
      })),
    )
    .sort((a, b) => new Date(b.at) - new Date(a.at))

  return {
    kpi: { consensiValidi, inScadenza30: scadenze.length, scaduti, richiesteAccessoAperte },
    scadenze,
    auditTrail,
    leads,
  }
}

// Report GDPR (sezione 9.8): KPI + scadenze + audit trail + elenco lead.
export function useGdprData() {
  return useQuery({
    queryKey: ['gdpr', 'report'],
    queryFn: async () => {
      if (isSupabaseConfigured) {
        const { data, error } = await supabase
          .from('leads')
          .select('id, nome, cognome, telefono, email, stato, consent_given, consent_source, consent_date, consent_expires_at, consent_revoked_at, gdpr_audit_log')
        if (error) throw new Error(error.message)
        return buildReport(data ?? [])
      }
      await new Promise((r) => setTimeout(r, 120))
      return buildReport(leadsMock)
    },
  })
}

// Mutation: revoca totale del consenso per tutte le lead di un contatto.
export function useRevocaTotale() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async ({ contatto }) => {
      const at = new Date().toISOString()
      if (isSupabaseConfigured) {
        const term = `%${contatto.trim()}%`
        const { data: trovate, error: e1 } = await supabase
          .from('leads')
          .select('id, gdpr_audit_log')
          .or(`telefono.ilike.${term},email.ilike.${term}`)
        if (e1) throw new Error(e1.message)
        if (!trovate?.length) throw new Error('Nessuna lead trovata per il contatto indicato.')
        // Update per ciascuna lead (append audit + stato BLOCCATA + revoca)
        for (const l of trovate) {
          const log = [...(l.gdpr_audit_log ?? []), { at, azione: 'consent_revoked', source: 'BACKOFFICE' }]
          const { error } = await supabase
            .from('leads')
            .update({ consent_revoked_at: at, stato: 'BLOCCATA', gdpr_audit_log: log })
            .eq('id', l.id)
          if (error) throw new Error(error.message)
        }
        return { count: trovate.length }
      }

      await new Promise((r) => setTimeout(r, 200))
      const trovate = findLeadsByContatto(contatto, leadsMock)
      if (trovate.length === 0) throw new Error('Nessuna lead trovata per il contatto indicato.')
      trovate.forEach((l) => {
        l.consent_revoked_at = at
        l.stato = 'BLOCCATA'
        l.gdpr_audit_log = [...(l.gdpr_audit_log ?? []), { at, azione: 'consent_revoked', source: 'BACKOFFICE' }]
      })
      return { count: trovate.length }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['gdpr'] })
      queryClient.invalidateQueries({ queryKey: ['leads'] })
    },
  })
}
