// Parsing del campaign_name grezzo ricevuto dalle piattaforme (sezione 10.1).
// Formato atteso: "ID.CHILD | SETTORE | CLIENTE | CAMPAGNA | OFFERTA | CREATIVITA | FORMATO | FONTE | VERSIONE | AUTOMAZIONE"
// I segmenti sono separati da " | "; il primo segmento può contenere
// l'id campagna e l'id figlio separati da un punto (es. "CMP001.V01").

// Considera vuoto/assente i valori nulli, stringa vuota o trattino "-"
const clean = (v) => (!v || v === '-' || v === '') ? null : v

export function parseCampaignName(raw) {
  if (!raw) return { parsing_ok: false, fields: {} }

  const parts = raw.split(' | ').map((p) => p.trim())

  // Servono almeno i 4 campi minimi (id, settore, cliente, campagna)
  if (parts.length < 4) return { parsing_ok: false, fields: {} }

  const [
    idFull,
    settore,
    cliente,
    campagna_cliente,
    offerta,
    creativita,
    formato,
    fonte,
    versione,
    automazione,
  ] = parts

  const [campaign_id, campaign_child_id] = (idFull || '').split('.')

  // Il parsing è valido solo se i campi essenziali per lo scoring sono presenti
  const parsing_ok = !!(settore && cliente && campagna_cliente && formato && fonte)

  return {
    parsing_ok,
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
