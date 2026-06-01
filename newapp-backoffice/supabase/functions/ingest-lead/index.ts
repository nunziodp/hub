// Supabase Edge Function — ingestion lead da piattaforme esterne (sezione 12).
// URL: https://<project>.supabase.co/functions/v1/ingest-lead/<sub_campagna_id>
//
// Passi (sezione 12):
// 1. Verifica HMAC-SHA256 se la sub-campagna ha un secret configurato
// 2. Legge il payload JSON
// 3. Normalizza: telefono E.164, uppercase nome/cognome
// 4. Dedup su telefono (finestra 30 giorni)
// 5. Parsa campaign_name con parseCampaignName()
// 6. Recupera la sub-campagna (per id da URL) e il relativo verticale
// 7. Calcola lo score con calcolaScore()
// 8. Determina consent_expires_at in base al verticale
// 9. Salva in leads con stato DISPONIBILE (o RICEVUTA se parsing fallito)
// 10. Risponde 200 OK
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const supabase = createClient(
  Deno.env.get('SUPABASE_URL')!,
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
)

const GIORNI_30_MS = 30 * 24 * 3_600_000

// ---------- Parsing campaign_name (sezione 10.1) ----------
const clean = (v: string | undefined) => (!v || v === '-' || v === '' ? null : v)

function parseCampaignName(raw: string | null) {
  if (!raw) return { parsing_ok: false, fields: {} as Record<string, string | null> }
  const parts = raw.split(' | ').map((p) => p.trim())
  if (parts.length < 4) return { parsing_ok: false, fields: {} }
  const [idFull, settore, cliente, campagna_cliente, offerta, creativita, formato, fonte, versione, automazione] = parts
  const [campaign_id, campaign_child_id] = (idFull || '').split('.')
  return {
    parsing_ok: !!(settore && cliente && campagna_cliente && formato && fonte),
    fields: {
      campaign_id: clean(campaign_id),
      campaign_child_id: clean(campaign_child_id),
      settore: clean(settore),
      cliente: clean(cliente),
      campagna_cliente: clean(campagna_cliente),
      offerta: clean(offerta),
      creativita: clean(creativita),
      formato: clean(formato),
      fonte: clean(fonte),
      versione: clean(versione),
      automazione: clean(automazione),
    },
  }
}

// ---------- Scoring (sezione 10.2) ----------
const SCORE_FORMATO: Record<string, number> = { CHATBOT: 90, LANDING: 70, IVR: 60, LEADADS: 50, ALTRO: 40 }
const SCORE_CANALE: Record<string, number> = { GOOGLE: 90, META: 75, TIKTOK: 65, AFFILIATO: 55, ROBOCALL: 45, IMPORT: 30 }
const SCORE_CONSENSO: Record<string, number> = { TRUSTEDFORM: 90, FORM_NATIVO: 70, CHATBOT: 65, IMPORT: 30 }

// deno-lint-ignore no-explicit-any
function calcolaScore(lead: any, subCampagna: any, verticale: any) {
  const pesi = {
    fonte: verticale?.peso_fonte ?? 40,
    campagna: verticale?.peso_campagna ?? 30,
    geo: verticale?.peso_geo ?? 20,
    consenso: verticale?.peso_consenso ?? 10,
  }
  const scoreFonte = subCampagna
    ? subCampagna.punteggio_base
    : ((SCORE_FORMATO[lead.formato] ?? 50) + (SCORE_CANALE[lead.fonte] ?? 50)) / 2
  const scoreCampagna = subCampagna?.score_medio ?? 50
  const scoreGeo = 50
  const scoreConsenso = SCORE_CONSENSO[lead.consent_source] ?? 50

  const scoreBase =
    (scoreFonte * pesi.fonte) / 100 +
    (scoreCampagna * pesi.campagna) / 100 +
    (scoreGeo * pesi.geo) / 100 +
    (scoreConsenso * pesi.consenso) / 100

  let penalita = 0
  if (lead.riciclo_count > 0) penalita += lead.riciclo_count * 10
  if (lead.duplicato) penalita += 20

  const score = Math.max(0, Math.min(100, Math.round(scoreBase - penalita)))
  const platinum = verticale?.soglia_platinum ?? 80
  const gold = verticale?.soglia_gold ?? 60
  const silver = verticale?.soglia_silver ?? 40
  const fascia = score >= platinum ? 'PLATINUM' : score >= gold ? 'GOLD' : score >= silver ? 'SILVER' : 'RECYCLE'

  return {
    score,
    fascia,
    breakdown: { fonte: Math.round(scoreFonte), campagna: scoreCampagna, geo: scoreGeo, consenso: scoreConsenso },
  }
}

// ---------- Normalizzazione ----------
function normalizzaTelefono(tel: string | undefined): string | null {
  if (!tel) return null
  const digits = tel.replace(/[^\d+]/g, '')
  if (digits.startsWith('+')) return digits
  if (digits.startsWith('00')) return '+' + digits.slice(2)
  if (digits.startsWith('3')) return '+39' + digits // numero IT senza prefisso
  return digits
}

// ---------- Verifica HMAC-SHA256 ----------
async function verificaHmac(secret: string, body: string, firma: string | null): Promise<boolean> {
  if (!firma) return false
  const key = await crypto.subtle.importKey(
    'raw',
    new TextEncoder().encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign'],
  )
  const mac = await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(body))
  const atteso = [...new Uint8Array(mac)].map((b) => b.toString(16).padStart(2, '0')).join('')
  return atteso === firma.replace(/^sha256=/, '')
}

serve(async (req) => {
  if (req.method !== 'POST') {
    return new Response('Metodo non consentito', { status: 405 })
  }

  // sub_campagna_id dall'ultimo segmento del path
  const subCampagnaId = new URL(req.url).pathname.split('/').filter(Boolean).pop()
  if (!subCampagnaId) {
    return new Response(JSON.stringify({ errore: 'sub_campagna_id mancante nell’URL' }), { status: 400 })
  }

  const rawBody = await req.text()

  // 6. Recupera sub-campagna + verticale
  const { data: subCampagna, error: errSub } = await supabase
    .from('sub_campagne')
    .select('*')
    .eq('id', subCampagnaId)
    .single()
  if (errSub || !subCampagna) {
    return new Response(JSON.stringify({ errore: 'Sub-campagna non trovata' }), { status: 404 })
  }

  // 1. Verifica HMAC se è configurato un secret
  if (subCampagna.webhook_secret) {
    const firma = req.headers.get('x-signature') ?? req.headers.get('x-hub-signature-256')
    const valida = await verificaHmac(subCampagna.webhook_secret, rawBody, firma)
    if (!valida) {
      return new Response(JSON.stringify({ errore: 'Firma HMAC non valida' }), { status: 401 })
    }
  }

  // 2. Payload JSON
  let payload: Record<string, string>
  try {
    payload = JSON.parse(rawBody)
  } catch {
    return new Response(JSON.stringify({ errore: 'Payload JSON non valido' }), { status: 400 })
  }

  const { data: verticale } = await supabase
    .from('verticali')
    .select('*')
    .eq('id', subCampagna.verticale_id)
    .single()

  // 3. Normalizzazione
  const telefono = normalizzaTelefono(payload.telefono ?? payload.phone)
  const nome = (payload.nome ?? payload.first_name ?? '').toUpperCase() || null
  const cognome = (payload.cognome ?? payload.last_name ?? '').toUpperCase() || null

  // 4. Dedup su telefono (30gg)
  let duplicato = false
  if (telefono) {
    const da = new Date(Date.now() - GIORNI_30_MS).toISOString()
    const { count } = await supabase
      .from('leads')
      .select('id', { count: 'exact', head: true })
      .eq('telefono', telefono)
      .gte('created_at', da)
    duplicato = (count ?? 0) > 0
  }

  // 5. Parsing campaign_name
  const raw = payload.campaign_name ?? payload.campaign_name_raw ?? null
  const { parsing_ok, fields } = parseCampaignName(raw)

  // 7. Scoring
  const consent_source = (payload.consent_source ?? 'FORM_NATIVO').toUpperCase()
  const leadCalc = { ...fields, consent_source, riciclo_count: 0, duplicato }
  const { score, fascia, breakdown } = parsing_ok
    ? calcolaScore(leadCalc, subCampagna, verticale)
    : { score: null, fascia: null, breakdown: null }

  // 8. Scadenza consenso in base al verticale
  const giorniScadenza = verticale?.consenso_scadenza_giorni ?? 365
  const consentExpires = new Date(Date.now() + giorniScadenza * 24 * 3_600_000).toISOString()

  const now = new Date().toISOString()

  // 9. Insert lead
  const { data: inserita, error: errIns } = await supabase
    .from('leads')
    .insert({
      created_at: now,
      nome,
      cognome,
      telefono,
      email: payload.email ?? null,
      cap: payload.cap ?? null,
      consent_given: true,
      consent_date: now,
      consent_proof: payload.consent_proof ?? null,
      consent_source,
      consent_expires_at: consentExpires,
      campaign_name_raw: raw,
      ...fields,
      sub_campagna_id: subCampagnaId,
      parsing_ok,
      score,
      score_breakdown: breakdown,
      fascia,
      stato: parsing_ok ? 'DISPONIBILE' : 'RICEVUTA',
    })
    .select('id')
    .single()

  if (errIns) {
    return new Response(JSON.stringify({ errore: errIns.message }), { status: 500 })
  }

  // 10. OK
  return new Response(
    JSON.stringify({ ok: true, lead_id: inserita.id, parsing_ok, score, fascia, duplicato }),
    { status: 200, headers: { 'content-type': 'application/json' } },
  )
})
