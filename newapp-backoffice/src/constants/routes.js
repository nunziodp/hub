// Tutte le route dell'applicazione raccolte in un'unica fonte di verità
// Sezione 3 della spec
export const ROUTES = {
  // Auth
  LOGIN: '/login',

  // Dashboard
  DASHBOARD: '/dashboard',

  // Campagne
  CAMPAGNE: '/campagne',

  // RDV
  RDV: '/rdv',
  RDV_TUTTE: '/rdv/tutte',
  RDV_ATTIVE: '/rdv/attive',
  RDV_FATTURAZIONE: '/rdv/fatturazione',
  RDV_DETTAGLIO: '/rdv/:id',
  rdvDettaglio: (id) => `/rdv/${id}`,

  // Statistiche
  STAT_FONTI: '/statistiche/fonti',
  STAT_RDV:   '/statistiche/rdv',
  STAT_GDPR:  '/statistiche/gdpr',

  // Lead
  LEAD:                '/lead',
  LEAD_TUTTE:          '/lead/tutte',
  LEAD_REVISIONE:      '/lead/revisione',
  LEAD_RICICLO:        '/lead/riciclo',
  LEAD_LISTE_FREDDE:   '/lead/liste-fredde',
  LEAD_IMPORTA:        '/lead/importa',
}
