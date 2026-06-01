import { useMutation, useQueryClient } from '@tanstack/react-query'

import { supabase, isSupabaseConfigured } from '@/lib/supabase'
import { leadsMock, findVerticaleByNome } from '@/lib/mockData'
import { parseCampaignName } from '@/lib/parseCampaignName'
import { calcolaScore, assegnaFascia } from '@/lib/scoring'
import { PENALITA } from '@/constants/scoring'

const GIORNI_30_MS = 30 * 24 * 3_600_000

// Colonne riconosciute nel CSV (header case-insensitive)
export const COLONNE_IMPORT = [
  'nome', 'cognome', 'telefono', 'email', 'cap',
  'campaign_name', 'consent_source', 'consent_proof',
]

// Parser CSV minimale con supporto a campi tra virgolette.
// Restituisce un array di oggetti chiave→valore basato sull'header.
export function parseCsv(testo) {
  const righe = testo
    .split(/\r?\n/)
    .map((r) => r.trim())
    .filter(Boolean)
  if (righe.length < 2) return []

  const splitRiga = (riga) => {
    const out = []
    let cur = ''
    let inQuote = false
    for (let i = 0; i < riga.length; i++) {
      const c = riga[i]
      if (c === '"') inQuote = !inQuote
      else if (c === ',' && !inQuote) {
        out.push(cur)
        cur = ''
      } else cur += c
    }
    out.push(cur)
    return out.map((v) => v.trim())
  }

  const header = splitRiga(righe[0]).map((h) => h.toLowerCase())
  return righe.slice(1).map((riga) => {
    const valori = splitRiga(riga)
    const obj = {}
    header.forEach((h, i) => {
      obj[h] = valori[i] ?? ''
    })
    return obj
  })
}

// Telefono "normalizzato" in modo elementare (solo per dedup nel mock)
function normTel(t) {
  return (t ?? '').replace(/[^\d+]/g, '')
}

// Prepara e valida le righe importate (sezioni 10.1/10.2/10.3 e 12).
// Per ogni riga: parsing campaign_name, dedup su telefono (30gg), scoring.
export function preparaRighe(rows) {
  const ora = Date.now()
  return rows.map((r, i) => {
    const raw = r.campaign_name ?? ''
    const { parsing_ok, fields } = parseCampaignName(raw)
    const consent_source = (r.consent_source || 'IMPORT').toUpperCase()
    const telefono = normTel(r.telefono)

    // Dedup: stesso telefono ricevuto entro la finestra di 30 giorni
    const duplicato =
      !!telefono &&
      leadsMock.some(
        (l) => normTel(l.telefono) === telefono && ora - new Date(l.created_at).getTime() < GIORNI_30_MS,
      )

    const base = {
      nome: r.nome || null,
      cognome: r.cognome || null,
      telefono: telefono || null,
      email: r.email || null,
      cap: r.cap || null,
      consent_source,
      consent_proof: r.consent_proof || null,
      campaign_name_raw: raw || null,
      ...fields,
      riciclo_count: 0,
    }

    let score = null
    let fascia = null
    let breakdown = null
    if (parsing_ok) {
      const verticale = fields.settore ? findVerticaleByNome(fields.settore) : null
      const res = calcolaScore(base, null, verticale)
      score = res.score
      breakdown = res.breakdown
      // Penalità duplicato (sezione 10.3): -20, non bloccante, fascia ricalcolata
      if (duplicato) {
        score = Math.max(0, score - PENALITA.DUPLICATO_30GG)
        fascia = assegnaFascia(score, verticale)
      } else {
        fascia = res.fascia
      }
    }

    return {
      _riga: i + 2, // +2: header + base 1
      ...base,
      parsing_ok,
      duplicato,
      score,
      fascia,
      score_breakdown: breakdown,
    }
  })
}

// Mutation: committa le righe preparate creando nuove lead nel mock.
// parsing_ok → DISPONIBILE (distribuibile); altrimenti RICEVUTA (va in revisione).
export function useCommitImport() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (righe) => {
      const at = new Date().toISOString()

      // Costruisce il payload di una lead a partire da una riga preparata
      const buildLead = (r) => ({
        created_at: at,
        nome: r.nome,
        cognome: r.cognome,
        telefono: r.telefono,
        email: r.email,
        cap: r.cap,
        consent_given: true,
        consent_date: at,
        consent_proof: r.consent_proof,
        consent_source: r.consent_source,
        consent_scope: ['marketing'],
        gdpr_audit_log: [{ at, azione: 'consent_given', source: 'IMPORT' }],
        campaign_name_raw: r.campaign_name_raw,
        campaign_id: r.campaign_id ?? null,
        campaign_child_id: r.campaign_child_id ?? null,
        settore: r.settore ?? null,
        cliente: r.cliente ?? null,
        campagna_cliente: r.campagna_cliente ?? null,
        offerta: r.offerta ?? null,
        creativita: r.creativita ?? null,
        formato: r.formato ?? null,
        fonte: r.fonte ?? null,
        versione: r.versione ?? null,
        automazione: r.automazione ?? null,
        parsing_ok: r.parsing_ok,
        score: r.score,
        score_breakdown: r.score_breakdown,
        fascia: r.fascia,
        stato: r.parsing_ok ? 'DISPONIBILE' : 'RICEVUTA',
        riciclo_count: 0,
        lista_fredda: false,
      })

      if (isSupabaseConfigured) {
        const { error } = await supabase.from('leads').insert(righe.map(buildLead))
        if (error) throw new Error(error.message)
        return { count: righe.length }
      }

      await new Promise((r) => setTimeout(r, 250))
      righe.forEach((r, i) => {
        leadsMock.push({
          id: `lead-imp-${Date.now()}-${i}`,
          created_at: at,
          nome: r.nome,
          cognome: r.cognome,
          telefono: r.telefono,
          email: r.email,
          cap: r.cap,
          consent_given: true,
          consent_date: at,
          consent_proof: r.consent_proof,
          consent_source: r.consent_source,
          consent_version: null,
          consent_scope: ['marketing'],
          consent_expires_at: null,
          consent_revoked_at: null,
          gdpr_audit_log: [{ at, azione: 'consent_given', source: 'IMPORT' }],
          campaign_name_raw: r.campaign_name_raw,
          campaign_id: r.campaign_id ?? null,
          campaign_child_id: r.campaign_child_id ?? null,
          settore: r.settore ?? null,
          cliente: r.cliente ?? null,
          campagna_cliente: r.campagna_cliente ?? null,
          offerta: r.offerta ?? null,
          creativita: r.creativita ?? null,
          formato: r.formato ?? null,
          fonte: r.fonte ?? null,
          versione: r.versione ?? null,
          automazione: r.automazione ?? null,
          sub_campagna_id: null,
          parsing_ok: r.parsing_ok,
          score: r.score,
          score_breakdown: r.score_breakdown,
          fascia: r.fascia,
          stato: r.parsing_ok ? 'DISPONIBILE' : 'RICEVUTA',
          rdv_id: null,
          rdv_secondaria_id: null,
          consegnata_at: null,
          riciclo_count: 0,
          lista_fredda: false,
          lista_fredda_at: null,
        })
      })
      return { count: righe.length }
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['leads'] }),
  })
}
