// Vocabolari di dominio — valori enum che corrispondono ai check constraint
// presenti nello schema Supabase (sezione 5 della spec)

// Stati possibili di una lead lungo il ciclo di vita
export const STATI_LEAD = [
  'RICEVUTA',
  'DISPONIBILE',
  'ASSEGNATA',
  'CONSEGNATA',
  'ERRORE_CONSEGNA',
  'IN_LAVORAZIONE',
  'CONTATTATA',
  'CHIUSA_WON',
  'CHIUSA_LOST',
  'NON_CONTATTATA',
  'IN_RICICLO',
  'RICICLATA',
  'LISTA_FREDDA',
  'SCADUTA',
  'BLOCCATA',
]

// Stati della RDV (cliente acquirente di lead)
export const STATI_RDV = ['attiva', 'sospesa', 'in_prova', 'archiviata']

// Tier commerciale RDV
export const TIER_RDV = ['A', 'B', 'C']

// Algoritmi di distribuzione lead alla RDV
export const ALGORITMI_DISTRIBUZIONE = ['proporzionale', 'priority', 'esclusivo']

// Metodi di integrazione per consegnare le lead alla RDV
export const METODI_INTEGRAZIONE = ['webhook', 'api_pull', 'portale', 'email']

// Tipo di autenticazione del webhook (CRM RDV o sub-campagna)
export const WEBHOOK_AUTH_TYPES = ['bearer', 'hmac', 'none']

// Verticali di mercato gestiti dalla piattaforma
export const VERTICALI = [
  'ENERGIA',
  'TELEFONIA',
  'FOTOVOLTAICO',
  'DEPURATORI',
  'HOME_IMPROVEMENT',
]

// Formato della sub-campagna
export const FORMATI = ['LEADADS', 'LANDING', 'CHATBOT', 'IVR', 'ALTRO']

// Settore parsato dal campaign_name (è lo stesso elenco dei verticali, ma è
// un campo distinto a livello di lead perché viene dal parsing)
export const SETTORI = VERTICALI

// Fonti / canali di traffico (acquisition source)
export const FONTI = ['GOOGLE', 'META', 'TIKTOK', 'AFFILIATO', 'ROBOCALL', 'IMPORT']

// Fonti del consenso GDPR
export const CONSENT_SOURCES = ['FORM_NATIVO', 'TRUSTEDFORM', 'IMPORT', 'CHATBOT']

// Fasce di score
export const FASCE = ['PLATINUM', 'GOLD', 'SILVER', 'RECYCLE']

// Stati possibili della sub-campagna
export const STATI_SUB_CAMPAGNA = ['attiva', 'in_pausa']

// Tipi di movimento wallet
export const TIPI_MOVIMENTO_WALLET = ['lead_ricevuta', 'ricarica', 'rettifica']

// Stati pacchetto freddo
export const STATI_PACCHETTO_FREDDO = ['attivo', 'venduto', 'scaduto']
