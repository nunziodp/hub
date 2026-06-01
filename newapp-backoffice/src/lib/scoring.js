// Calcolo dello score lead (sezione 10.2 della spec).
// Logica di business critica: gestita direttamente, non delegata.
import {
  PESI_SCORING_DEFAULT,
  SCORE_FORMATO,
  SCORE_CANALE,
  SCORE_CONSENSO_SOURCE,
  PENALITA,
} from '@/constants/scoring'

// Assegna la fascia in base allo score e alle soglie del verticale (sezione 10.2).
// Esposto per ricalcolare la fascia dopo penalità applicate esternamente
// (es. -20 per duplicato in fase di import, sezione 10.3).
export function assegnaFascia(score, verticale) {
  const platinum = verticale?.soglia_platinum ?? 80
  const gold = verticale?.soglia_gold ?? 60
  const silver = verticale?.soglia_silver ?? 40
  return score >= platinum ? 'PLATINUM' : score >= gold ? 'GOLD' : score >= silver ? 'SILVER' : 'RECYCLE'
}

// Calcola score 0-100, fascia e breakdown per le 4 dimensioni.
// - lead: oggetto lead (usa formato, fonte, consent_source, riciclo_count)
// - subCampagna: sub-campagna associata (opzionale) → ne usa punteggio_base e storico
// - verticale: verticale associato (opzionale) → ne usa pesi e soglie
export function calcolaScore(lead, subCampagna, verticale) {
  const pesi = {
    fonte:    verticale?.peso_fonte    ?? PESI_SCORING_DEFAULT.fonte,
    campagna: verticale?.peso_campagna ?? PESI_SCORING_DEFAULT.campagna,
    geo:      verticale?.peso_geo      ?? PESI_SCORING_DEFAULT.geo,
    consenso: verticale?.peso_consenso ?? PESI_SCORING_DEFAULT.consenso,
  }

  // Dimensione 1 — Qualità fonte
  const scoreFonte = subCampagna
    ? subCampagna.punteggio_base
    : ((SCORE_FORMATO[lead.formato] ?? 50) + (SCORE_CANALE[lead.fonte] ?? 50)) / 2

  // Dimensione 2 — Qualità campagna (storico cache della sub-campagna)
  // Lo schema usa score_medio come storico aggregato della sub-campagna
  const scoreCampagna = subCampagna?.score_storico ?? subCampagna?.score_medio ?? 50

  // Dimensione 3 — Qualità geografica (lookup CAP non ancora implementata)
  const scoreGeo = 50

  // Dimensione 4 — Qualità consenso
  const scoreConsenso = SCORE_CONSENSO_SOURCE[lead.consent_source] ?? 50

  const scoreBase =
    (scoreFonte    * pesi.fonte    / 100) +
    (scoreCampagna * pesi.campagna / 100) +
    (scoreGeo      * pesi.geo      / 100) +
    (scoreConsenso * pesi.consenso / 100)

  // Penalità
  let penalita = 0
  if (lead.riciclo_count > 0) penalita += lead.riciclo_count * PENALITA.RICICLO_PER_TENTATIVO

  const score = Math.max(0, Math.min(100, Math.round(scoreBase - penalita)))

  const fascia = assegnaFascia(score, verticale)

  return {
    score,
    fascia,
    breakdown: {
      fonte:    Math.round(scoreFonte),
      campagna: Math.round(scoreCampagna),
      geo:      scoreGeo,
      consenso: scoreConsenso,
    },
  }
}
