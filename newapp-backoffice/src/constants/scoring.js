// Costanti dello scoring lead (sezione 10.2 della spec)
// Valori di default a livello di piattaforma; possono essere sovrascritti
// per verticale tramite la tabella `verticali`.

// Pesi delle 4 dimensioni dello score (devono sommare a 100)
export const PESI_SCORING_DEFAULT = {
  fonte:    40,   // Qualità della fonte (formato + canale)
  campagna: 30,   // Qualità storica della sub-campagna
  geo:      20,   // Qualità geografica (lookup CAP)
  consenso: 10,   // Qualità del consenso GDPR
}

// Soglie di default per assegnare la fascia in base allo score 0-100
export const FASCE = {
  PLATINUM: 80,
  GOLD:     60,
  SILVER:   40,
  // RECYCLE: tutto ciò che è sotto SILVER
}

// Dimensione 1 — Qualità fonte
// Punteggio assegnato in base al formato di acquisizione lead
export const SCORE_FORMATO = {
  CHATBOT: 90,
  LANDING: 70,
  IVR:     60,
  LEADADS: 50,
  ALTRO:   40,
}

// Punteggio assegnato in base al canale di traffico
export const SCORE_CANALE = {
  GOOGLE:    90,
  META:      75,
  TIKTOK:    65,
  AFFILIATO: 55,
  ROBOCALL:  45,
  IMPORT:    30,
}

// Dimensione 4 — Qualità consenso
export const SCORE_CONSENSO_SOURCE = {
  TRUSTEDFORM: 90,
  FORM_NATIVO: 70,
  CHATBOT:     65,
  IMPORT:      30,
}

// Penalità applicate al punteggio finale
export const PENALITA = {
  // -10 punti per ogni riciclo già subito
  RICICLO_PER_TENTATIVO: 10,
  // -20 punti se duplicato entro la finestra di 30 giorni
  DUPLICATO_30GG: 20,
  // -15 punti se il telefono risulta VoIP / non mobile
  TELEFONO_VOIP: 15,
  // -10 punti se il CAP non è valido o assente
  CAP_NON_VALIDO: 10,
}

// Default scadenza consenso (giorni) — sovrascritto per verticale
export const CONSENSO_SCADENZA_GIORNI_DEFAULT = 365
